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
  product_id uuid references products(id) on delete cascade,
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
('Батарейки AA 4шт', 'BTR020', '487000100020', 2, 5, 600, 850, 'Хозтовары');
