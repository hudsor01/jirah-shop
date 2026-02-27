# Roadmap: jirah-shop Code Review Remediation

## Overview

This milestone remediates all 104 findings from the comprehensive code review, organized into 10 phases ordered by risk and dependency. Security and data integrity fixes go first (protecting the purchase flow), followed by performance optimizations (database RPCs, caching, parallelization), then structural improvements (ActionResult adoption, data access layer, code quality), testing infrastructure, documentation, CI/CD operations, framework modernization, and architecture cleanup. Every phase delivers verifiable improvements without breaking existing functionality.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Security Fixes** - Eliminate XSS, auth bypass, IDOR, and information leakage vulnerabilities
- [x] **Phase 2: Inventory & Data Integrity** - Atomic stock management and partial failure rollback
- [x] **Phase 3: Input Validation & Security Hardening** - Zod schemas on all server actions, rate limiting, password policy
- [x] **Phase 4: Database Performance** - Postgres RPCs for aggregations, pagination on all listing endpoints
- [x] **Phase 5: Application Performance** - Next.js 16 caching, request deduplication, parallelization, singletons
- [x] **Phase 6: Error Handling & Data Access** - ActionResult adoption, queries layer extraction, code quality fixes
- [x] **Phase 7: Testing Foundation** - Critical path test suites, coverage reporting, E2E framework
- [ ] **Phase 8: Documentation** - README, JSDoc, architecture docs, conventions
- [ ] **Phase 9: CI/CD & Operations** - GitHub Actions pipeline, health check, Dependabot, branch protection
- [ ] **Phase 10: Framework & Architecture Cleanup** - TypeScript target, Suspense boundaries, dead code removal, icon consolidation

## Phase Details

### Phase 1: Critical Security Fixes
**Goal**: All known security vulnerabilities that expose user data or enable code injection are eliminated
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-07, SEC-11, SEC-12
**Success Criteria** (what must be TRUE):
  1. All unsafe HTML injection calls render DOMPurify-sanitized HTML with an explicit tag/attribute allowlist
  2. Blog content is sanitized at write-time in addition to render-time (defense-in-depth)
  3. `requireAdmin()` executes as the first line in every admin server action, including `updateProduct`
  4. Checkout error messages never contain stock counts, coupon codes, or other business data -- sensitive details are logged server-side only
  5. `devSignIn` requires both `NODE_ENV === "development"` AND `ALLOW_DEV_AUTH` env flag; checkout success page verifies session ownership against authenticated user
**Plans**: TBD

Plans:
- [ ] 01-01: HTML sanitization (DOMPurify install, lib/sanitize.ts, render-time + write-time)
- [ ] 01-02: Auth guard fixes, IDOR fix, dev auth hardening
- [ ] 01-03: Error message sanitization (checkout, coupon, webhook env)

### Phase 2: Inventory & Data Integrity
**Goal**: Stock management is atomic and race-condition-free; product creation handles partial failures gracefully
**Depends on**: Phase 1
**Requirements**: INV-01, INV-02, INV-03, INV-04
**Success Criteria** (what must be TRUE):
  1. Webhook calls atomic Postgres RPC to decrement stock with `WHERE stock_quantity >= p_quantity` -- concurrent checkouts cannot oversell
  2. Zero-row return from stock decrement triggers a critical alert in logs (order exists but stock insufficient)
  3. `createProduct` cleans up orphaned Supabase and Stripe records if variant insertion fails (no partial state)
**Plans**: TBD

Plans:
- [x] 02-01: Atomic stock decrement RPC and webhook integration
- [x] 02-02: Product creation rollback on partial failure

### Phase 3: Input Validation & Security Hardening
**Goal**: All server action inputs are validated at runtime before business logic executes
**Depends on**: Phase 1
**Requirements**: SEC-06, SEC-08, SEC-09, SEC-10
**Success Criteria** (what must be TRUE):
  1. Every server action validates input with Zod `safeParse()` before any database or Stripe call
  2. Password registration enforces 8+ characters, 1 uppercase, 1 number via Zod schema
  3. Contact form validates email format with `z.string().email()`
  4. Auth, webhook, contact, and review endpoints have rate limiting that rejects excessive requests
**Plans**: TBD

Plans:
- [x] 03-01: Zod schemas for checkout and admin-products actions
- [x] 03-02: Zod schemas for remaining 9 action files
- [x] 03-03: Password policy, contact validation, rate limiting

