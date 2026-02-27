# Phase 6: Error Handling & Data Access - Research

**Researched:** 2026-02-26
**Domain:** Server action error contracts, data access layer extraction, code quality
**Confidence:** HIGH

## Summary

Phase 6 is an internal refactoring phase. No new external libraries are needed -- the work uses the existing `ActionResult<T>` type already defined in `lib/action-result.ts` (with `ok()` and `fail()` helpers). The core work is: (1) converting all 41 exported server action functions across 11 files to return `ActionResult<T>`, (2) updating ~30 client consumers to discriminate on `result.success`, (3) extracting read queries from actions into a new `queries/` layer, and (4) fixing specific code quality issues.

The existing codebase has at least 4 different error return shapes that must be unified. The `cached-queries.ts` layer from Phase 5 currently wraps action functions directly -- after this phase it should wrap query functions instead.

**Primary recommendation:** Start with ActionResult adoption (highest blast radius), then client consumer updates (must match), then queries extraction (structural), then code quality fixes (independent).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `ActionResult<T>` is already defined in `lib/action-result.ts` as `{ success: true, data: T } | { success: false, error: string }`
- All 38 server actions across 11 files must return `ActionResult<T>` instead of raw throws, ad-hoc `{ error }`, or inconsistent shapes
- Actions that currently throw errors: wrap in try/catch, return `{ success: false, error: "message" }`
- Actions that return `{ error: string }`: convert to `{ success: false, error }`
- Actions that return raw data: wrap in `{ success: true, data }`
- Void actions (mutations with no return value): use `ActionResult<void>` returning `{ success: true, data: undefined }`
- Every client component that calls a server action must handle `ActionResult<T>` by checking `result.success`
- Replace patterns like `if (result?.error)` with `if (!result.success)`
- Toast messages: `result.success ? toast.success(...) : toast.error(result.error)`
- Forms using `useActionState`: state type becomes `ActionResult<T> | null`
- Create `queries/` directory at project root (sibling to `actions/`)
- Extract all Supabase read queries from actions into query functions
- Query functions are pure data access -- no auth checks, no business logic
- Server actions call query functions for reads, keep writes inline
- Cached query wrappers (from Phase 5) move to use these base query functions
- Shared checkout hook: extract duplicated checkout flow logic
- Deduplicate review actions
- Fix double toast issue
- Product form refactoring: break large product form into subcomponents if >400 lines
- Imports ordering: consistent pattern
- Coupon form state reset after successful creation
- Replace any direct array mutation with immutable patterns
- `SITE_URL` uses validated env module instead of raw `process.env`

### Claude's Discretion
- Exact file organization within `queries/` directory
- Which query functions to extract first vs later
- How to break up the product form (by section vs by field type)
- Import ordering tool (manual convention vs eslint rule)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CQ-01 | All 38 server actions return `ActionResult<T>` discriminated union | Audit below catalogs all 41 exported functions, their current return shapes, and conversion strategy |
| CQ-02 | Client consumers handle `ActionResult<T>` correctly | Consumer inventory identifies all ~30 import sites and their current handling patterns |
| CQ-03 | Data access extracted to `queries/` layer | Architecture pattern defined; read-only functions identified per action file |
| CQ-04 | Duplicate checkout logic extracted to shared hook | Cart drawer and cart page both import identical `validateCartPrices` + `createCheckoutSession` flow |
| CQ-05 | `rejectReview` and `deleteReview` deduplicated | Both perform `requireAdmin()` + status/delete update with identical error handling |
| CQ-06 | Suppressed ESLint `exhaustive-deps` fixed | Located in `hooks/use-supabase-upload.ts` |
| CQ-07 | Tag search uses `ilike` instead of array containment | `products.ts:53` uses `tags.cs.{${s}}` which is fragile |
| CQ-08 | Double toast on add-to-cart fixed | `ProductCard` calls `addItem()` + `toast.success()` -- cart context also toasts |
| CQ-09 | Product form refactored from 20+ useState | 440 lines, 20 `useState` calls -- needs `useReducer` or subcomponent extraction |
| CQ-10 | Imports consistently ordered | Manual convention (React, Next, external, internal, types) |
| CQ-11 | Coupon form state resets on mode switch | `components/admin/coupon-form.tsx` |
| CQ-12 | File object mutation replaced with proper pattern | `hooks/use-supabase-upload.ts` type assertion pattern |
| CQ-13 | `SITE_URL` uses validated env | `lib/constants.ts:64` uses `process.env.NEXT_PUBLIC_SITE_URL!` -- should use `env.NEXT_PUBLIC_SITE_URL` from `lib/env.ts` |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Location | Purpose | Status |
|---------|----------|---------|--------|
| `ActionResult<T>` | `lib/action-result.ts` | Discriminated union return type | Defined but unused in actions |
| `ok()` / `fail()` | `lib/action-result.ts` | Helper constructors | Defined but unused |
| `env` module | `lib/env.ts` | Validated environment variables | Exists, used by webhook |
| `lib/cached-queries.ts` | `lib/cached-queries.ts` | Phase 5 caching layer | Wraps action functions currently |

