# Codebase Concerns

**Analysis Date:** 2025-02-26

## Tech Debt

**Large Component Files:**
- `components/data-table.tsx` — 811 lines (DnD-enabled table wrapper)
- `components/ui/sidebar.tsx` — 724 lines (shadcn sidebar primitive)
- `components/admin/product-form.tsx` — 440 lines (product CRUD form)
- Files: `components/data-table.tsx`, `components/ui/sidebar.tsx`, `components/admin/product-form.tsx`
- Impact: Difficult to test in isolation, potential for missed edge cases, higher cognitive load
- Fix approach: Consider extracting sub-sections of product-form.tsx into separate VariantEditor and ImageSection sub-components; keep sidebar and data-table as-is since they're specialized UI primitives
- Priority: Low (functional, but maintainability concern)

**Object URL Memory Leak in Upload Hook:**
- Issue: `useSupabaseUpload` hook calls `URL.createObjectURL()` on preview generation (lines 79, 85) but never calls `URL.revokeObjectURL()` during cleanup
- Files: `hooks/use-supabase-upload.ts` (lines 79, 85)
- Impact: Blob URLs accumulate in memory during file upload workflows, consuming memory over time, especially with multiple file uploads across a session
- Fix approach: Create a cleanup effect that revokes all preview URLs when component unmounts or files are cleared
- Priority: Medium (gradual memory degradation in upload-heavy workflows)

**Admin Supabase Client Not Singleton:**
- Issue: `createAdminClient()` in `lib/supabase/admin.ts` creates a new instance on each import/call instead of maintaining a singleton
- Files: `lib/supabase/admin.ts`
- Impact: Inefficient initialization overhead, potential for multiple instances consuming resources
- Fix approach: Apply same proxy pattern used in `lib/stripe.ts` — lazy-initialize and cache the admin client
- Priority: Low (single call per action, but pattern violation)

**Browser Client Created in Multiple Effects:**
- Issue: `useSupabaseUpload` calls `createClient()` inside `useMemo` with empty dependency array (line 55), but `ImageUpload.tsx` calls it again in useEffect (line 33)
- Files: `hooks/use-supabase-upload.ts` (line 55), `components/admin/image-upload.tsx` (line 33)
- Impact: Multiple browser client instances created
- Fix approach: Create client once at module level (similar to the pattern in the hook's useMemo)
- Priority: Low (minor redundancy)

---

## Security Issues

### Critical

**Stored XSS via Unsanitized HTML Rendering (CVSS 8.4, CWE-79):**
- Issue: Pages render HTML directly from database using dangerouslySetInnerHTML with zero sanitization. Content stored in Supabase is not sanitized.
- Files: `app/(storefront)/blog/[slug]/page.tsx` (line 134), `app/(storefront)/product/[slug]/page.tsx` (line 109)
- Impact: If database is compromised or admin account is hijacked, arbitrary JavaScript executes in every visitor's browser, enabling session theft, phishing redirects, payment skimmers
- Fix approach: Install `isomorphic-dompurify`, create `lib/sanitize.ts` with allowlist, apply at render time. Example:
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';
  export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'img', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
    });
  }
  ```
  Then: `<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />`
- Priority: **Critical** — implement immediately
- Effort: Small

**Auth Guard Ordering Race in `updateProduct` (CVSS 7.6, CWE-863):**
- Issue: Creates Supabase client at line 208 before calling `requireAdmin()` at line 211. All other admin actions call `requireAdmin()` first
- Files: `actions/admin-products.ts` (lines 208-211)
- Impact: Window where function operates with unverified auth state; inconsistent with established security pattern
- Fix approach: Move `await requireAdmin()` to line 208, before any Supabase client creation
- Priority: **Critical** — copy-paste bug pattern
- Effort: Small

**Insecure Dev Auth Guard (CVSS 7.3, CWE-489):**
- Issue: `devSignIn` protected only by runtime `NODE_ENV !== "development"` check; endpoint compiles into production bundle and is accessible via URL
- Files: `actions/dev-auth.ts` (lines 10-17)
- Impact: If deployment misconfigures `NODE_ENV` (common in staging/preview), becomes authentication bypass for any Supabase user
- Fix approach: Add multi-layer guard with environment variable:
  ```typescript
  if (process.env.NODE_ENV !== "development" || !process.env.ALLOW_DEV_AUTH) {
    return fail("Dev sign-in is not available");
  }
  ```
  Only set `ALLOW_DEV_AUTH=true` in local `.env`, never in deployed environments
- Priority: **Critical** — exploitable if environment misconfigured
- Effort: Small

**IDOR on Checkout Success Page (CVSS 6.1, CWE-639):**
- Issue: Takes `session_id` from URL query params and calls `stripe.checkout.sessions.retrieve()` without verifying ownership to current user
- Files: `app/(storefront)/checkout/success/page.tsx` (lines 54-79)
- Impact: Any user can guess/obtain a valid Stripe session ID and view another user's order details (line items, total, email)
- Fix approach: After retrieving session, verify ownership:
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session_id)
    .eq('user_id', user?.id)
    .single();
  if (!order) redirect('/');
  ```