### Phase 4: Database Performance
**Goal**: All database queries that degrade at scale are replaced with efficient server-side operations
**Depends on**: Phase 2 (stock RPC pattern established)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07
**Success Criteria** (what must be TRUE):
  1. Admin dashboard stats load from a single Postgres RPC returning all 4 metrics (total, pending, completed, revenue) -- no JS-side aggregation
  2. Sales analytics data computed by Postgres `GROUP BY date_trunc('day')` -- no full-table download to JS
  3. Admin customers page uses grouped `COUNT(*)` query -- no N+1 per-customer order counts
  4. Storefront products, blog listing, product reviews, and account order history all have server-side pagination
  5. Blog listing query excludes the `content` column
**Plans**: TBD

Plans:
- [x] 04-01: Postgres RPCs for order stats and sales data
- [x] 04-02: N+1 fix for customers page
- [x] 04-03: Pagination for products and blog (with content column exclusion)
- [x] 04-04: Pagination for reviews and account order history

### Phase 5: Application Performance
**Goal**: Application leverages Next.js 16 caching primitives and eliminates redundant computation
**Depends on**: Phase 4 (queries optimized before caching)
**Requirements**: PERF-08, PERF-09, PERF-10, PERF-11, PERF-12, PERF-13, PERF-14, PERF-15, PERF-16, PERF-17
**Success Criteria** (what must be TRUE):
  1. `dynamicIO: true` is enabled and `use cache` + `cacheTag()` are applied to read-heavy queries (shop settings, products, blog); mutations invalidate with `revalidateTag()`
  2. Product and blog detail pages make one DB query per request (not two) via `React.cache()` deduplication
  3. Stripe variant updates and checkout DB queries run in parallel via `Promise.all()`
  4. Date formatters use module-level singletons; admin Supabase client is a singleton; object URLs are revoked on cleanup
  5. Cart prices are revalidated against server before checkout; auth result is cached per request
**Plans**: TBD

Plans:
- [x] 05-01: Enable dynamicIO, apply use cache + cacheTag to read-heavy queries
- [x] 05-02: React.cache() deduplication, Promise.all() parallelization
- [x] 05-03: Singleton patterns, object URL cleanup, cart price revalidation, auth caching

### Phase 6: Error Handling & Data Access
**Goal**: All server actions use a consistent error contract and data access is separated from business logic
**Depends on**: Phase 3 (Zod schemas exist), Phase 5 (caching layer ready)
**Requirements**: CQ-01, CQ-02, CQ-03, CQ-04, CQ-05, CQ-06, CQ-07, CQ-08, CQ-09, CQ-10, CQ-11, CQ-12, CQ-13
**Success Criteria** (what must be TRUE):
  1. All 38 server actions return `ActionResult<T>` discriminated union -- no raw throws, no ad-hoc error shapes
  2. All client consumers handle `ActionResult<T>` correctly by discriminating on `success` boolean
  3. Data access is extracted to `queries/` layer; server actions call query functions instead of building inline Supabase queries
  4. Duplicate logic eliminated: shared checkout hook, deduplicated review actions, proper tag search
  5. Minor code quality fixes applied: double toast fixed, product form refactored, imports ordered, coupon form state reset, file mutation replaced, SITE_URL uses validated env
**Plans**: TBD

Plans:
- [x] 06-01: ActionResult adoption across all server actions
- [x] 06-02: Client consumer updates for ActionResult
- [x] 06-03: Extract queries/ data access layer
- [x] 06-04: Deduplication and code quality fixes

### Phase 7: Testing Foundation
**Goal**: Critical code paths have automated test coverage and testing infrastructure is production-ready
**Depends on**: Phase 6 (ActionResult and queries layer make testing cleaner)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-11, TEST-12
**Success Criteria** (what must be TRUE):
  1. Checkout + webhook test suite exists with mocked Supabase and Stripe clients covering price validation, stock checks, coupon logic, session creation, and idempotent order creation
  2. Auth guards, sanitization, admin product CRUD, and cart provider each have dedicated test suites
  3. Vitest coverage reporting is configured with `v8` provider; minimum 30% coverage achieved on critical paths
  4. Playwright E2E framework is installed and configured with at least a smoke test
  5. Utility tests exist for formatters; snapshot tests exist for critical UI components; global test utilities are established
**Plans**: TBD

