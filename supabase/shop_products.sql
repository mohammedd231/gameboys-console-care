-- Products table + public image bucket for the GameBoys shop.
create table if not exists public.shop_products (
  id text primary key,
  name text not null,
  category text not null,
  price integer not null check (price >= 0),
  image text not null default '',
  tag text not null default '',
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.shop_products enable row level security;
grant all on public.shop_products to service_role;

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into public.shop_products (id, name, category, price, image, tag, sort) values
 ('ps5-disc','PlayStation 5 Console (Disc)','PS5',32000,'asset:hero','Hot',1),
 ('ps5-digital','PlayStation 5 Digital Edition','PS5',28000,'asset:hero','',2),
 ('ps5-pad','DualSense Wireless Controller','PS5',3800,'asset:controller','',3),
 ('ps4-slim','PlayStation 4 Slim 1TB','PS4',14500,'asset:hero','Used – checked',4),
 ('ps4-pad','DualShock 4 Controller','PS4',2200,'asset:controller','',5),
 ('xbox-x','Xbox Series X','Xbox',31000,'asset:hero','',6),
 ('xbox-s','Xbox Series S','Xbox',17500,'asset:hero','',7),
 ('xbox-pad','Xbox Wireless Controller','Xbox',3200,'asset:controller','',8),
 ('headset','Gaming Headset','Accessories',1900,'asset:accessories','',9),
 ('dock','Dual Controller Charging Dock','Accessories',850,'asset:accessories','',10),
 ('hdmi','HDMI 2.1 Cable','Accessories',350,'asset:accessories','',11),
 ('games','Latest Games (ask for titles)','Games',2500,'asset:controller','',12)
on conflict (id) do nothing;
