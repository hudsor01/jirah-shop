# ADR-001: Supabase for Auth, Database, and Storage

## Status

Accepted

## Context

The e-commerce platform needs managed authentication, a PostgreSQL database, and file storage (product images, blog cover images). Options considered:

- **Separate services**: Auth0/Clerk + standalone PostgreSQL + S3/Cloudinary
- **Firebase**: Auth + Firestore + Cloud Storage
- **Supabase**: Auth + PostgreSQL + Storage (all-in-one)

Key requirements:
- SSR-compatible authentication for Next.js App Router
- PostgreSQL for relational data (products, orders, variants, reviews)
- File storage with public URL generation for product images
- Row-level security for multi-tenant data isolation

## Decision

Use Supabase for all three concerns (auth, database, storage) with `@supabase/ssr` for SSR-compatible authentication.

Implementation details:
- Browser client in `lib/supabase/client.ts` using `createBrowserClient`
- Server client in `lib/supabase/server.ts` using `createServerClient` with `getAll`/`setAll` cookie methods
- Middleware in `lib/supabase/middleware.ts` for token refresh
- Admin client in `lib/supabase/admin.ts` as a lazy singleton with service role key
- Environment variable: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase's naming convention, not `ANON_KEY`)

## Consequences

**Benefits:**
- Single vendor for auth, database, and storage reduces operational overhead
- PostgreSQL enables complex relational queries (joins, RPC functions, aggregations)
- `@supabase/ssr` provides SSR-compatible auth with proper cookie handling
- Built-in storage with public URL generation simplifies image management
- Migrations in `supabase/migrations/` enable version-controlled schema changes

**Trade-offs:**
- Single vendor dependency -- migrating away requires significant effort
- Must use `getAll`/`setAll` cookie methods only (never `get`/`set`/`remove`)
- Must never import from deprecated `auth-helpers-nextjs` package
- Service role key needed for admin operations (webhook handler, admin actions)