Plans:
- [x] 07-01: Test infrastructure (coverage reporting, global utilities, mock pattern improvement)
- [x] 07-02: Checkout + webhook test suite
- [x] 07-03: Auth guards + sanitization test suite
- [x] 07-04: Admin products + cart provider test suites
- [x] 07-05: Utility tests, snapshot tests, remaining action tests
- [x] 07-06: Playwright E2E setup and smoke test
- [x] 07-07: Coverage target validation (30% minimum)

### Phase 8: Documentation
**Goal**: A new developer can set up and understand the project without asking questions
**Depends on**: Phase 6 (ActionResult adopted, so error contract can be documented), Phase 7 (testing exists to document)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07
**Success Criteria** (what must be TRUE):
  1. README.md exists with project description, stack, prerequisites, setup steps, dev commands, Stripe webhook testing, and deployment guide
  2. Top 10 most complex server action functions have JSDoc with params, return types, error conditions, and side effects
  3. `ActionResult<T>` error contract is documented with usage examples
  4. Architecture documentation exists with ADRs and system diagram; CLAUDE.md documents project conventions; CONTRIBUTING.md exists
**Plans**: TBD

Plans:
- [ ] 08-01: README.md with setup, dev workflow, Stripe webhook docs
- [ ] 08-02: JSDoc on complex functions + ActionResult contract docs
- [ ] 08-03: Architecture docs, CLAUDE.md conventions, CONTRIBUTING.md

### Phase 9: CI/CD & Operations
**Goal**: Automated quality gates prevent broken code from merging; operational monitoring is in place
**Depends on**: Phase 7 (tests exist to run in CI)
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07, OPS-08
**Success Criteria** (what must be TRUE):
  1. GitHub Actions CI pipeline runs lint, typecheck, test, and build on every PR -- broken code cannot merge
  2. Health check endpoint at `/api/health` returns `{ status: "ok" }` with build info
  3. Dependabot configured for weekly npm updates; `bun audit` runs in CI
  4. Tool versions pinned via `.nvmrc`, `.bun-version`, and `engines` in package.json
  5. Branch protection rules require CI pass; Sentry performance alerting configured; bundle analysis available
**Plans**: TBD

Plans:
- [ ] 09-01: GitHub Actions CI pipeline (lint, typecheck, test, build)
- [ ] 09-02: Health check endpoint, Dependabot, tool version pinning
- [ ] 09-03: Branch protection, Sentry alerting, bundle analysis

### Phase 10: Framework & Architecture Cleanup
**Goal**: Framework best practices applied and technical debt from architecture cleanup is resolved
**Depends on**: Phase 9 (CI catches regressions from cleanup)
**Requirements**: FW-01, FW-02, FW-03, FW-04, FW-05, FW-06, FW-07, FW-08, FW-09, FW-10, FW-11, ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06
**Success Criteria** (what must be TRUE):
  1. `tsconfig.json` targets ES2022; `env.ts` split into server/client variants that cannot break builds
  2. Key pages have `Suspense` boundaries and/or `loading.tsx` for streaming SSR
  3. Single icon library (Lucide) -- all tabler icons replaced with Lucide equivalents
  4. Dead code removed: `nowISO()`, unused `signInWithGoogle`, orphaned `app/dashboard/`, `components/shadcn-studio/blocks/`; unnecessary `"use client"` directives removed
  5. Order statuses and categories use const enums; Sentry DSN deduplicated; Google Font weights reduced; admin product images use Next.js optimization; category images served locally
**Plans**: TBD

Plans:
- [ ] 10-01: TypeScript target, env split, useRef fix, footer date, fragment cleanup
- [ ] 10-02: Suspense boundaries and loading.tsx for key pages
- [ ] 10-03: Icon library consolidation (tabler to Lucide)
- [ ] 10-04: Dead code removal and orphaned file cleanup
- [ ] 10-05: Const enums, Sentry dedup, font weights, image optimization

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Security Fixes | 3/3 | Complete | 2026-02-26 |
| 2. Inventory & Data Integrity | 2/2 | Complete | 2026-02-26 |
| 3. Input Validation & Security Hardening | 3/3 | Complete | 2026-02-26 |
| 4. Database Performance | 4/4 | Complete | 2026-02-26 |
| 5. Application Performance | 3/3 | Complete | 2026-02-26 |
| 6. Error Handling & Data Access | 4/4 | Complete | 2026-02-26 |
| 7. Testing Foundation | 0/7 | Not started | - |
| 8. Documentation | 0/3 | Not started | - |
| 9. CI/CD & Operations | 0/3 | Not started | - |
| 10. Framework & Architecture Cleanup | 0/5 | Not started | - |
