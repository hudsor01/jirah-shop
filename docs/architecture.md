# Architecture Overview

## System Diagram

```mermaid
graph TB
    Client[Browser] --> NextJS[Next.js 16 App Router]
    NextJS --> SC[Server Components]
    NextJS --> SA[Server Actions]
    NextJS --> API[API Routes]

    SC --> Queries[queries/ layer]
    Queries --> Supabase

    SA --> Supabase
    SA --> StripeAPI[Stripe API]

    API --> Webhook[/api/webhooks/stripe]
    Webhook --> Supabase

    StripeAPI --> StripeCheckout[Stripe Checkout]
    StripeCheckout -->|checkout.session.completed| Webhook

    NextJS --> Sentry[Sentry]

    subgraph Supabase[Supabase]
        Auth[Auth]
        DB[(PostgreSQL)]
        Storage[Storage]
    end
```

## Key Architecture Layers

1. **Presentation**: React Server Components + Client Components using shadcn/ui and TailwindCSS v4
2. **Business Logic**: Server Actions in `actions/` -- all return `ActionResult<T>` (see [error-handling.md](./error-handling.md))
3. **Data Access**: Query functions in `queries/` using Supabase client calls
4. **External Services**: Stripe (payments), Supabase (auth, database, storage), Sentry (error tracking and performance monitoring)
5. **Caching**: Next.js `use cache` + `cacheTag()` for read-heavy queries, `React.cache()` for per-request deduplication

## Data Flow

### Reads (Server Components)
Server Components call `queries/` functions directly. These functions use the Supabase server client and are cached with `use cache` + `cacheTag()` where appropriate. `React.cache()` in `lib/cached-queries.ts` provides per-request deduplication.

### Mutations (Server Actions)
Client Components call Server Actions for mutations. The flow is:
1. Validate input with Zod `safeParse()`
2. Execute business logic (Supabase writes, Stripe API calls)
3. Invalidate relevant caches via `updateTag()`
4. Return `ActionResult<T>` -- either `ok(data)` or `fail(errorMessage)`

### Payment Flow
1. Client calls `createCheckoutSession` server action with cart items
2. Server validates prices against database (never trusts client prices)
3. Server creates Stripe Checkout session and returns redirect URL
4. Customer completes payment on Stripe-hosted page
5. Stripe sends `checkout.session.completed` webhook to `/api/webhooks/stripe`
6. Webhook handler creates order, decrements stock (atomic RPC), and increments coupon usage

### Authentication
- Google OAuth via Supabase Auth (browser client, not server actions)
- Email/password sign-up and sign-in via server actions
- `@supabase/ssr` with `getAll`/`setAll` cookie pattern for SSR-compatible sessions
- Middleware refreshes auth tokens on each request

## Architecture Decision Records

- [ADR-001: Supabase for Auth, Database, and Storage](./adr/001-supabase-auth-storage.md)
- [ADR-002: Stripe Checkout (Redirect-Based)](./adr/002-stripe-checkout.md)
- [ADR-003: Next.js 16 `use cache` Caching Strategy](./adr/003-nextjs-caching.md)
- [ADR-004: ActionResult Pattern for Error Handling](./adr/004-action-result-pattern.md)