### No New Dependencies Required

This phase is purely internal refactoring. No npm installs needed.

## Architecture Patterns

### Pattern 1: ActionResult Return Convention

**Current state -- 4 distinct error shapes found:**

| Shape | Files Using It | Example |
|-------|---------------|---------|
| `{ error: string }` | auth.ts | `return { error: "Too many requests" }` |
| `{ data: T, error: string \| null }` | blog.ts (reads), reviews.ts (reads) | `return { data: null, error: "Invalid slug" }` |
| `{ success: boolean, error?: string }` | blog.ts (writes), reviews.ts (writes), admin-products.ts | `return { success: true }` |
| `{ url: string }` or raw data | checkout.ts, auth.ts (Google) | `return { url: session.url }` |

**Target state -- single shape:**
```typescript
// All actions return ActionResult<T>
import { ok, fail } from "@/lib/action-result";

// Read action returning data
export async function getProducts(): Promise<ActionResult<Product[]>> {
  // ... query logic ...
  return ok(products);
}

// Mutation returning void
export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  // ... mutation logic ...
  return ok(undefined);
}

// Error case
return fail("Product not found");
```

### Pattern 2: Auth Actions (useActionState)

Auth actions (`signInWithEmail`, `signUpWithEmail`) use React's `useActionState` which requires a specific signature: `(prevState: S, formData: FormData) => Promise<S>`.

**Current:**
```typescript
export type AuthActionState = { error: string | null };
export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> { ... }
```

**Target:**
```typescript
export async function signInWithEmail(
  _prev: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  // success returns ok(undefined) which triggers redirect
  // error returns fail("message") which form displays
}
```

**Client update:**
```typescript
const [state, formAction, isPending] = useActionState(
  signInWithEmail,
  null  // initial state is null, not ActionResult
);
// Display: state && !state.success ? state.error : null
```

### Pattern 3: Queries Layer

**Structure:**
```
queries/
├── products.ts      # getProducts, getProductBySlug, getFeaturedProducts, validateCartPrices
├── orders.ts        # getOrderStats, getRecentOrders, getSalesData, getAdminOrders, getAdminOrder
├── blog.ts          # getBlogPosts, getBlogPostBySlug, getAdminBlogPosts, getAdminBlogPost
├── reviews.ts       # getProductReviews, getAdminReviews
├── coupons.ts       # getAdminCoupons
├── settings.ts      # getShopSettings
└── account.ts       # getAccountOrders (if exists)
```

**Query function signature:**
```typescript
// queries/products.ts
import { createClient } from "@/lib/supabase/server";

export async function queryProducts(options?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
}) {
  const supabase = await createClient();
  // Pure Supabase query -- no auth checks, no business logic
  let query = supabase.from("products").select("*", { count: "exact" });
  // ... filters ...
  const { data, error, count } = await query;
  if (error) throw error; // Let the action handle error wrapping
  return { data, count };
}
```