- Priority: **Critical** — directly exposes customer PII
- Effort: Small

**Stock Decrement Race Condition (CVSS 6.8, CWE-367, TOCTOU):**
- Issue: Stock checked at checkout creation (Time-Of-Check) but never reserved or decremented. Webhook handler creates orders without stock operations
- Files: `actions/checkout.ts` (lines 66-68), webhook handler doesn't decrement
- Impact: Multiple concurrent checkout attempts can pass stock validation simultaneously, overselling inventory
- Fix approach: Create atomic Postgres RPC for stock decrement with `WHERE stock_quantity >= p_quantity` clause. Call in webhook after order creation. Consider `stock_reservations` table with TTL for hold during checkout
- Priority: **Critical** — inventory data integrity loss
- Effort: Medium

### High

**No Runtime Input Validation on Server Actions (CVSS 7.0, CWE-20):**
- Issue: All server action parameters use TypeScript interfaces which are erased at compile time. Zero Zod validation despite having zod v4.3.6 installed
- Files: All 11 mutation action files in `actions/` directory (e.g., `admin-products.ts`, `blog.ts`, `coupons.ts`, `reviews.ts`, etc.)
- Impact: Any client can POST arbitrary JSON to server action endpoints; no validation of type, format, or length
- Fix approach: Add Zod schemas for every action input. Validate with `safeParse()` before business logic:
  ```typescript
  const CreateProductInput = z.object({
    name: z.string().min(1).max(200),
    price: z.number().positive().max(999999),
  });
  export async function createProduct(rawInput: unknown) {
    await requireAdmin();
    const input = CreateProductInput.safeParse(rawInput);
    if (!input.success) return fail("Invalid input");
    // use input.data
  }
  ```
  Priority order: checkout.ts (financial), admin-products.ts (mutations), auth.ts
- Priority: **High** — foundational validation gap
- Effort: Medium

**Sensitive Information Leakage in Error Messages (CVSS 6.5, CWE-209):**
- Issue: Error messages contain interpolated business data: stock counts ("Only ${availableStock} units"), coupon codes ("Coupon code has expired")
- Files: `actions/checkout.ts` (lines 47-69, 98-119)
- Impact: Attackers can enumerate inventory levels and coupon validity via error messages
- Fix approach: Return structured error objects with generic messages; log details server-side:
  ```typescript
  logger.warn('Checkout: insufficient stock', { productId, available, requested });
  return { url: null, error: "One or more items are out of stock." };
  // For coupons - single message for all failure modes:
  return { url: null, error: "This coupon code is not valid." };
  ```
- Priority: **High** — enables information enumeration
- Effort: Small

**Webhook Uses Unvalidated `process.env` (CVSS 5.9, CWE-252):**
- Issue: Stripe webhook handler accesses `process.env.STRIPE_WEBHOOK_SECRET!` directly without validation at module load
- Files: `app/api/webhooks/stripe/route.ts` (line 32)
- Impact: If env var missing, uncaught error at request time rather than startup
- Fix approach: Import from `@/lib/env` which validates at startup
- Priority: **High** — consistency with app's env validation pattern
- Effort: Small

