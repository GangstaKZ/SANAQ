-- SANAQ - Inventory Manager - Supabase Schema
-- Скопируй целиком в Supabase SQL Editor и нажми Run

-- 1. Products
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sku text,
  barcode text unique,
  quantity int default 0,
  min_stock int default 5,
  buy_price numeric default 0,
  sell_price numeric default 0,
  category text,
  created_at timestamp default now()
);

-- 2. Movements (приходы и продажи)
create table if not exists movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete set null,
  type text check (type in ('INCOME','SALE','WRITE_OFF')),
  qty int not null,
  created_at timestamp default now()
);

-- 3. Suppliers
create table if not exists suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  created_at timestamp default now()
);

-- RLS для портфолио (открытый доступ)
alter table products enable row level security;
alter table movements enable row level security;
alter table suppliers enable row level security;

drop policy if exists "public access" on products;
drop policy if exists "public access" on movements;
drop policy if exists "public access" on suppliers;

create policy "public access" on products for all using (true) with check (true);
create policy "public access" on movements for all using (true) with check (true);
create policy "public access" on suppliers for all using (true) with check (true);

-- Demo data для SANAQ (20 товаров продуктового магазина)
insert into products (name, sku, barcode, quantity, min_stock, buy_price, sell_price, category) values
('Молоко 3.2% 1л', 'MLK001', '487000100001', 12, 5, 350, 450, 'Молочка'),
('Хлеб бородинский', 'BRD002', '487000100002', 3, 10, 200, 280, 'Выпечка'),
('Яйца С1 10шт', 'EGG003', '487000100003', 25, 8, 500, 650, 'Молочка'),
('Сахар 1кг', 'SGR004', '487000100004', 40, 10, 400, 520, 'Бакалея'),
('Масло подсолнечное 1л', 'OIL005', '487000100005', 2, 5, 800, 1050, 'Бакалея'),
('Рис круглый 1кг', 'RCE006', '487000100006', 18, 5, 600, 780, 'Бакалея'),
('Чай черный 100г', 'TEA007', '487000100007', 9, 4, 450, 600, 'Напитки'),
('Кофе растворимый 95г', 'COF008', '487000100008', 6, 3, 1200, 1550, 'Напитки'),
('Вода 5л', 'WTR009', '487000100009', 15, 6, 300, 450, 'Напитки'),
('Сок яблочный 1л', 'JCE010', '487000100010', 4, 5, 500, 680, 'Напитки'),
('Колбаса Докторская 500г', 'SGS011', '487000100011', 7, 3, 1100, 1450, 'Колбасы'),
('Сыр Российский 1кг', 'CHS012', '487000100012', 3, 2, 2800, 3500, 'Молочка'),
('Курица филе 1кг', 'CHK013', '487000100013', 10, 4, 1500, 1900, 'Мясо'),
('Мука 2кг', 'FLR014', '487000100014', 22, 5, 650, 850, 'Бакалея'),
('Макароны 400г', 'PST015', '487000100015', 30, 10, 350, 480, 'Бакалея'),
('Шоколад Alpen Gold', 'CHC016', '487000100016', 35, 10, 450, 620, 'Сладости'),
('Печенье Юбилейное', 'CKI017', '487000100017', 11, 5, 380, 520, 'Сладости'),
('Шампунь Head&Shoulders', 'SHP018', '487000100018', 8, 3, 1300, 1750, 'Бытовая химия'),
('Мыло хозяйственное', 'SOP019', '487000100019', 20, 5, 180, 250, 'Бытовая химия'),
('Батарейки AA 4шт', 'BTR020', '487000100020', 2, 5, 600, 850, 'Хозтовары')
on conflict (barcode) do nothing;

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
