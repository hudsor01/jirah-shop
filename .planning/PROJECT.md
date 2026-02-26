# jirah-shop

## What This Is

A Next.js 16 e-commerce application for selling products online. Built with React 19, TypeScript, TailwindCSS v4, shadcn/ui, Supabase (auth + storage), and Stripe payments. Includes storefront (shop, cart, checkout, blog, account) and admin dashboard (products, orders, customers, blog, coupons, reviews, settings, analytics).

## Core Value

Customers can browse products, add to cart, and complete checkout with Stripe payments — the purchase flow must always work correctly and securely.

## Requirements

### Validated

- ✓ Next.js 16 proxy convention (`proxy.ts` with `export function proxy()`) — existing
- ✓ Supabase SSR auth (`@supabase/ssr` with `getAll`/`setAll` cookies) — existing
- ✓ Server-side price validation at checkout — existing
- ✓ Idempotent webhook processing via session ID uniqueness — existing
- ✓ PostgREST injection prevention (`sanitizeSearchInput`) — existing
- ✓ Open redirect prevention (`sanitizeRedirect`) — existing
- ✓ Comprehensive security headers (CSP, HSTS, X-Frame-Options) — existing
- ✓ React 19 patterns (`useActionState`, Server Components by default) — existing
- ✓ Lazy Stripe initialization via Proxy pattern — existing
- ✓ Validated environment variables at startup (`lib/env.ts`) — existing
- ✓ Structured logging with Sentry (client, server, edge) — existing
- ✓ Google OAuth authentication — existing
- ✓ Product catalog with variants and images — existing
- ✓ Shopping cart (client-side with localStorage) — existing
- ✓ Stripe Checkout integration with webhook handling — existing
- ✓ Admin dashboard with CRUD for products, orders, customers, blog, coupons, reviews, settings — existing
- ✓ Blog system with rich text editor — existing
- ✓ Coupon/discount system with atomic usage tracking — existing
- ✓ Product review system — existing
- ✓ Image upload via Supabase storage — existing
- ✓ Supabase storage policies restrict uploads to admin role — existing

### Active

- [ ] Fix all 104 findings from comprehensive code review (11 Critical, 23 High, 30 Medium, 41 Low)
- [ ] Achieve minimum 30% test coverage on critical paths
- [ ] Establish CI/CD pipeline with automated quality gates
- [ ] Enable Next.js 16 caching primitives (`use cache`, `cacheTag`, `revalidateTag`)
- [ ] Adopt consistent error handling via `ActionResult<T>` across all server actions
- [ ] Add Zod input validation to all server actions
- [ ] Fix inventory management (stock decrement, TOCTOU race condition)
- [ ] Add HTML sanitization for stored content
- [ ] Create developer documentation (README, JSDoc, .env.example)

### Out of Scope

- Feature additions (new features) — this milestone is exclusively about fixing existing issues
- Server-side cart migration — documented as future work (HIGH-20 deferred to v2)
- Real-time features — not part of current architecture
- Mobile app — web-only
- Internationalization — not in current scope

## Context

A comprehensive code review was completed on 2026-02-25 (corrected 2026-02-26) covering 5 dimensions: code quality & architecture, security & performance, testing & documentation, best practices, and consolidated analysis. The review identified 104 findings with root cause analysis and deterministic solutions for every issue.

**Review files:** `.full-review/01-quality-architecture.md` through `05-final-report.md`

**Current state:**
- ~5,000+ lines of server actions across 11 files
- Near-zero test coverage (<2% — only 6 tests in `tests/storage.test.ts`)
- No CI/CD pipeline (only AI code review actions exist)
- No README or developer documentation
- Zod installed but unused (except webhook)
- `ActionResult<T>` defined but never adopted
- 4+ inconsistent error return shapes across actions

**Key strengths (20 positive observations documented):**
- Correct Next.js 16 conventions (proxy.ts, React 19, Server Components)
- Server-side security measures (price validation, injection prevention, redirect sanitization)
- Proper Supabase SSR and Stripe integration patterns

## Constraints

- **Tech Stack**: Next.js 16.1.6 + React 19 + TypeScript + TailwindCSS v4 + Supabase + Stripe — no stack changes
- **Package Manager**: bun
- **No Breaking Changes**: All fixes must maintain existing functionality
- **Solutions Must Be Deterministic**: Every fix has a proven, tested solution documented in the review
- **Not Open Source**: No public-facing documentation required beyond developer onboarding

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix all 104 findings as single milestone | User explicitly requested complete remediation | — Pending |
| `isomorphic-dompurify` for HTML sanitization | Works in both server and client contexts, recommended in review | — Pending |
| Postgres RPC for atomic stock decrement | Prevents TOCTOU race condition at DB level | — Pending |
| `ActionResult<T>` as mandatory return type | Already defined in codebase, provides type-safe error handling | — Pending |
| Zod for input validation | Already installed, only used in webhook, extend to all actions | — Pending |
| `use cache` + `cacheTag` for caching | Next.js 16 recommended approach, replaces manual revalidation | — Pending |
| Skip .env.example (not open source) | User confirmed this is not an open source project | ✓ Good |

---
*Last updated: 2026-02-26 after initialization from comprehensive code review*
