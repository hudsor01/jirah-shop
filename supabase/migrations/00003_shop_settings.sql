-- 00003_shop_settings.sql
-- Creates the shop_settings table and adds missing indexes on orders.

-- 1. Create the shop_settings table
create table public.shop_settings (
  id uuid primary key default gen_random_uuid(),
  shipping_cost numeric not null default 5.99,
  free_shipping_threshold numeric not null default 50,
  allowed_shipping_countries text[] not null default '{US,CA,GB}',
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.shop_settings enable row level security;

-- 3. RLS policies
-- Public read: everyone needs shipping info for the storefront
create policy "Shop settings are viewable by everyone"
  on public.shop_settings for select
  using (true);

-- Admin-only write
create policy "Admin can manage shop settings"
  on public.shop_settings for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 4. Updated_at trigger
create trigger set_updated_at before update on public.shop_settings
  for each row execute function public.handle_updated_at();

-- 5. Insert default settings row
insert into public.shop_settings (shipping_cost, free_shipping_threshold, allowed_shipping_countries)
values (5.99, 50, '{US,CA,GB}');

-- 6. Add missing unique indexes on orders
create unique index idx_orders_stripe_checkout_session_id
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index idx_orders_stripe_payment_intent_id
  on public.orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
