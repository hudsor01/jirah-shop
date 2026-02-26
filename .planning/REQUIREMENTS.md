# Requirements: jirah-shop Code Review Remediation

**Defined:** 2026-02-26
**Core Value:** Customers can browse products, add to cart, and complete checkout with Stripe payments — the purchase flow must always work correctly and securely.
**Source:** Comprehensive code review (104 findings) in `.full-review/05-final-report.md`

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases. Derived from 104 review findings (11 Critical, 23 High, 30 Medium, 41 Low).

### Security

- [ ] **SEC-01**: HTML content rendered via unsafe injection API is sanitized with allowlist-based DOMPurify before rendering (CRIT-01)
- [ ] **SEC-02**: Blog content is sanitized at write-time as defense-in-depth, not only at render-time (MED-04)
- [ ] **SEC-03**: Auth guard `requireAdmin()` executes before any other logic in `updateProduct` (CRIT-03)
- [ ] **SEC-04**: Checkout errors return generic messages; sensitive details (stock counts, coupon codes) logged server-side only (HIGH-01)
- [ ] **SEC-05**: `devSignIn` has secondary `ALLOW_DEV_AUTH` env flag guard beyond `NODE_ENV` check (HIGH-02)
- [ ] **SEC-06**: All 11 server action files validate input with Zod schemas before business logic (HIGH-03)
- [ ] **SEC-07**: Checkout success page verifies session ownership against authenticated user (HIGH-04)
- [ ] **SEC-08**: Password policy enforced at 8+ chars, 1 uppercase, 1 number via Zod (MED-01)
- [ ] **SEC-09**: Auth, webhook, contact, and review endpoints have rate limiting (MED-02)
- [ ] **SEC-10**: Contact form validates email with `z.string().email()` (MED-03)
- [ ] **SEC-11**: Coupon validation returns single generic error for all failure modes (MED-05)
- [ ] **SEC-12**: Webhook uses validated `env.STRIPE_WEBHOOK_SECRET` instead of raw `process.env` (HIGH-10, MED-06)

### Inventory & Data Integrity

- [ ] **INV-01**: Webhook decrements stock via atomic Postgres RPC with `WHERE stock_quantity >= p_quantity` (CRIT-02)
- [ ] **INV-02**: Stock decrement prevents negative values; zero-row return triggers critical alert (CRIT-02)
- [ ] **INV-03**: TOCTOU race condition eliminated by atomic DB-level stock check (HIGH-05)
- [ ] **INV-04**: `createProduct` rolls back on partial failure — cleans up orphaned Supabase/Stripe records (HIGH-09)

### Performance — Database

- [ ] **PERF-01**: `getOrderStats` uses single Postgres RPC with `COUNT(*) FILTER` instead of 4 sequential queries + JS reduce (CRIT-04)
- [ ] **PERF-02**: `getSalesData` uses Postgres RPC with `GROUP BY date_trunc('day')` instead of downloading all rows (CRIT-05)
- [ ] **PERF-03**: Admin customers page uses grouped `COUNT(*)` query instead of N+1 per-customer order counts (CRIT-06)
- [ ] **PERF-04**: Storefront products listing has server-side pagination with `range()` (MED-07)
- [ ] **PERF-05**: Product reviews have cursor-based pagination (MED-08)
- [ ] **PERF-06**: Blog listing excludes `content` column and has pagination (MED-09)
- [ ] **PERF-07**: Account order history has pagination (LOW-09)

### Performance — Application

- [ ] **PERF-08**: Next.js 16 `use cache` + `cacheTag()` applied to read-heavy queries; `dynamicIO: true` enabled (HIGH-06)
- [ ] **PERF-09**: `getShopSettings()` cached with `use cache` + `cacheTag("shop-settings")`, invalidated on mutation (HIGH-11)
- [ ] **PERF-10**: `React.cache()` wraps product and blog data functions to deduplicate `generateMetadata` + page queries (HIGH-07)
- [ ] **PERF-11**: Stripe variant updates use `Promise.all()` instead of sequential `for...of` loop (HIGH-12)
- [ ] **PERF-12**: Checkout DB queries parallelized with `Promise.all()` (HIGH-13)
- [ ] **PERF-13**: Date formatters use module-level singletons matching `priceFormatter` pattern (HIGH-14)
- [ ] **PERF-14**: Object URLs from `createObjectURL()` are revoked in cleanup (MED-10)
- [ ] **PERF-15**: Admin Supabase client is module-level singleton (MED-11)
- [ ] **PERF-16**: Cart prices revalidated against server before checkout (MED-12)
- [ ] **PERF-17**: Auth result cached per request to avoid redundant `requireAdmin()` calls (MED-13)

