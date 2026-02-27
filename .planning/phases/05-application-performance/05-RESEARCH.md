# Phase 5: Application Performance — Research

**Researched:** 2026-02-26
**Status:** Complete

## Phase Boundary

Application leverages Next.js 16 caching primitives and eliminates redundant computation. This phase adds `dynamicIO`, `"use cache"` + `cacheTag()`, `React.cache()` deduplication, `Promise.all()` parallelization, singleton patterns, object URL cleanup, cart price revalidation, and auth caching.

## Current State Analysis

### Next.js Version
- **Next.js 16.1.6** confirmed in `package.json`. Full support for `dynamicIO`, `"use cache"`, `cacheTag()`, `cacheLife()`.

### next.config.ts
- `dynamicIO: true` is **not yet enabled**. No `experimental` block exists.
- Wrapped with `withSentryConfig()` — config changes are additive.

### Data Functions That Need Caching

**Read-heavy public data (candidates for `"use cache"`):**
1. `getShopSettings()` in `actions/settings.ts` — called from checkout, layout. Currently creates Supabase client each call.
2. `getProducts()` in `actions/products.ts` — storefront product listings.
3. `getBlogPosts()` in `actions/blog.ts` — blog listing (already excludes `content` column from Phase 4).
4. `getFeaturedProducts()` in `actions/products.ts` — homepage featured grid.
5. `getProductBySlug()` in `actions/products.ts` — product detail + metadata.
6. `getBlogPostBySlug()` in `actions/blog.ts` — blog detail + metadata.

**User-specific data (DO NOT cache):**
- Cart (client-side localStorage), account/orders, admin queries.

### Duplicate Queries (React.cache targets)

**Product detail page** (`app/(storefront)/product/[slug]/page.tsx`):
- `generateMetadata()` calls `getProductBySlug(slug)` at line 25.
- `ProductDetailPage()` calls `getProductBySlug(slug)` at line 53.
- **Two identical DB queries per request.**

**Blog detail page** (`app/(storefront)/blog/[slug]/page.tsx`):
- `generateMetadata()` calls `getBlogPostBySlug(slug)` at line 26.
- `BlogPostPage()` calls `getBlogPostBySlug(slug)` at line 49.
- **Two identical DB queries per request.**

### Sequential Operations (Promise.all targets)

**Variant updates in `updateProduct()`** (`actions/admin-products.ts`):
- Lines 401-474: `for...of` loop with sequential `await` for each variant's Stripe price creation + DB update.
- Each variant: up to 3 sequential awaits (create price, deactivate old price, DB update).
- **Fix:** Collect price-changed variants, batch Stripe calls with `Promise.all()`.

**Checkout DB queries** (`actions/checkout.ts`):
- Lines 48-58: products query and variants query are **sequential** (`await` then `await`).
- Lines 100: `getShopSettings()` is sequential after product queries.
- Lines 115-120: coupon query is sequential after settings.
- **Fix:** Products query + variants query + settings query can run in parallel. Coupon query depends on subtotal, so it runs after.

### Date Formatters

**`lib/format.ts`:**
- `priceFormatter` is already a module-level singleton (line 8). Good pattern.
- `formatDate()` (line 19): Creates `new Date().toLocaleDateString()` per call — no `Intl.DateTimeFormat` reuse.
- `formatDateLong()` (line 28): Creates `new Intl.DateTimeFormat("en-US", ...)` per call.
- **Fix:** Create module-level `dateFormatter` and `dateLongFormatter` singletons matching `priceFormatter` pattern.

### Admin Supabase Client

**`lib/supabase/admin.ts`:**
- `createAdminClient()` creates a new client each call. Called from `app/api/webhooks/stripe/route.ts` at lines 92 and 278 (two calls in same webhook handler).
- **Fix:** Module-level singleton — Supabase client is stateless and safe to reuse.

### Object URL Memory Leak

**`hooks/use-supabase-upload.ts`:**
- Lines 79, 85: `URL.createObjectURL(file)` called for file previews.
- **No `URL.revokeObjectURL()` cleanup found** in the hook or components.
- **Fix:** Add `useEffect` cleanup that revokes object URLs when files change or component unmounts.