---

## Performance Bottlenecks

### Critical

**`getOrderStats` — Full-Table Scan for Dashboard Stats:**
- Issue: Fetches every order's `total` into JS memory and sums using `Array.reduce()`. Additionally runs 4 sequential queries (total orders, pending count, completed count, revenue sum) instead of 1
- Files: `actions/orders.ts` (lines 104-148)
- Impact: O(n) memory/network. At 10K orders: ~200ms. At 100K orders: 1-5 seconds per dashboard view
- Fix approach: Create single Postgres RPC returning all 4 stats
- Priority: **Critical** — degrades at scale
- Effort: Medium

**`getSalesData` — 3x Unbounded Aggregation:**
- Issue: Analytics page calls `getSalesData(7)`, `getSalesData(30)`, `getSalesData(90)` separately; each downloads all matching orders into JS and groups by date
- Files: `actions/orders.ts` (lines 168-206), `app/admin/analytics/page.tsx` (line 14)
- Impact: At 1K daily orders, downloads ~270K rows to produce 3 datasets. 90-day query alone pulls ~90K rows
- Fix approach: Create single RPC with date bucketing; call once with 90 days, slice client-side
- Priority: **Critical** — wastes bandwidth at scale
- Effort: Medium

**Admin Customers Page — N+1 Order Counts:**
- Issue: For each customer displayed, fetches all their order rows just to count them (N+1 pattern: 1 customer query + N order count queries)
- Files: `app/admin/customers/page.tsx` (lines 47-66)
- Impact: At 100 customers with 50 orders each: 5000 rows fetched to produce 100 counts
- Fix approach: Single grouped query with `count:id.count()`
- Priority: **Critical** — quadratic row fetching
- Effort: Small

### High

**`getShopSettings` on Every Page Load:**
- Issue: Root layout calls `getShopSettings()` querying `shop_settings` singleton on every page request
- Files: `app/layout.tsx` (line 75)
- Impact: +30-80ms per page load. Settings rarely change but trigger DB round trip on every navigation
- Fix approach: Wrap with Next.js 16 `use cache` directive, invalidate with `revalidateTag("shop-settings")` in `updateShopSettings` action
- Priority: **High** — affects all page loads
- Effort: Small

**Date Formatters Recreated on Every Call:**
- Issue: `formatDate()` and `formatDateLong()` create new `Intl.DateTimeFormat` instance on every call; `formatPrice()` correctly uses module-level singleton
- Files: `lib/format.ts` (lines 19-34)
- Impact: Micro-optimization, but inconsistent with existing pattern
- Fix approach: Create module-level singletons matching `formatPrice()` approach
- Priority: **High** — consistency with existing patterns
- Effort: Small

**Sequential Stripe API Calls in Variant Update:**
- Issue: `updateProduct` processes variants in sequential `for...of` loop; each variant requires 2-3 Stripe calls (10 variants = 20-30 sequential HTTP calls)
- Files: `actions/admin-products.ts` (lines 287-361)
- Impact: 4-15 seconds for 10 variants (Stripe API latency ~200-500ms per call)
- Fix approach: Process variants concurrently with `Promise.all()`
- Priority: **High** — directly impacts form submission latency
- Effort: Small

**Sequential Database Queries in Checkout:**
- Issue: 4+ independent queries (products, variants, settings, coupon) run sequentially with `await` in series; none depends on others
- Files: `actions/checkout.ts`
- Impact: +100-300ms per checkout attempt
- Fix approach: Use `Promise.all()` for independent queries
- Priority: **High** — affects critical checkout flow
- Effort: Small

**Double Product/Blog Fetch on Detail Pages:**
- Issue: `generateMetadata` and page component both call same data-fetching function; Supabase calls aren't automatically deduped like `fetch()`
- Files: `app/(storefront)/product/[slug]/page.tsx`, `app/(storefront)/blog/[slug]/page.tsx`
- Impact: +50-150ms per product/blog page (2 identical DB queries instead of 1)
- Fix approach: Wrap with `React.cache()` for request-level deduplication
- Priority: **High** — unnecessary DB load on popular pages
- Effort: Small

