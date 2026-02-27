## Plan 04-03 Summary: Pagination for Products and Blog

**Status**: COMPLETE
**Commit**: 3a79a43

### What was done
1. Created `components/storefront/pagination-controls.tsx`:
   - Server-compatible component using shadcn Pagination primitives
   - Props: currentPage, totalPages, baseUrl, searchParams
   - Shows max 5 page numbers with ellipsis for large page counts
   - Preserves existing searchParams (category, search, sort, tag)
   - Returns null if totalPages <= 1

2. Updated `actions/products.ts` — `getProducts()`:
   - Added `page` option to Zod schema
   - Changed return type to `{ data: Product[], total: number, page: number, pageSize: number }`
   - Added `{ count: "exact" }` and `.range(from, to)` using `parsePagination()`
   - Default page size: 20

3. Updated `actions/blog.ts` — `getBlogPosts()`:
   - Added `page` option to Zod schema
   - Changed `.select("*")` to explicit column list excluding `content` (PERF-06)
   - Added `{ count: "exact" }` and `.range(from, to)`
   - Return type includes pagination metadata
   - Moved `parsePagination` import to top (removed duplicate)

4. Updated `app/(storefront)/shop/page.tsx`:
   - Reads `page` from searchParams
   - Destructures paginated response from `getProducts()`
   - Shows total count instead of page-length
   - Renders PaginationControls with preserved searchParams

5. Updated `app/(storefront)/shop/[category]/page.tsx`:
   - Same pagination pattern as shop page
   - Renders PaginationControls

6. Updated `app/(storefront)/blog/page.tsx`:
   - Accepts searchParams (page, tag)
   - Destructures paginated response from `getBlogPosts()`
   - Renders PaginationControls

### Verification
- [x] `getProducts()` returns `{ data, total, page, pageSize }` with `.range()` and `{ count: "exact" }`
- [x] `getBlogPosts()` excludes content column and uses `.range()` pagination
- [x] Shop page reads page from searchParams and renders PaginationControls
- [x] Blog page reads page from searchParams and renders PaginationControls
- [x] `getFeaturedProducts()` is unchanged (no pagination)
- [x] Storefront page size is 20 items
- [x] TypeScript compiles without errors