### Cart Price Revalidation

**`providers/cart-provider.tsx`:**
- Cart stores prices client-side in localStorage. Prices are set when items are added.
- No server-side price revalidation before checkout.
- `createCheckoutSession()` in `actions/checkout.ts` already validates prices server-side (lines 40-97).
- **Current mitigation exists:** Server replaces client prices with DB prices at checkout time.
- **Additional safeguard needed:** Client-side price revalidation before sending to checkout, so users see correct prices before confirming.

### Auth Caching

**`lib/auth.ts`:**
- `requireAdmin()` calls `supabase.auth.getUser()` each time.
- Admin action files call `requireAdmin()` at the start — typically once per server action.
- Multiple admin queries in a single page load each create separate Supabase clients and call `getUser()`.
- **Fix:** Wrap `requireAdmin()` result with `React.cache()` so repeated calls within a single request reuse the result.

### Mutation -> Cache Invalidation Mapping

Current mutations use `revalidatePath()`. With `"use cache"` + `cacheTag()`, we need `revalidateTag()`:

| Mutation | Current Invalidation | Needed Tag Invalidation |
|----------|---------------------|------------------------|
| `createProduct`, `updateProduct`, `deleteProduct` | `revalidatePath("/admin/products")`, `revalidatePath("/")` | `revalidateTag("products")` |
| `updateShopSettings` | `revalidatePath("/admin/settings")`, `/cart`, `/` | `revalidateTag("shop-settings")` |
| `createBlogPost`, `updateBlogPost`, `deleteBlogPost` | `revalidatePath("/admin/blog")`, `/blog` | `revalidateTag("blog")` |

**Note:** `revalidatePath()` still works and may remain for admin-specific pages. `revalidateTag()` is added for cache tag busting of `"use cache"` functions.

## Implementation Approach

### Plan 05-01: dynamicIO + use cache + cacheTag

1. Enable `dynamicIO: true` in `next.config.ts` under `experimental`.
2. Create cached data functions with `"use cache"` directive + `cacheTag()`:
   - `getCachedShopSettings()` — tag: `"shop-settings"`
   - `getCachedProducts(options)` — tag: `"products"`
   - `getCachedBlogPosts(options)` — tag: `"blog"`
   - `getCachedFeaturedProducts()` — tag: `"products"`
3. Add `revalidateTag()` calls to mutation actions alongside existing `revalidatePath()`.
4. Update storefront pages/layouts to call cached versions.

**Key decision:** `"use cache"` functions cannot be in `"use server"` files. Create a separate `lib/cached-queries.ts` (or similar) that imports and wraps the data functions.

### Plan 05-02: React.cache() deduplication + Promise.all() parallelization

1. Wrap `getProductBySlug` and `getBlogPostBySlug` with `React.cache()` for per-request deduplication.
2. Parallelize checkout DB queries with `Promise.all()`.
3. Parallelize variant Stripe updates in `updateProduct()` with `Promise.all()`.

### Plan 05-03: Singletons, cleanup, cart revalidation, auth caching

1. Convert date formatters to module-level singletons.
2. Make admin Supabase client a singleton.
3. Add `useEffect` cleanup for object URLs in upload hook.
4. Add cart price revalidation before checkout.
5. Wrap auth check with `React.cache()` for per-request deduplication.

## Technical Notes

### "use cache" Compatibility
- `"use cache"` directive works at function level in Next.js 16.
- Functions using `"use cache"` must not be in `"use server"` files — they need their own module or a module without the `"use server"` directive.
- `cacheTag()` is called inside the function to tag the cache entry.
- `cacheLife()` can optionally set TTL but defaults are reasonable for this use case.

### React.cache() Scope
- `React.cache()` deduplicates within a single server request/render.
- It does NOT persist across requests — that's what `"use cache"` is for.
- Perfect for the generateMetadata + page component pattern.

### dynamicIO Behavior
- With `dynamicIO: true`, Next.js 16 auto-detects dynamic vs static.
- `"use cache"` explicitly marks functions as cacheable.
- Functions without `"use cache"` that use dynamic data (cookies, headers) are treated as dynamic.

## RESEARCH COMPLETE
