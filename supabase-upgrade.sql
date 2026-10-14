begin;
-- Historical prices and names survive catalog changes.
-- The original schema used timestamp without time zone; normalize old rows as UTC.
do $$ declare tab text; begin
  foreach tab in array array['products','movements','suppliers'] loop
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name=tab and column_name='created_at' and data_type='timestamp without time zone') then
      execute format('alter table public.%I alter column created_at type timestamptz using created_at at time zone ''UTC''', tab);
    end if;
  end loop;
end $$;
alter table movements add column if not exists unit_price numeric not null default 0;
alter table movements add column if not exists product_name text;
alter table movements add column if not exists sale_id uuid;
alter table movements drop constraint if exists movements_product_id_fkey;
alter table movements add constraint movements_product_id_fkey foreign key (product_id) references products(id) on delete set null;
alter table products drop constraint if exists products_nonnegative;
alter table products add constraint products_nonnegative check (quantity >= 0 and min_stock >= 0 and buy_price >= 0 and sell_price >= 0);
alter table movements drop constraint if exists movements_positive_qty;
alter table movements add constraint movements_positive_qty check (qty > 0);

create table if not exists sanaq_operations (id uuid primary key, created_at timestamptz default now());
alter table sanaq_operations enable row level security;
drop policy if exists "public access" on sanaq_operations;
create policy "public access" on sanaq_operations for all using (true) with check (true);

-- Idempotent operation: all line items commit or roll back together.
create or replace function sanaq_apply(operation_id uuid, payload jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare item jsonb; p products%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(operation_id::text));
  if exists(select 1 from sanaq_operations where id = operation_id) then return; end if;
  if payload->>'type' = 'sale' then
    -- Consistent lock order avoids deadlocks across simultaneous carts.
    perform 1 from products where id in (select (value->>'product_id')::uuid from jsonb_array_elements(payload->'items')) order by id for update;
    for item in select value from jsonb_array_elements(payload->'items') loop
      select * into p from products where id = (item->>'product_id')::uuid for update;
      if not found or (item->>'qty')::int <= 0 or p.quantity < (item->>'qty')::int then
        raise exception 'Недостаточно товара: %', item->>'product_name';
      end if;
      if p.sell_price <> (item->>'unit_price')::numeric then raise exception 'Цена изменилась: %', p.name; end if;
      update products set quantity = quantity - (item->>'qty')::int where id = p.id;
      insert into movements(id, product_id, type, qty, created_at, unit_price, product_name, sale_id)
      values ((item->>'id')::uuid,p.id,'SALE',(item->>'qty')::int,(item->>'created_at')::timestamptz,(item->>'unit_price')::numeric,item->>'product_name',(item->>'sale_id')::uuid);
    end loop;
  elsif payload->>'type' = 'products' then
    for item in select value from jsonb_array_elements(payload->'products') loop
      select * into p from products where id=(item->>'id')::uuid for update;
      if found and payload->'expected'->>(item->>'id') is not null and p.quantity <> (payload->'expected'->>(item->>'id'))::int then
        raise exception 'Остаток изменился на другом устройстве: %', p.name;
      end if;
      insert into products(id,name,sku,barcode,quantity,min_stock,buy_price,sell_price,category,created_at)
      values ((item->>'id')::uuid,item->>'name',item->>'sku',nullif(item->>'barcode',''),(item->>'quantity')::int,(item->>'min_stock')::int,(item->>'buy_price')::numeric,(item->>'sell_price')::numeric,item->>'category',(item->>'created_at')::timestamptz)
      on conflict (id) do update set name=excluded.name,sku=excluded.sku,barcode=excluded.barcode,quantity=excluded.quantity,min_stock=excluded.min_stock,buy_price=excluded.buy_price,sell_price=excluded.sell_price,category=excluded.category;
    end loop;
  elsif payload->>'type' = 'delete' then
    delete from products where id=(payload->>'id')::uuid;
  elsif payload->>'type' = 'supplier' then
    item := payload->'supplier';
    insert into suppliers(id,name,phone) values ((item->>'id')::uuid,item->>'name',item->>'phone')
    on conflict (id) do update set name=excluded.name,phone=excluded.phone;
  else raise exception 'Unknown operation';
  end if;
  insert into sanaq_operations(id) values (operation_id);
end;
$$;

-- Realtime, safe to run more than once.
do $$ declare tab text; begin
  foreach tab in array array['products','movements','suppliers'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename=tab and schemaname='public') then
      execute format('alter publication supabase_realtime add table public.%I',tab);
    end if;
  end loop;
end $$;

commit;
