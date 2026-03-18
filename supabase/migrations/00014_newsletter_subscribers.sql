-- Newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  constraint newsletter_subscribers_email_unique unique (email)
);

-- RLS
alter table public.newsletter_subscribers enable row level security;

-- Only service role can read/write (no public access)
-- Admin dashboard will use service role client to query

-- Index for lookups by email
create index if not exists idx_newsletter_subscribers_email
  on public.newsletter_subscribers (email);

-- Allow anonymous inserts (for the subscribe action) but nothing else publicly
create policy "Anyone can subscribe" on public.newsletter_subscribers
  for insert with check (true);