### Code Quality & Error Handling

- [ ] **CQ-01**: All 38 server actions return `ActionResult<T>` discriminated union (HIGH-08, HIGH-18)
- [ ] **CQ-02**: Client consumers handle `ActionResult<T>` discriminated union correctly (HIGH-08)
- [ ] **CQ-03**: Data access extracted to `queries/` layer; server actions call query functions (HIGH-19)
- [ ] **CQ-04**: Duplicate checkout logic in cart drawer and cart page extracted to shared hook (MED-23)
- [ ] **CQ-05**: `rejectReview` and `deleteReview` deduplicated (MED-24)
- [ ] **CQ-06**: Suppressed ESLint `exhaustive-deps` in image-upload fixed with proper dependency array (MED-22)
- [ ] **CQ-07**: Tag search uses `ilike` or full-text search instead of fragile array containment (MED-25)
- [ ] **CQ-08**: Double toast on add-to-cart in ProductCard fixed (LOW-12)
- [ ] **CQ-09**: Product form refactored from 20+ individual `useState` to `useReducer` or form library (LOW-13)
- [ ] **CQ-10**: Imports placed consistently at top of all action files (LOW-14)
- [ ] **CQ-11**: Coupon form state resets on mode switch (LOW-15)
- [ ] **CQ-12**: File object mutation via type assertion in upload hook replaced with proper pattern (LOW-16)
- [ ] **CQ-13**: `SITE_URL` uses validated `env` instead of raw `process.env` (LOW-11)

### Framework & Language

- [ ] **FW-01**: `tsconfig.json` targets ES2022 instead of ES2017 (MED-15)
- [ ] **FW-02**: Key pages have `Suspense` boundaries and/or `loading.tsx` for streaming SSR (MED-16)
- [ ] **FW-03**: Single icon library (Lucide) — tabler icons replaced with Lucide equivalents (MED-17)
- [ ] **FW-04**: `env.ts` split into `env.server.ts` and `env.client.ts` to prevent build failures (MED-18)
- [ ] **FW-05**: `useSupabaseUpload` uses `useRef` instead of `useMemo` for singleton (MED-19)
- [ ] **FW-06**: Dead code removed: `nowISO()`, `signInWithGoogle` server action (LOW-17, LOW-18)
- [ ] **FW-07**: Footer `new Date()` extracted to prevent Server Component caching issues (LOW-19)
- [ ] **FW-08**: Redundant fragment `<>...</>` in admin layout removed (LOW-20)
- [ ] **FW-09**: `useIsMobile()` returns `undefined` during SSR instead of `false` (LOW-21)
- [ ] **FW-10**: Consistent import ordering across all action files (LOW-22)
- [ ] **FW-11**: Unnecessary `"use client"` directives removed from components that don't need them (LOW-39)

### Testing

- [ ] **TEST-01**: Checkout + webhook test suite with mocked Supabase and Stripe clients (CRIT-07, CRIT-08)
- [ ] **TEST-02**: Auth guards + sanitization test suite (HIGH-15)
- [ ] **TEST-03**: Admin product CRUD test suite including Stripe sync and partial failure (HIGH-16)
- [ ] **TEST-04**: Cart provider test suite with localStorage persistence (HIGH-17)
- [ ] **TEST-05**: Vitest coverage reporting configured with `v8` provider (MED-27)
- [ ] **TEST-06**: Playwright E2E framework installed and configured (MED-26)
- [ ] **TEST-07**: Global test utilities established in vitest setup (LOW-23)
- [ ] **TEST-08**: `formatPrice`, `formatDate`, `formatDateLong` utility tests (LOW-24)
- [ ] **TEST-09**: Snapshot tests for critical UI components (LOW-25)
- [ ] **TEST-10**: Module-level mock pattern in `storage.test.ts` improved (LOW-26)
- [ ] **TEST-11**: Tests for blog CRUD, coupon management, order management, reviews, settings (LOW-27)
- [ ] **TEST-12**: Minimum 30% code coverage achieved on critical paths (CRIT-07)