### Medium

**No Pagination on Storefront Products:**
- Issue: `getStorefrontProducts()` in `actions/products.ts` queries entire catalog without pagination
- Files: `actions/products.ts`
- Impact: Scales linearly with product catalog size; at 10K products, full page load waits for complete dataset
- Fix approach: Add `range()` with page/limit params, default limit 24
- Priority: Medium
- Effort: Small

**No Pagination for Blog Listing:**
- Issue: `getBlogs()` queries all blog posts with full `content` column included
- Files: `actions/blog.ts`
- Impact: Content column can be large; unnecessary transfer for listing view
- Fix approach: Add pagination, exclude `content` from listing query, fetch only on detail page
- Priority: Medium
- Effort: Small

**No Pagination for Product Reviews:**
- Issue: `getProductReviews()` fetches all reviews for a product unbounded
- Files: `actions/reviews.ts`
- Impact: Popular products with hundreds of reviews cause large transfers
- Fix approach: Add cursor-based pagination for incremental loading
- Priority: Medium
- Effort: Small

---

## Fragile Areas

**Variant Upload and Supabase Client Coupling:**
- Why fragile: `ImageUpload.tsx` directly calls `createClient()` and `getPublicUrl()`, tightly coupling upload logic to Supabase storage API. If storage bucket name or path structure changes, must update in multiple places
- Files: `components/admin/image-upload.tsx` (lines 20-42), `hooks/use-supabase-upload.ts`
- Safe modification: Create wrapper constants for bucket names and paths in `lib/constants.ts`, import and use throughout
- Test coverage: No unit tests for ImageUpload component (only integration tests for hook)

**Stripe Variant Sync in Product Updates:**
- Why fragile: Complex loop updating variants with partial-success semantics (some variants succeed, others fail). No rollback mechanism if Stripe API fails mid-operation
- Files: `actions/admin-products.ts` (lines 287-361)
- Safe modification: Wrap in transaction pattern or mark variants as "sync-pending", retry separately on failure
- Test coverage: No tests for concurrent variant failures; only happy-path tested

**Cart Price Staleness:**
- Why fragile: Cart stores prices in localStorage (client state), but admin can change prices in DB. Checkout validates server-side, but UX shows stale prices during shopping
- Files: `providers/cart-provider.tsx`
- Safe modification: Fetch fresh prices from server before checkout, show toast if prices changed
- Test coverage: No integration tests for price change scenarios

**Coupon Code Validation Logic:**
- Why fragile: Complex business logic with multiple failure modes (invalid, expired, usage limit, minimum spend). Different error messages enable enumeration
- Files: `actions/checkout.ts` (lines 89-119)
- Safe modification: Consolidate to single validation function with generic error response; log details server-side
- Test coverage: Only happy-path tests for valid coupons

---

## Scaling Limits

**Database Query Load at Scale:**
- Current capacity: Optimized for less than 100 total orders, less than 1000 products, less than 500 customers
- Limit: At 10K orders, `getOrderStats` and `getSalesData` queries become bottlenecks (1-5 seconds)
- Scaling path: Migrate aggregations to Postgres RPCs, add materialized view for analytics, implement query caching layer
- Priority: Medium (design limits, not code bugs)

**Stripe Price Object Accumulation:**
- Current capacity: Supabase stores arbitrary variant counts per product; each variant creates 1 Stripe price
- Limit: Stripe's default rate limit is 100 requests/second. At 1000+ variants, batch operations hit limits
- Scaling path: Implement batch operations with exponential backoff, queue system for large updates
- Priority: Low (edge case)

**Storage Bucket Growth:**
- Current capacity: `product-images` bucket stores product photos, no cleanup on image removal
- Limit: Orphaned images accumulate (images removed from products remain in bucket)
- Scaling path: Implement storage lifecycle rules or cron job to clean unreferenced images
- Priority: Medium (cost creep)

