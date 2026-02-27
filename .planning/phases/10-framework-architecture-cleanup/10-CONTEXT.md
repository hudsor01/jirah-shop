# Phase 10: Framework & Architecture Cleanup - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Framework best practices applied and technical debt resolved. TypeScript target upgrade, env split, Suspense boundaries, icon library consolidation (tabler->Lucide), dead code removal, const enums, Sentry DSN dedup, font weight reduction, image optimization. This is the FINAL phase -- cleanup and polish only.

</domain>

<decisions>
## Implementation Decisions

### TypeScript & Build Config (Plan 10-01)
- `tsconfig.json` target: change `ES2017` -> `ES2022` (Next.js 16 + Node 22 support ES2022 fully)
- `env.ts` split: create `lib/env.server.ts` (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) and `lib/env.client.ts` (NEXT_PUBLIC_* vars only). The current `env.ts` imports server-only keys which breaks if accidentally imported in a client component.
  - `env.server.ts` gets `import "server-only"` guard
  - `env.client.ts` only exports NEXT_PUBLIC_ prefixed vars (safe for client bundles)
  - Update all importers: server actions/routes use `env.server`, client code uses `env.client`, shared code uses `env.client`
- `useSupabaseUpload` hook: replace `useMemo(() => createClient(), [])` with `useRef(createClient()).current` to avoid React strict mode double-init (FW-05)
- Footer `new Date().getFullYear()`: extract to a `<FooterYear />` client component to prevent Server Component caching issues (FW-07)
- Remove redundant fragment `<>...</>` in admin layout if present (FW-08)
- `useIsMobile()` in `hooks/use-mobile.ts`: return `undefined` during SSR instead of `false` to signal "unknown" state (FW-09)

### Suspense Boundaries (Plan 10-02)
- Add `loading.tsx` files for key routes that don't have them yet:
  - `app/(storefront)/loading.tsx` -- main storefront homepage
  - `app/(storefront)/about/loading.tsx`
  - `app/(storefront)/contact/loading.tsx`
  - `app/(storefront)/checkout/loading.tsx`
  - `app/admin/products/loading.tsx`
  - `app/admin/orders/loading.tsx`
  - `app/admin/customers/loading.tsx`
  - `app/admin/blog/loading.tsx`
  - `app/admin/coupons/loading.tsx`
  - `app/admin/reviews/loading.tsx`
  - `app/admin/settings/loading.tsx`
- Already existing (skip): `app/(storefront)/account/loading.tsx`, `app/(storefront)/blog/loading.tsx`, `app/(storefront)/product/[slug]/loading.tsx`, `app/(storefront)/shop/loading.tsx`, `app/admin/loading.tsx`
- Loading components: skeleton-based with `Skeleton` from shadcn/ui, matching page layout structure
- Add `<Suspense>` boundaries around dynamic data sections in key server component pages where appropriate

### Icon Library Consolidation (Plan 10-03)
- Replace all `@tabler/icons-react` imports with Lucide equivalents
- Affected files (7 total): `nav-secondary.tsx`, `app-sidebar.tsx`, `nav-user.tsx`, `nav-main.tsx`, `nav-documents.tsx`, `section-cards.tsx`, `data-table.tsx`
- Map tabler icons to Lucide equivalents (use closest match):
  - Type `Icon` from tabler -> use `LucideIcon` type from `lucide-react`
  - Map each icon by name (e.g., `IconTrendingUp` -> `TrendingUp`, `IconMail` -> `Mail`, etc.)
- After migration, remove `@tabler/icons-react` from `package.json`
- Run `bun install` to clean lock file

### Dead Code Removal (Plan 10-04)
- Remove `nowISO()` from `lib/utils.ts` -- check if any remaining callers exist first (was LOW-17)
- Remove `signInWithGoogle` server action if still present (already removed in Phase 6, verify)
- Remove orphaned `app/dashboard/` directory (page.tsx + data.json) -- this is a shadcn scaffold, not used
- Remove orphaned `components/shadcn-studio/blocks/` directory (11 files) -- these are scaffold blocks replaced by real components
- Audit `"use client"` directives: remove from components that don't use hooks, event handlers, or browser APIs (FW-11)
  - Do NOT remove from: components using useState, useEffect, useRef, onClick, onChange, etc.
  - DO remove from: components that are pure render-only wrappers accidentally marked "use client"
  - Be conservative -- only remove when clearly unnecessary