### Documentation

- [ ] **DOC-01**: README.md with project description, stack, prerequisites, setup, dev commands, deployment guide (CRIT-09)
- [ ] **DOC-02**: JSDoc on top 10 most complex server action functions (HIGH-22)
- [ ] **DOC-03**: Stripe webhook setup documented in README (HIGH-23)
- [ ] **DOC-04**: `ActionResult<T>` error contract documented after adoption (MED-28)
- [ ] **DOC-05**: Architecture documentation with ADRs and system diagram (MED-29)
- [ ] **DOC-06**: `CLAUDE.md` documents project conventions (LOW-28)
- [ ] **DOC-07**: CONTRIBUTING.md for developer onboarding (LOW-29)

### CI/CD & Operations

- [ ] **OPS-01**: GitHub Actions CI pipeline: lint, typecheck, test, build (CRIT-11)
- [ ] **OPS-02**: Health check endpoint at `app/api/health/route.ts` (MED-30)
- [ ] **OPS-03**: Dependabot configured for weekly npm updates + `bun audit` in CI (HIGH-21)
- [ ] **OPS-04**: Tool version pinning (`.nvmrc`, `.bun-version`, `engines` in package.json) (LOW-30)
- [ ] **OPS-05**: Sentry performance alerting configured (LOW-31)
- [ ] **OPS-06**: Sentry config handles missing DSN gracefully (LOW-32)
- [ ] **OPS-07**: Bundle analysis configuration added (LOW-33)
- [ ] **OPS-08**: Branch protection rules with required CI pass (LOW-34)

### Architecture Cleanup

- [ ] **ARCH-01**: Orphaned code removed: `app/dashboard/`, `components/shadcn-studio/blocks/`, unused `signInWithGoogle` (LOW-35)
- [ ] **ARCH-02**: Order statuses and categories use const enums instead of magic strings (LOW-40)
- [ ] **ARCH-03**: Sentry DSN deduplicated from 3 config files to single source (LOW-41)
- [ ] **ARCH-04**: Google Font weights reduced from 13 to essential set (LOW-06)
- [ ] **ARCH-05**: Admin product images use Next.js optimization (remove `unoptimized` flag) (LOW-07)
- [ ] **ARCH-06**: Category images served from local/CDN instead of external Unsplash URLs (LOW-08)

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Server-Side Cart
- **CART-01**: Cart state stored in Supabase `carts` table, synced on auth state change (HIGH-20)

### Advanced Security
- **ASEC-01**: Email/account enumeration mitigation via consistent auth error messages (LOW-01)
- **ASEC-02**: CSP refinement to reduce `unsafe-inline` dependency (LOW-02)
- **ASEC-03**: Sentry Replay PII scrubbing configuration (LOW-03)
- **ASEC-04**: npm audit vulnerability remediation (LOW-04)

### Advanced Architecture
- **AARCH-01**: API versioning strategy (LOW-36)
- **AARCH-02**: Decouple Stripe from product creation (adapter pattern) (LOW-37)
- **AARCH-03**: Background job infrastructure for async operations (LOW-38)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features or capabilities | This milestone is exclusively remediation of existing issues |
| Server-side cart migration | Requires DB schema changes and auth integration — deferred to v2 |
| Mobile application | Web-only scope |
| Internationalization (i18n) | Not part of current requirements |
| Real-time features (WebSocket) | Not in current architecture |
| Supabase schema migrations | Managed outside this codebase |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(Populated by roadmapper)* | | |

**Coverage:**
- v1 requirements: 93 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 93

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-26 after initial definition from code review findings*
