# Phase 8: Documentation - Research

**Researched:** 2026-02-27
**Status:** Complete

## Current State Analysis

### Existing Documentation
- **README.md**: Default `create-next-app` boilerplate -- needs complete rewrite
- **CLAUDE.md**: Contains only shadcn/studio MCP instructions -- needs project conventions appended (not replaced)
- **CONTRIBUTING.md**: Does not exist
- **docs/**: Directory does not exist
- **JSDoc**: No JSDoc on any server action functions currently

### Codebase Structure for Documentation

**Stack:** Next.js 16.1.6, React 19, TypeScript, TailwindCSS v4, shadcn/ui, Supabase (auth + storage), Stripe, Sentry, Vitest + Playwright

**Package manager:** bun

**Scripts available:**
- `bun dev` -- dev server
- `bun run build` -- production build
- `bun run lint` -- ESLint
- `bun test` / `bun run test:run` -- Vitest
- `bun run test:coverage` -- coverage with v8
- `bun run test:e2e` -- Playwright E2E

**Environment variables (from lib/env.ts):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- Also referenced: `ALLOW_DEV_AUTH` (optional, dev only)

**Webhook route:** `app/api/webhooks/stripe/route.ts`

### Server Action Complexity Analysis

Files by line count (candidates for JSDoc):
1. `actions/admin-products.ts` -- 501 lines, 5 functions (createProduct, updateProduct, deleteProduct, getAdminProducts, getAdminProduct)
2. `actions/blog.ts` -- 243 lines, 7 functions (getBlogPosts, getBlogPostBySlug, getAdminBlogPosts, getAdminBlogPost, createBlogPost, updateBlogPost, deleteBlogPost)
3. `actions/checkout.ts` -- 230 lines, 1 function (createCheckoutSession)
4. `actions/reviews.ts` -- 195 lines, 5 functions (getProductReviews, submitReview, getAdminReviews, approveReview, deleteReview)
5. `actions/orders.ts` -- 154 lines, 6 functions (getAdminOrders, getAdminOrder, updateOrderStatus, getOrderStats, getRecentOrders, getSalesData)
6. `actions/coupons.ts` -- 142 lines, 4 functions (getAdminCoupons, createCoupon, updateCoupon, deleteCoupon)
7. `actions/auth.ts` -- 106 lines, 3 functions
8. `actions/products.ts` -- 104 lines, 4 functions
9. `actions/settings.ts` -- 69 lines, 2 functions
10. `actions/contact.ts` -- 50 lines, 1 function
11. `actions/dev-auth.ts` -- 41 lines, 1 function

**Top 10 most complex functions (for JSDoc priority):**
1. `createProduct` (admin-products.ts) -- multi-step: Stripe product + price creation, Supabase insert, image association, rollback on failure
2. `updateProduct` (admin-products.ts) -- Stripe sync, variant price updates with Promise.all, image management
3. `createCheckoutSession` (checkout.ts) -- cart validation, price verification, coupon application, Stripe session creation
4. `deleteProduct` (admin-products.ts) -- Stripe archive + Supabase deletion
5. `createBlogPost` (blog.ts) -- slug generation, sanitization, Supabase insert
6. `updateBlogPost` (blog.ts) -- slug regeneration, sanitization, cache invalidation
7. `getSalesData` (orders.ts) -- Postgres RPC call, date range handling
8. `createCoupon` (coupons.ts) -- Stripe coupon + promotion code creation
9. `submitReview` (reviews.ts) -- auth check, Zod validation, Supabase insert
10. `signUpWithEmail` (auth.ts) -- password validation, Supabase auth signup, redirect handling

### ActionResult<T> Contract

Located in `lib/action-result.ts`:
- Type: `ActionResult<T>` = `{ success: true; data: T }` | `{ success: false; error: string }`
- Helpers: `ok<T>(data)` and `fail<T>(error)`
- Used by all 38 server actions
- Client consumers discriminate on `success` boolean

### Architecture Decisions to Document (ADRs)

From STATE.md accumulated decisions:
1. **Supabase for auth + storage** -- managed backend, SSR-compatible with `@supabase/ssr`
2. **Stripe Checkout (not Elements)** -- redirect-based, simpler PCI compliance
3. **`use cache` over ISR** -- Next.js 16 experimental caching with `cacheTag()` + `updateTag()`
4. **ActionResult<T> discriminated union** -- consistent error contract across all server actions
5. **queries/ data access layer** -- separation of data access from business logic
6. **Atomic stock decrement via Postgres RPC** -- race-condition-free inventory management
7. **isomorphic-dompurify for XSS** -- SSR-compatible sanitization

### Key Patterns for CLAUDE.md Conventions

From STATE.md decisions and codebase analysis:
- Supabase client: `@supabase/ssr` with `getAll`/`setAll` cookie methods only
- Auth: Google OAuth via browser client, not server actions
- Server actions: all return `ActionResult<T>`, use Zod validation before business logic
- Data access: `queries/` layer for DB queries, server actions for business logic
- Caching: `use cache` + `cacheTag()`, invalidation via `updateTag()`
- Testing: Vitest with `vi.hoisted()` for mock variables, Playwright for E2E
- Package manager: bun exclusively
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not ANON_KEY)

## Plan Guidance

### Plan 08-01: README.md
- Replace default boilerplate entirely
- Include: project description, stack overview, prerequisites, setup (clone, install, env vars, database), dev commands, Stripe webhook testing with `stripe listen`, Vercel deployment
- Skip: license section, external contributor info (NOT open source)
- Reference env vars from `lib/env.ts` for accuracy

### Plan 08-02: JSDoc + ActionResult Docs
- Add JSDoc to the 10 functions identified above
- Create `docs/error-handling.md` for ActionResult contract documentation
- Include: pattern definition, ok()/fail() helpers, client consumption examples, migration from try/catch

### Plan 08-03: Architecture Docs + CLAUDE.md + CONTRIBUTING.md
- Create `docs/architecture.md` with Mermaid system diagram (client -> Next.js -> Supabase/Stripe)
- Write 3-4 lightweight ADRs (Supabase, Stripe Checkout, use cache, ActionResult)
- **CLAUDE.md**: Append project conventions BELOW existing shadcn/studio content -- do NOT remove existing content
- Create `CONTRIBUTING.md` for team members: branching, PR process, code style

### Wave Structure Recommendation
- **Wave 1**: Plans 08-01 and 08-02 (independent -- README and JSDoc don't depend on each other)
- **Wave 2**: Plan 08-03 (CLAUDE.md conventions reference patterns documented in 08-01 and 08-02)

### File Creation Summary
New files to create:
- `README.md` (overwrite boilerplate)
- `docs/error-handling.md`
- `docs/architecture.md`
- `docs/adr/001-supabase-auth-storage.md`
- `docs/adr/002-stripe-checkout.md`
- `docs/adr/003-nextjs-caching.md`
- `docs/adr/004-action-result-pattern.md`
- `CONTRIBUTING.md`

Files to modify:
- `CLAUDE.md` (append project conventions)
- 10 action files (add JSDoc comments)

## RESEARCH COMPLETE
