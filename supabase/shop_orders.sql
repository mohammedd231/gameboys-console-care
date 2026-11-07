-- Already applied to the gameboys-shop Supabase project. Kept here for reference / re-creating the DB.
create table public.shop_orders (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled','returned')),
  payment text not null check (payment in ('cod','card')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','failed')),
  customer jsonb not null,
  items jsonb not null,
  subtotal integer not null,
  shipping integer not null default 0,
  total integer not null,
  tracking_number text not null default '',
  admin_note text not null default '',
  paymob_txn_id text not null default ''
);
create index shop_orders_created_at_idx on public.shop_orders (created_at desc);
alter table public.shop_orders enable row level security;
-- No policies on purpose: the public/anon key can read and write nothing.
grant all on public.shop_orders to service_role;
