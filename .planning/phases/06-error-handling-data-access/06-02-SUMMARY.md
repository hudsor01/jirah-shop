---
plan: 02
status: done
commits:
  - 7cb3a62  # Task 1: auth form consumers
  - b8d3f12  # Task 3: server components, cached queries, cart, blog, reviews
requirements_satisfied:
  - CQ-02
---

# Plan 06-02 Summary: Client Consumer Updates

## What was done

Updated all client and server component consumers to handle ActionResult<T> discriminated union from Plan 01.

### Task 1: Auth form consumers
- Updated `login-form.tsx` and `signup-form.tsx` to use `ActionResult<void> | null` with useActionState
- Replaced `AuthActionState` with direct `ActionResult` import
- Changed error display from `state.error &&` to `state && !state.success &&`
- Updated devSignIn consumer from `result.email` to `result.data.email`
- Removed deprecated `AuthActionState` type alias from `actions/auth.ts`

### Task 2: Mutation consumers (no changes needed)
- All 12 mutation consumer files already use `if (result.success) { ... } else { result.error }` pattern
- TypeScript discriminated union narrowing makes `result.error` available in else branches
- No code changes required

### Task 3: Server components, cached queries, and remaining consumers
- Added `unwrap()` helper to `lib/cached-queries.ts` that throws on ActionResult failure
- Updated all 10 admin server component pages to unwrap ActionResult returns
- Fixed storefront blog post page, blog list page, and review list server component
- Fixed cart page and cart drawer to use `result.success` pattern for validateCartPrices and createCheckoutSession

## Files modified

| File | Changes |
|------|---------|
| `components/auth/login-form.tsx` | ActionResult type, null initial state, devSignIn unwrap |
| `components/auth/signup-form.tsx` | ActionResult type, null initial state |
| `actions/auth.ts` | Removed deprecated AuthActionState alias |
| `lib/cached-queries.ts` | Added unwrap() helper for ActionResult |
| `app/admin/products/page.tsx` | Unwrap getAdminProducts result |
| `app/admin/products/[id]/edit/page.tsx` | Unwrap getAdminProduct result |
| `app/admin/blog/page.tsx` | Unwrap getAdminBlogPosts result |
| `app/admin/blog/[id]/edit/page.tsx` | Unwrap getAdminBlogPost result |
| `app/admin/coupons/page.tsx` | Unwrap getAdminCoupons result |
| `app/admin/orders/page.tsx` | Unwrap getAdminOrders result |
| `app/admin/orders/[id]/page.tsx` | Unwrap getAdminOrder result |
| `app/admin/page.tsx` | Unwrap getOrderStats + getRecentOrders |
| `app/admin/analytics/page.tsx` | Unwrap getSalesData results |
| `app/admin/reviews/page.tsx` | Unwrap getAdminReviews result |
| `app/(storefront)/blog/[slug]/page.tsx` | Use raw data from cachedGetBlogPostBySlug |
| `app/(storefront)/blog/page.tsx` | Remove error destructure from cachedGetBlogPosts |
| `app/(storefront)/cart/page.tsx` | Use result.success for validateCartPrices and createCheckoutSession |
| `components/storefront/cart-drawer.tsx` | Same cart checkout pattern |
| `components/storefront/review-list.tsx` | Unwrap getProductReviews result |

## Design decisions

- **Admin list pages** use fallback to empty data on failure (graceful degradation)
- **Admin detail pages** call `notFound()` on failure or null data
- **Cached queries** use `unwrap()` that throws on failure, propagating to Next.js error boundaries
- **Cart checkout** throws in try/catch to surface errors via existing toast handlers

## Verification

- TypeScript compilation passes with zero type errors
- All admin pages unwrap ActionResult correctly
- All mutation consumers use result.success discriminant
- No old `{ error }` or `{ data, error }` destructure patterns remain
