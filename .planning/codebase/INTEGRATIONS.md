# External Integrations

**Analysis Date:** 2026-02-26

## APIs & External Services

**Payment Processing:**
- Stripe - Payment collection and checkout
  - SDK/Client: `stripe` (server) and `@stripe/stripe-js` (client)
  - Auth: `STRIPE_SECRET_KEY` (server-only), `STRIPE_WEBHOOK_SECRET` (webhook validation)
  - Integration: `lib/stripe.ts` (lazy-initialized Stripe instance)

**Authentication:**
- Google OAuth - User sign-in via Google
  - Integration: `@supabase/ssr` handles OAuth flow
  - Callback: `app/auth/callback/route.ts` (code exchange for session)
  - Client-side trigger: `components/auth/google-button.tsx` calls `signInWithOAuth()`

## Data Storage

**Databases:**
- PostgreSQL (Supabase-hosted)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` (project URL)
  - Client: `@supabase/supabase-js` with cookie-based auth via `@supabase/ssr`
  - Admin client: `lib/supabase/admin.ts` (service role key for webhooks)
  - Tables: `products`, `variants`, `orders`, `order_items`, `customer_profiles`, `coupons`, `reviews`, `blog_posts`, `contact_submissions`, `shop_settings`
  - Migrations: `supabase/migrations/` (8 migration files)
  - RPC functions: `increment_coupon_uses`, `get_verified_purchase_count`

**File Storage:**
- Supabase Storage (S3-compatible)
  - Bucket: `product-images` (public)
  - Upload path: `products/`
  - Client: `useSupabaseUpload` hook in `hooks/use-supabase-upload.ts`
  - Public URL format: `https://{project-ref}.supabase.co/storage/v1/object/public/product-images/products/{filename}`
  - Integration: `components/admin/image-upload.tsx` wraps dropzone upload

**Caching:**
- None configured (production stateless via Next.js)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: `@supabase/ssr` with browser client (`lib/supabase/client.ts`) and server client (`lib/supabase/server.ts`)
  - Key credential: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not ANON_KEY)
  - Session persistence: Cookies managed by `@supabase/ssr` using `Next.js cookies()` API
  - Server-side auth flow: `app/auth/callback/route.ts` exchanges code for session via `exchangeCodeForSession()`
  - Admin role check: `lib/auth.ts` → `requireAdmin()` validates `user.app_metadata.role`
  - Email/password support: `signInWithEmail`, `signUpWithEmail` in `actions/auth.ts`

## Monitoring & Observability

**Error Tracking:**
- Sentry (@sentry/nextjs 10.39.0)
  - Configuration: `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`
  - Initialization via `withSentryConfig()` wrapper in `next.config.ts`
  - Environment: `NEXT_PUBLIC_SENTRY_DSN` (public), `SENTRY_ORG`, `SENTRY_PROJECT`
  - Sample rates: 1.0 in dev, 0.1 in production
  - Source maps: Enabled with `widenClientFileUpload`
  - Automatic Vercel monitors enabled

**Logs:**
- Approach: JSON logging via `console.log/error/warn` + Sentry integration
  - Logger: `lib/logger.ts` provides `logger.info()`, `logger.warn()`, `logger.error()`, `logger.exception()`
  - Error logs automatically sent to Sentry with context
  - Format: `{ level, message, timestamp, ...context }`
  - Used throughout: webhook handlers, checkout processing, order creation

## CI/CD & Deployment

**Hosting:**
- Vercel (configured for Next.js with Sentry integration)
- Output mode: Standalone (Docker-ready)
- Health: Automatic Vercel monitoring via `automaticVercelMonitors`

**CI Pipeline:**
- None explicitly configured in codebase
- Sentry integration: Can upload source maps during deployment via CI

## Environment Configuration

**Required env vars (at runtime):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Public Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (webhooks, server actions)
- `STRIPE_SECRET_KEY` - Stripe server key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature validation
- `NEXT_PUBLIC_SITE_URL` - Base URL for redirects (e.g., `http://localhost:3000`)

**Optional env vars:**
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry public DSN
- `SENTRY_ORG` - Sentry organization (deployment)
- `SENTRY_PROJECT` - Sentry project (deployment)

**Secrets location:**
- Development: `.env.local` (git-ignored, created manually)
- Production: Vercel environment variables (no file)

## Webhooks & Callbacks

**Incoming:**
- Stripe webhook endpoint: `app/api/webhooks/stripe/route.ts`
  - Events handled: `checkout.session.completed`, `charge.refunded`
  - Signature validation: `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
  - Handlers: `handleCheckoutSessionCompleted()`, `handleChargeRefunded()`
  - Database updates: Creates/updates orders via admin client

**Auth Callbacks:**
- `app/auth/callback/route.ts` - OAuth callback from Supabase
  - Receives: `code` query parameter (authorization code)
  - Action: `exchangeCodeForSession()` to establish authenticated session
  - Redirect: Safe relative path via `sanitizeRedirect()`

**Outgoing:**
- None configured

## OAuth Configuration

**Google OAuth:**
- Provider: Supabase Auth (delegates to Google)
- Client ID: Configured in Supabase dashboard
- Redirect URI: `{NEXT_PUBLIC_SITE_URL}/auth/callback`
- Flow: Browser-initiated (`signInWithOAuth()`) → Google consent → Supabase callback → exchange code → session

---

*Integration audit: 2026-02-26*