**Action calls query:**
```typescript
// actions/products.ts
import { queryProducts } from "@/queries/products";
import { ok, fail } from "@/lib/action-result";

export async function getProducts(options?: {...}): Promise<ActionResult<{data: Product[], total: number, ...}>> {
  try {
    const result = await queryProducts(options);
    return ok({ data: result.data, total: result.count, ... });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch products");
  }
}
```

**Cached query update:**
```typescript
// lib/cached-queries.ts (updated)
import { queryProducts } from "@/queries/products";

export async function cachedGetProducts(options?: {...}) {
  "use cache";
  cacheTag("products");
  return queryProducts(options);  // Wraps query, not action
}
```

### Pattern 4: Shared Checkout Hook

**Current duplication:** `cart-drawer.tsx` lines 40-65 and `cart/page.tsx` lines 48-75 have identical checkout flow:
1. Validate cart prices
2. Update items if prices changed
3. Create checkout session
4. Redirect to Stripe URL

**Target:**
```typescript
// hooks/use-checkout.ts
export function useCheckout() {
  const { items, updateItemPrices } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  async function checkout(couponCode?: string) {
    setIsLoading(true);
    try {
      const { valid, updates } = await validateCartPrices(items.map(...));
      if (!valid && updates) updateItemPrices(updates);
      const result = await createCheckoutSession(items, couponCode);
      if (result.success) window.location.href = result.data.url;
      else toast.error(result.error);
    } catch (e) {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return { checkout, isLoading };
}
```

### Anti-Patterns to Avoid
- **Mixing old and new return shapes:** All actions in a file must be converted together
- **Forgetting `Promise<ActionResult<T>>` return type annotation:** TypeScript won't catch shape errors without it
- **Double-wrapping queries:** The query layer should throw raw errors, not return ActionResult
- **Breaking cached-queries during transition:** Update cached-queries AFTER queries layer is complete

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ActionResult type | New discriminated union | Existing `lib/action-result.ts` | Already defined with `ok()`/`fail()` helpers |
| Error message formatting | Custom error parsers | `fail(e instanceof Error ? e.message : "...")` | Consistent one-liner pattern |
| Form state types | Custom form state unions | `ActionResult<T> \| null` | Matches React's `useActionState` expectations |

## Common Pitfalls

### Pitfall 1: Auth Action Signature Change Breaks useActionState
**What goes wrong:** Changing auth action return type without updating `useActionState` generic causes type errors or runtime crashes.
**Why it happens:** `useActionState<S>` requires `(prevState: S, formData: FormData) => Promise<S>` -- the prev state and return type must match.
**How to avoid:** Update action AND consumer together. The initial state must be `null`, and the type becomes `ActionResult<void> | null`.

### Pitfall 2: Read Actions Returning ActionResult Break Cached Queries
**What goes wrong:** If `getProducts` returns `ActionResult<{data, total}>`, then `cachedGetProducts` also returns `ActionResult`, and pages must unwrap twice.
**How to avoid:** After queries extraction, cached queries wrap the RAW query function (which returns data directly), not the action (which returns ActionResult). Pages calling cached queries get raw data; only form/mutation consumers get ActionResult.

### Pitfall 3: Checkout Session URL in ActionResult
**What goes wrong:** `createCheckoutSession` currently returns `{ url: string }`. Wrapping in `ActionResult<{ url: string }>` means consumers must check `result.success` before accessing `result.data.url`.
**How to avoid:** Update both cart-drawer and cart-page consumers simultaneously. The shared checkout hook handles the unwrapping.

### Pitfall 4: Blog/Review Read Functions Return Shape Change
**What goes wrong:** `getBlogPosts` currently returns `{ data: BlogPost[], total: number, page: number, pageSize: number, error: string | null }`. Converting to `ActionResult<{data, total, page, pageSize}>` changes how every page that calls it handles the response.
**How to avoid:** Storefront pages should call cached query functions (raw data). Admin pages that call these reads directly need consumer updates. Map each callsite before converting.