- Remove unused imports across action files (FW-10)

### Const Enums & Misc Architecture (Plan 10-05)
- Order statuses: convert `ORDER_STATUSES` array in `lib/constants.ts` to const object/enum pattern:
  ```ts
  export const ORDER_STATUS = { PENDING: "pending", PROCESSING: "processing", SHIPPED: "shipped", DELIVERED: "delivered", CANCELLED: "cancelled" } as const;
  export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
  ```
- Category names: similarly constify if magic strings exist
- Sentry DSN dedup: the 3 Sentry configs (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) each read `process.env.NEXT_PUBLIC_SENTRY_DSN` independently. Extract shared config to `lib/sentry.ts`:
  ```ts
  export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  export const SENTRY_ENVIRONMENT = process.env.NODE_ENV;
  export const SENTRY_TRACES_SAMPLE_RATE = process.env.NODE_ENV === "production" ? 0.1 : 1.0;
  ```
  Then import in all 3 configs.
- Google Font weights: reduce from 13 to essential set:
  - Poppins: `["300", "400", "500", "600", "700"]` -> `["400", "500", "600", "700"]` (drop 300 light)
  - Playfair Display: `["400", "500", "600", "700", "800"]` -> `["400", "600", "700"]` (drop 500, 800)
  - Roboto Mono: `["400", "500", "700"]` -> `["400", "700"]` (drop 500)
  - Total: 13 -> 8 weights (saves ~200KB of font files)
- Remove `unoptimized` flag from `<Image>` in:
  - `components/blog-component.tsx`
  - `components/storefront/product-list.tsx`
  - `app/admin/products/products-client.tsx`
  - Do NOT touch `components/shadcn-studio/blocks/` (being deleted in Plan 10-04)
- Category images: replace external Unsplash URLs in `lib/constants.ts` with local images:
  - Download the 5 category images to `public/images/categories/`
  - Update `CATEGORIES` array to use `/images/categories/[name].jpg` paths
  - Update `next.config.ts` remotePatterns: keep `images.unsplash.com` for seed data products but document it's only needed for seed data
  - Keep Unsplash URLs in `supabase/seed.sql` (seed data is ephemeral), and in `app/(storefront)/page.tsx` and `about/page.tsx` hero images (these are editorial, not category images)

### Claude's Discretion
- Exact Lucide icon mappings for each tabler icon
- Which `"use client"` directives to remove (conservative approach)
- Skeleton layout designs for loading.tsx files
- Whether to create a shared Sentry config or keep inline constants
- Exact font weight reduction (keep weights actually used in the design)

</decisions>

<specifics>
## Specific Ideas

- `tsconfig.json` currently targets ES2017 -- outdated for Node 22
- `env.ts` has both server-only and public vars mixed together -- importing in client code would break
- 7 files import from `@tabler/icons-react` -- all in admin sidebar/nav components
- `nowISO()` in `lib/utils.ts` is dead code (no callers in action files after Phase 6)
- `signInWithGoogle` already removed in Phase 6 -- verify it's gone
- `app/dashboard/` is shadcn scaffold leftover (not routed to)
- `components/shadcn-studio/blocks/` has 11 scaffold files replaced by real components
- 5 `loading.tsx` files exist; 11+ routes still need them
- Sentry configs share identical DSN read + tracesSampleRate logic across 3 files
- 13 Google Font weights loaded; many unused in actual CSS
- `unoptimized` flag on 3 active Image components disables Next.js optimization
- Category images load from external Unsplash URLs (adds latency + external dependency)

</specifics>

<deferred>
## Deferred Ideas

None -- this is the final phase

</deferred>

---

*Phase: 10-framework-architecture-cleanup*
*Context gathered: 2026-02-27*