---

## Test Coverage Gaps

**No Tests for Server Actions:**
- What's not tested: All 11 mutation actions (createProduct, updateProduct, checkout, createBlog, etc.) have zero test coverage
- Files: All `actions/*.ts` files except `auth.ts` (has dev-only tests)
- Risk: Logic bugs (price validation, stock checks, coupon logic) go undetected until production
- Priority: **High** — financial and inventory operations need test coverage

**No XSS Sanitization Tests:**
- What's not tested: HTML sanitization on blog and product pages (after implementation)
- Files: Will be added to `app/(storefront)/blog/[slug]/page.tsx`, `app/(storefront)/product/[slug]/page.tsx`
- Risk: Sanitization bypass or allowlist misconfiguration not caught until security incident
- Priority: **Critical** — security-critical feature

**No IDOR Authorization Tests:**
- What's not tested: User authorization on protected routes and resources
- Files: `app/(storefront)/checkout/success/page.tsx`, all admin routes
- Risk: Authorization bypass goes undetected (e.g., viewing other users' orders)
- Priority: **Critical** — exposes customer data

**No Inventory Concurrency Tests:**
- What's not tested: Stock race conditions (multiple checkouts for same limited inventory)
- Files: `actions/checkout.ts`, webhook handler
- Risk: Overselling inventory not caught in development
- Priority: **Critical** — data integrity issue

**Minimal Zod Validation Tests:**
- What's not tested: Input validation on all server actions (after implementation)
- Files: Will be added to `actions/*.ts`
- Risk: Malformed client inputs cause unhandled errors or bypass logic
- Priority: **High** — foundational validation

---

## Dependencies at Risk

**Zod v4.3.6 (Installed but Unused):**
- Risk: Zod is installed but zero server actions use it; inconsistency with webhook validation pattern
- Impact: Validation layer never implemented; code has debt from incomplete refactor
- Migration plan: Systematically add Zod schemas to all server actions, prioritize financial/admin operations first
- Status: Low risk (dependency is maintained), high refactor overhead

**Sentry Integration (Partial):**
- Risk: Sentry initialized in `instrumentation.ts` and `sentry.*.config.ts` but unclear if actually capturing all errors (console.logs used in error boundaries instead of Sentry)
- Impact: Error visibility incomplete; production issues may go undetected
- Migration plan: Verify Sentry is capturing all exceptions, disable console.logs in error boundaries, ensure PII isn't captured by Replay
- Status: Medium risk (monitoring coverage unclear)

**@supabase/ssr v0.8.0:**
- Risk: Middleware uses `getAll()` / `setAll()` correctly per global CLAUDE.md instructions, but older patterns could be introduced
- Impact: Cookie management could break if reverted to deprecated methods
- Migration plan: Code review guidelines should flag direct auth-helpers imports
- Status: Low risk (pattern documented, no deprecated imports found)

---

## Missing Critical Features

**No Pagination on Key Listing Endpoints:**
- Problem: Storefront products, blog posts, reviews all fetch unbounded datasets
- Blocks: Can't scale catalog above 500 products without performance degradation
- Workaround: None (pages will slow down)
- Priority: High

**No Rate Limiting on Public Endpoints:**
- Problem: Auth, webhook, contact, review endpoints accept unlimited requests
- Blocks: Bot attacks, brute-force attempts, credential stuffing go unchecked
- Workaround: Manual IP blocks via hosting provider (not scalable)
- Priority: High

**No Inventory Reservation System:**
- Problem: Stock checked at checkout but never reserved; concurrent checkouts can both pass validation
- Blocks: Can't prevent overselling with popular products
- Workaround: Manual inventory adjustments after webhook processing
- Priority: Critical

**No Content Sanitization at Write Time:**
- Problem: Blog/product HTML stored unsanitized; only sanitized at render time
- Blocks: Can't detect malicious content during editing; relies on single defense layer
- Workaround: Assume admin accounts won't be compromised (high risk assumption)
- Priority: High (defense-in-depth gap)

---

*Concerns audit: 2025-02-26*