### Pitfall 5: `success: true` Existing Shape Confusion
**What goes wrong:** Some actions already return `{ success: true }` or `{ success: false, error }` but without the `data` field. These look like ActionResult but aren't type-compatible.
**How to avoid:** Convert `{ success: true }` to `ok(undefined)` for void actions, `{ success: true, id }` to `ok(id)` for data-returning actions.

## Code Examples

### Converting an Auth Action
```typescript
// BEFORE (auth.ts)
export type AuthActionState = { error: string | null };
export async function signInWithEmail(
  _prev: AuthActionState, formData: FormData
): Promise<AuthActionState> {
  // ... validation ...
  return { error: "Rate limited" };  // error
  return { error: null };             // success (redirect happens)
}

// AFTER
import { type ActionResult, ok, fail } from "@/lib/action-result";
export async function signInWithEmail(
  _prev: ActionResult<void> | null, formData: FormData
): Promise<ActionResult<void>> {
  // ... validation ...
  return fail("Rate limited");       // error
  return ok(undefined);               // success
}
```

### Converting a Read Action with Query Extraction
```typescript
// BEFORE (actions/blog.ts)
export async function getBlogPostBySlug(slug: string) {
  if (!slug) return { data: null, error: "Invalid slug" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts")...
  if (error) return { data: null, error: error.message };
  return { data: data as BlogPost, error: null };
}

// AFTER - Query layer (queries/blog.ts)
export async function queryBlogPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts")...
  if (error) throw error;
  return data as BlogPost | null;
}

// AFTER - Action layer (actions/blog.ts)
import { queryBlogPostBySlug } from "@/queries/blog";
export async function getBlogPostBySlug(slug: string): Promise<ActionResult<BlogPost | null>> {
  if (!slug) return fail("Invalid slug");
  try {
    const post = await queryBlogPostBySlug(slug);
    return ok(post);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch post");
  }
}
```

### Client Consumer Update
```typescript
// BEFORE
const result = await updateOrderStatus(orderId, status);
if (result.error) toast.error(result.error);
else toast.success("Updated");

// AFTER
const result = await updateOrderStatus(orderId, status);
if (result.success) toast.success("Updated");
else toast.error(result.error);
```

## Codebase Audit

### All Server Action Files and Functions

