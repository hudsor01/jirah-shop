-- Jirah Shop — Storage Buckets
-- Product images and blog cover images

-- Create storage bucket for product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

-- Create storage bucket for blog cover images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

-- ═══════════════════════════════════════════════════════
-- Storage Policies — Product Images
-- ═══════════════════════════════════════════════════════

-- Anyone can view product images (public bucket)
create policy "Product images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admin can upload product images
create policy "Admin can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin can update product images
create policy "Admin can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin can delete product images
create policy "Admin can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- ═══════════════════════════════════════════════════════
-- Storage Policies — Blog Images
-- ═══════════════════════════════════════════════════════

-- Anyone can view blog images (public bucket)
create policy "Blog images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Admin can upload blog images
create policy "Admin can upload blog images"
  on storage.objects for insert
  with check (
    bucket_id = 'blog-images'
    and (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin can update blog images
create policy "Admin can update blog images"
  on storage.objects for update
  using (
    bucket_id = 'blog-images'
    and (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin can delete blog images
create policy "Admin can delete blog images"
  on storage.objects for delete
  using (
    bucket_id = 'blog-images'
    and (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );
