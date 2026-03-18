-- ============================================================
-- Jirah Shop — Hosted Supabase Deploy Script
-- Run this in the SQL Editor at:
--   https://supabase.com/dashboard/project/oxulgcceqgmeowrlzukk/sql/new
-- ============================================================

-- ============================================================
-- 1. NEWSLETTER SUBSCRIBERS TABLE (Migration 00014)
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  constraint newsletter_subscribers_email_unique unique (email)
);

alter table public.newsletter_subscribers enable row level security;

create index if not exists idx_newsletter_subscribers_email
  on public.newsletter_subscribers (email);

-- Allow anonymous inserts (for the subscribe form) but nothing else publicly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'newsletter_subscribers'
      AND policyname = 'Anyone can subscribe'
  ) THEN
    CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 2. FIX BROKEN PRODUCT IMAGE URLs
-- ============================================================
-- Replace 3 broken Unsplash photo IDs with working alternatives.
-- Uses array_replace to swap individual URLs within the images array.

-- Broken: photo-1570194065650-d99fb4ee09b1 (serum bottle)
-- Fix:    photo-1715750968540-841103c78d47
UPDATE public.products
SET images = array_replace(
  images,
  'https://images.unsplash.com/photo-1570194065650-d99fb4ee09b1?w=1200&q=80&fit=crop',
  'https://images.unsplash.com/photo-1715750968540-841103c78d47?w=1200&q=80&fit=crop'
)
WHERE 'https://images.unsplash.com/photo-1570194065650-d99fb4ee09b1?w=1200&q=80&fit=crop' = ANY(images);

-- Broken: photo-1631214500115-598fc2cb8ada (cushion foundation)
-- Fix:    photo-1758738880475-dac2ab1c92d4
UPDATE public.products
SET images = array_replace(
  images,
  'https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=1200&q=80&fit=crop',
  'https://images.unsplash.com/photo-1758738880475-dac2ab1c92d4?w=1200&q=80&fit=crop'
)
WHERE 'https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=1200&q=80&fit=crop' = ANY(images);

-- Broken: photo-1631214503930-2e89151c17d0 (lip care)
-- Fix:    photo-1591360236480-4ed861025fa1
UPDATE public.products
SET images = array_replace(
  images,
  'https://images.unsplash.com/photo-1631214503930-2e89151c17d0?w=1200&q=80&fit=crop',
  'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?w=1200&q=80&fit=crop'
)
WHERE 'https://images.unsplash.com/photo-1631214503930-2e89151c17d0?w=1200&q=80&fit=crop' = ANY(images);

-- ============================================================
-- 3. VERIFY
-- ============================================================

-- Verify newsletter table exists
SELECT 'newsletter_subscribers' AS table_name,
       count(*) AS row_count
FROM public.newsletter_subscribers;

-- Verify no broken image URLs remain
SELECT slug, images
FROM public.products
WHERE 'https://images.unsplash.com/photo-1570194065650-d99fb4ee09b1?w=1200&q=80&fit=crop' = ANY(images)
   OR 'https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=1200&q=80&fit=crop' = ANY(images)
   OR 'https://images.unsplash.com/photo-1631214503930-2e89151c17d0?w=1200&q=80&fit=crop' = ANY(images);
-- ^ Should return 0 rows