| File | Function | Current Return | Target Return | Has Consumers |
|------|----------|---------------|---------------|---------------|
| auth.ts | `signInWithEmail` | `AuthActionState {error}` | `ActionResult<void>` | login-form.tsx (useActionState) |
| auth.ts | `signUpWithEmail` | `AuthActionState {error}` | `ActionResult<void>` | signup-form.tsx (useActionState) |
| auth.ts | `signInWithGoogle` | `{error} \| {url}` | `ActionResult<{url: string}>` | (unused -- may remove) |
| auth.ts | `signOut` | void (redirect) | `ActionResult<void>` | account/page.tsx |
| dev-auth.ts | `devSignIn` | redirect/throw | `ActionResult<void>` | login-form.tsx |
| checkout.ts | `createCheckoutSession` | `{url}` | `ActionResult<{url: string}>` | cart-drawer, cart/page |
| contact.ts | `submitContactForm` | `{error?} \| {success}` | `ActionResult<void>` | contact-form.tsx |
| products.ts | `getProducts` | `{data, total, ...}` | Query layer → `ActionResult<...>` | products page (cached) |
| products.ts | `getProductBySlug` | `Product \| null` | Query layer → `ActionResult<Product \| null>` | product detail (cached) |
| products.ts | `getFeaturedProducts` | `Product[]` | Query layer → `ActionResult<Product[]>` | home page (cached) |
| products.ts | `validateCartPrices` | `{valid, updates?}` | `ActionResult<{valid, updates?}>` | cart-drawer, cart/page |
| admin-products.ts | `getAdminProducts` | `{data, total, ...}` | `ActionResult<...>` | admin products page |
| admin-products.ts | `getAdminProduct` | `Product \| null` | `ActionResult<Product \| null>` | admin edit page |
| admin-products.ts | `createProduct` | `{success, error?, id?}` | `ActionResult<string>` (id) | product-form.tsx |
| admin-products.ts | `updateProduct` | `{success, error?}` | `ActionResult<void>` | product-form.tsx |
| admin-products.ts | `deleteProduct` | `{success, error?}` | `ActionResult<void>` | products-client.tsx |
| blog.ts | `getBlogPosts` | `{data, total, ..., error}` | Query layer → `ActionResult<...>` | blog page (cached) |
| blog.ts | `getBlogPostBySlug` | `{data, error}` | Query layer → `ActionResult<...>` | blog detail (cached) |
| blog.ts | `getAdminBlogPosts` | `{posts, count}` | `ActionResult<{posts, count}>` | admin blog page |
| blog.ts | `getAdminBlogPost` | blog post or null | `ActionResult<BlogPost \| null>` | admin blog edit |
| blog.ts | `createBlogPost` | `{success, error?, id?}` | `ActionResult<string>` | blog-editor.tsx |
| blog.ts | `updateBlogPost` | `{success, error?}` | `ActionResult<void>` | blog-editor.tsx |
| blog.ts | `deleteBlogPost` | `{success, error?}` | `ActionResult<void>` | blog-list-client.tsx |
| orders.ts | `getOrderStats` | stats object | `ActionResult<OrderStats>` | admin dashboard |
| orders.ts | `getRecentOrders` | orders array | `ActionResult<Order[]>` | admin dashboard |
| orders.ts | `getSalesData` | sales data | `ActionResult<SalesData[]>` | admin analytics |
| orders.ts | `getAdminOrders` | `{data, total, ...}` | `ActionResult<...>` | admin orders page |
| orders.ts | `getAdminOrder` | order or null | `ActionResult<Order \| null>` | admin order detail |
| orders.ts | `updateOrderStatus` | `{success, error?}` | `ActionResult<void>` | order-table, order-status-updater |
| reviews.ts | `getProductReviews` | `{data, total, ..., error}` | Query layer → `ActionResult<...>` | review-list.tsx |
| reviews.ts | `submitReview` | `{success, error?}` | `ActionResult<void>` | review-form.tsx |
| reviews.ts | `getAdminReviews` | `{reviews, count}` | `ActionResult<{reviews, count}>` | admin reviews page |
| reviews.ts | `approveReview` | `{success, error?}` | `ActionResult<void>` | reviews-client.tsx |
| reviews.ts | `rejectReview` | `{success, error?}` | `ActionResult<void>` | reviews-client.tsx |
| reviews.ts | `deleteReview` | `{success, error?}` | `ActionResult<void>` | reviews-client.tsx |
| coupons.ts | `getAdminCoupons` | coupons data | `ActionResult<...>` | admin coupons page |
| coupons.ts | `createCoupon` | `{success, error?}` | `ActionResult<void>` | coupon-form.tsx |
| coupons.ts | `updateCoupon` | `{success, error?}` | `ActionResult<void>` | coupon-form.tsx |
| coupons.ts | `deleteCoupon` | `{success, error?}` | `ActionResult<void>` | coupons-client.tsx |
| settings.ts | `getShopSettings` | settings object | Query layer → `ActionResult<Settings>` | admin settings, cached |
| settings.ts | `updateShopSettings` | `{success, error?}` | `ActionResult<void>` | settings-client.tsx |

### Client Consumer Inventory

| Consumer | Actions Imported | Current Pattern | Update Needed |
|----------|-----------------|-----------------|---------------|
| `components/auth/login-form.tsx` | signInWithEmail, devSignIn | `useActionState`, checks `state?.error` | Update state type, check `!state.success` |
| `components/auth/signup-form.tsx` | signUpWithEmail | `useActionState`, checks `state?.error` | Update state type, check `!state.success` |
| `components/storefront/cart-drawer.tsx` | createCheckoutSession, validateCartPrices | Destructures `{ url }`, `{ valid, updates }` | Use shared checkout hook |
| `app/(storefront)/cart/page.tsx` | createCheckoutSession, validateCartPrices | Same as cart-drawer | Use shared checkout hook |
| `components/storefront/contact-form.tsx` | submitContactForm | Checks `result.error` | Check `!result.success` |
| `components/storefront/review-form.tsx` | submitReview | Checks `result.success` | Already close, add `result.data` type |
| `components/storefront/review-list.tsx` | getProductReviews | Destructures `{ data, total }` | Will call cached query (no ActionResult) |
| `components/storefront/product-card.tsx` | (cart context) | `addItem()` + `toast.success()` | Fix double toast |
| `components/admin/product-form.tsx` | createProduct, updateProduct | Checks `result.error` | Check `!result.success` |
| `components/admin/coupon-form.tsx` | createCoupon, updateCoupon | Checks `result.error` | Check `!result.success`, add state reset |
| `components/admin/blog-editor.tsx` | createBlogPost, updateBlogPost | Checks `result.error` | Check `!result.success` |
| `components/admin/order-table.tsx` | updateOrderStatus | Checks `result.error` | Check `!result.success` |
| `app/admin/products/products-client.tsx` | deleteProduct | Checks `result.error` | Check `!result.success` |
| `app/admin/blog/blog-list-client.tsx` | deleteBlogPost | Checks `result.error` | Check `!result.success` |
| `app/admin/coupons/coupons-client.tsx` | deleteCoupon | Checks `result.error` | Check `!result.success` |
| `app/admin/reviews/reviews-client.tsx` | approveReview, rejectReview, deleteReview | Checks `result.error` | Check `!result.success` |
| `app/admin/orders/[id]/order-status-updater.tsx` | updateOrderStatus | Checks `result.error` | Check `!result.success` |
| `app/admin/settings/settings-client.tsx` | updateShopSettings | Checks `result.error` | Check `!result.success` |
| `app/admin/settings/page.tsx` | getShopSettings | Direct data use | Will use cached query |
| `app/admin/products/page.tsx` | getAdminProducts | Direct data use | Unwrap ActionResult |
| `app/admin/products/[id]/edit/page.tsx` | getAdminProduct | Direct data use | Unwrap ActionResult |
| `app/admin/blog/page.tsx` | getAdminBlogPosts | Direct data use | Unwrap ActionResult |
| `app/admin/blog/[id]/edit/page.tsx` | getAdminBlogPost | Direct data use | Unwrap ActionResult |
| `app/admin/coupons/page.tsx` | getAdminCoupons | Direct data use | Unwrap ActionResult |
| `app/admin/orders/page.tsx` | getAdminOrders | Direct data use | Unwrap ActionResult |
| `app/admin/orders/[id]/page.tsx` | getAdminOrder | Direct data use | Unwrap ActionResult |
| `app/admin/page.tsx` | getOrderStats, getRecentOrders | Direct data use | Unwrap ActionResult |
| `app/admin/analytics/page.tsx` | getSalesData | Direct data use | Unwrap ActionResult |
| `app/admin/reviews/page.tsx` | getAdminReviews | Direct data use | Unwrap ActionResult |
| `app/(storefront)/account/page.tsx` | signOut | Direct call | No change (void action) |

### Query Extraction Candidates

Functions that are purely read operations (no auth guards, no mutations):

| Current Location | Function | Move To | Used By Cached Queries? |
|-----------------|----------|---------|------------------------|
| products.ts | `getProducts` | queries/products.ts | Yes - `cachedGetProducts` |
| products.ts | `getProductBySlug` | queries/products.ts | Yes - `cachedGetProductBySlug` |
| products.ts | `getFeaturedProducts` | queries/products.ts | Yes - `cachedGetFeaturedProducts` |
| products.ts | `validateCartPrices` | queries/products.ts | No |
| blog.ts | `getBlogPosts` | queries/blog.ts | Yes - `cachedGetBlogPosts` |
| blog.ts | `getBlogPostBySlug` | queries/blog.ts | Yes - `cachedGetBlogPostBySlug` |
| reviews.ts | `getProductReviews` | queries/reviews.ts | No |
| settings.ts | `getShopSettings` | queries/settings.ts | Yes - `cachedGetShopSettings` |

**Admin reads** (have `requireAdmin()` guard -- keep auth in action, extract query):

| Current Location | Function | Query Extraction | Auth Stays In Action |
|-----------------|----------|-----------------|---------------------|
| admin-products.ts | `getAdminProducts` | `queryAdminProducts` | Yes |
| admin-products.ts | `getAdminProduct` | `queryAdminProduct` | Yes |
| blog.ts | `getAdminBlogPosts` | `queryAdminBlogPosts` | Yes |
| blog.ts | `getAdminBlogPost` | `queryAdminBlogPost` | Yes |
| orders.ts | `getOrderStats` | Uses RPC -- keep inline | Yes |
| orders.ts | `getRecentOrders` | `queryRecentOrders` | Yes |
| orders.ts | `getSalesData` | Uses RPC -- keep inline | Yes |
| orders.ts | `getAdminOrders` | `queryAdminOrders` | Yes |
| orders.ts | `getAdminOrder` | `queryAdminOrder` | Yes |
| reviews.ts | `getAdminReviews` | `queryAdminReviews` | Yes |
| coupons.ts | `getAdminCoupons` | `queryAdminCoupons` | Yes |

### Code Quality Targets

| Issue | Location | Fix |
|-------|----------|-----|
| Double toast (CQ-08) | `product-card.tsx:46` toasts, cart context may also toast | Remove toast from ProductCard, let cart context handle it |
| Product form size (CQ-09) | `product-form.tsx` (440 lines, 20 useState) | Extract subcomponents: BasicInfoFields, PricingFields, ImageSection, VariantSection |
| Import ordering (CQ-10) | All action files | Manual convention: React/Next → external → @/ internal → relative → types |
| Coupon form reset (CQ-11) | `coupon-form.tsx` | Reset form state after successful create (not just update) |
| File mutation (CQ-12) | `use-supabase-upload.ts` | Replace type assertion mutation with spread/Object.assign pattern |
| SITE_URL (CQ-13) | `lib/constants.ts:64` | Change `process.env.NEXT_PUBLIC_SITE_URL!` to `env.NEXT_PUBLIC_SITE_URL` from `lib/env.ts` |
| Tag search (CQ-07) | `products.ts:53` `tags.cs.{${s}}` | Use `.ilike("tags::text", `%${s}%`)` or full-text search |
| Review dedup (CQ-05) | `reviews.ts` rejectReview/deleteReview | Both do requireAdmin + single Supabase update/delete -- create shared helper |
| Checkout dedup (CQ-04) | cart-drawer.tsx + cart/page.tsx | Extract `useCheckout()` hook |
| ESLint exhaustive-deps (CQ-06) | `hooks/use-supabase-upload.ts` | Add proper dependency array or extract to useCallback |

## Open Questions

1. **RPC-based functions (getOrderStats, getSalesData):** These call Postgres RPCs, not direct table queries. Should they still be extracted to queries layer?
   - Recommendation: Keep RPCs inline in actions -- they're already encapsulated and don't benefit from extraction.

2. **signInWithGoogle server action:** Listed as unused (buttons call browser client directly). Should it be removed in this phase?
   - Recommendation: Yes, removing dead code fits CQ scope. Include in code quality plan.

3. **Cart context toasting:** Need to verify if cart context `addItem` actually triggers a toast (CQ-08). If not, the "double toast" may be elsewhere.
   - Recommendation: Executor should investigate `providers/cart-provider.tsx` during implementation.

## Sources

### Primary (HIGH confidence)
- Codebase audit via `grep`, `Read` across all 11 action files
- `lib/action-result.ts` -- existing type definition
- `lib/cached-queries.ts` -- Phase 5 caching layer
- `lib/env.ts` -- validated environment module

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| ActionResult adoption | HIGH | Direct codebase audit, type already defined |
| Client consumers | HIGH | Grep-based inventory of all import sites |
| Queries extraction | HIGH | Clear pattern, similar to established architectures |
| Code quality fixes | HIGH | Specific line numbers identified |

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (stable -- internal refactoring, no external dependency changes)
