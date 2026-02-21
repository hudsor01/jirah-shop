-- Jirah Shop — Initial Database Schema
-- All tables, indexes, and RLS policies

-- ═══════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  short_description text not null default '',
  price numeric not null default 0,
  compare_at_price numeric,
  category text not null check (category in ('skincare', 'makeup', 'hair', 'body', 'tools')),
  subcategory text,
  brand text not null default 'Jirah',
  is_own_brand boolean not null default true,
  images text[] not null default '{}',
  ingredients text,
  how_to_use text,
  tags text[] not null default '{}',
  stock_quantity integer not null default 0,
  has_variants boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_slug on public.products (slug);
create index idx_products_category on public.products (category);
create index idx_products_is_active on public.products (is_active);
create index idx_products_is_featured on public.products (is_featured);

alter table public.products enable row level security;

-- Public can read active products
create policy "Products are viewable by everyone"
  on public.products for select
  using (is_active = true);

-- Admin can do everything
create policy "Admin can manage products"
  on public.products for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- PRODUCT VARIANTS
-- ═══════════════════════════════════════════════════════

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text unique not null,
  price numeric not null,
  compare_at_price numeric,
  stock_quantity integer not null default 0,
  stripe_price_id text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_variants_product_id on public.product_variants (product_id);

alter table public.product_variants enable row level security;

create policy "Variants are viewable by everyone"
  on public.product_variants for select
  using (is_active = true);

create policy "Admin can manage variants"
  on public.product_variants for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- PRODUCT REVIEWS
-- ═══════════════════════════════════════════════════════

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text not null,
  is_verified_purchase boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reviews_product_id on public.product_reviews (product_id);
create index idx_reviews_user_id on public.product_reviews (user_id);

alter table public.product_reviews enable row level security;

-- Public can read approved reviews
create policy "Approved reviews are viewable by everyone"
  on public.product_reviews for select
  using (is_approved = true);

-- Authenticated users can create their own reviews
create policy "Users can create own reviews"
  on public.product_reviews for insert
  with check (auth.uid() = user_id);

-- Users can update their own reviews
create policy "Users can update own reviews"
  on public.product_reviews for update
  using (auth.uid() = user_id);

-- Admin can manage all reviews
create policy "Admin can manage reviews"
  on public.product_reviews for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════════════════════

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal numeric not null default 0,
  shipping_cost numeric not null default 0,
  discount_amount numeric not null default 0,
  total numeric not null default 0,
  shipping_address jsonb not null default '{}',
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user_id on public.orders (user_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_email on public.orders (email);
create index idx_orders_created_at on public.orders (created_at desc);

alter table public.orders enable row level security;

-- Users can view their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Admin can manage all orders
create policy "Admin can manage orders"
  on public.orders for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- ORDER ITEMS
-- ═══════════════════════════════════════════════════════

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity integer not null default 1,
  unit_price numeric not null,
  total_price numeric not null
);

create index idx_order_items_order_id on public.order_items (order_id);

alter table public.order_items enable row level security;

-- Users can view items from their own orders
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Admin can manage all order items
create policy "Admin can manage order items"
  on public.order_items for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- CUSTOMER PROFILES
-- ═══════════════════════════════════════════════════════

create table public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  default_shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

-- Users can view their own profile
create policy "Users can view own profile"
  on public.customer_profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.customer_profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.customer_profiles for insert
  with check (auth.uid() = id);

-- Admin can view all profiles
create policy "Admin can manage profiles"
  on public.customer_profiles for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- COUPONS
-- ═══════════════════════════════════════════════════════

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric not null,
  min_order_amount numeric,
  max_uses integer,
  current_uses integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_coupons_code on public.coupons (code);

alter table public.coupons enable row level security;

-- Anyone can read active coupons (for code validation at checkout)
create policy "Active coupons are viewable by everyone"
  on public.coupons for select
  using (is_active = true);

-- Admin can manage all coupons
create policy "Admin can manage coupons"
  on public.coupons for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- BLOG POSTS
-- ═══════════════════════════════════════════════════════

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null default '',
  excerpt text not null default '',
  cover_image text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blog_posts_slug on public.blog_posts (slug);
create index idx_blog_posts_is_published on public.blog_posts (is_published);
create index idx_blog_posts_published_at on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;

-- Public can read published blog posts
create policy "Published posts are viewable by everyone"
  on public.blog_posts for select
  using (is_published = true);

-- Admin can manage all blog posts
create policy "Admin can manage blog posts"
  on public.blog_posts for all
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.products
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.product_variants
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.product_reviews
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.customer_profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.coupons
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.blog_posts
  for each row execute function public.handle_updated_at();
