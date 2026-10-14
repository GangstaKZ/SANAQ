# AGENTS.md - Инструкция для Codex

## Проект: SANAQ - Менеджер инвентаризации для местного бизнеса
SANAQ (с каз. "санақ" - подсчет, инвентаризация) - SaaS для маленьких магазинов в Казахстане. Заменяет Excel. Работает как PWA на телефоне со сканером штрих-кодов.

Слоган: SANAQ — барлық тауар бақылауда
Логотип: две коробки с штрих-кодом и галочкой, цвета navy #0F2A4A + green #1AFF6C

Цель портфолио: показать уровень Middle Frontend на React.

## СТЕК - НЕ МЕНЯТЬ!
- Vite + React 18 + JavaScript (СТРОГО без TypeScript)
- React Router DOM v6
- Zustand - для клиентского состояния (склад, корзина)
- TanStack Query - для серверного состояния (Supabase)
- Tailwind CSS + shadcn/ui (Button, Card, Table, Dialog, Badge, Input)
- Supabase - Auth, Postgres, Realtime
- Библиотеки: html5-qrcode (сканер), Recharts (графики), xlsx (импорт Excel), Dexie.js (offline), jspdf (PDF)
- PWA с vite-plugin-pwa

## Брендинг SANAQ
- Название: SANAQ
- Цвета: primary #0F2A4A (navy), accent #1AFF6C (green), background #F5F7FB, danger #FF4D4F, warning #FFC53D
- Шрифт: Inter / Manrope
- Тон: простой, дружелюбный, для владельца магазина

## Структура папок - соблюдай!
```
/src
  /pages -> Dashboard.jsx, Products.jsx, POS.jsx, Scan.jsx, Suppliers.jsx
  /components -> ui (shadcn), BarcodeScanner.jsx, ProductTable.jsx, KpiCard.jsx, SanaqLogo.jsx
  /hooks -> useDebounce.js, useLocalStorage.js, useOnlineStatus.js
  /store -> useInventoryStore.js (Zustand)
  /lib -> supabase.js, dexie.js, utils.js
  /api -> productsApi.js
/public/logo.png - логотип SANAQ (прозрачный)
/supabase.sql - SQL для создания таблиц
```

## Правила кодинга
1. ТОЛЬКО JavaScript. Никакого TypeScript.
2. Никакого Redux.
3. Mobile-first: все таблицы должны скроллиться на телефоне.
4. Только функциональные компоненты и хуки.
5. Всегда используй брендинг SANAQ в Header и favicon.
6. Валюта - KZT (₸), язык интерфейса - русский + казахский переключатель.
7. Всегда проверяй существующие файлы перед изменением.
8. После каждого большого шага делай `npm run build` для проверки.

## База данных Supabase - файл supabase.sql должен содержать:
```sql
-- products
create table products (
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
-- movements
create table movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  type text check (type in ('INCOME','SALE','WRITE_OFF')),
  qty int not null,
  created_at timestamp default now()
);
-- suppliers
create table suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text
);
-- enable RLS
alter table products enable row level security;
alter table movements enable row level security;
alter table suppliers enable row level security;
create policy "public access" on products for all using (true) with check (true);
create policy "public access" on movements for all using (true) with check (true);
create policy "public access" on suppliers for all using (true) with check (true);
```

## Что делать по порядку (для Codex Desktop App)
1. Инициализируй Vite проект в этой папке, поставь зависимости, настрой Tailwind + shadcn
2. Настрой Supabase клиент и скопируй supabase.sql
3. Сделай Layout с Sidebar и Header с логотипом SANAQ + бейдж "Нужно заказать: X" (quantity <= min_stock) с Realtime подпиской
4. Страница Products: таблица, алерты, импорт Excel
5. Страница Scan: BarcodeScanner на html5-qrcode
6. Страница POS: корзина и списание
7. Dashboard SANAQ: KPI (Продажи сегодня ₸, Товаров мало, Стоимость склада), график продаж 7 дней, топ-5 заканчивающихся, экспорт PDF
8. Offline: Dexie.js

## Деплой на Vercel
- Build: npm run build
- Output: dist
- Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
