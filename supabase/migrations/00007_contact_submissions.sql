-- Contact form submissions table (missing from initial schema)

create table public.contact_submissions (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  subject    text,
  message    text        not null check (char_length(message) <= 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

-- Only admins may read submissions
create policy "Admin can read contact submissions"
  on public.contact_submissions for select
  using (
    (select auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Anyone (including unauthenticated visitors) may submit
create policy "Anyone can submit a contact form"
  on public.contact_submissions for insert
  with check (true);

create index idx_contact_submissions_created_at
  on public.contact_submissions (created_at desc);
