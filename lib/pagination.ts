/**
 * Parse pagination parameters from search params.
 * Returns page, pageSize, and the Supabase `range(from, to)` bounds.
 *
 * Used by every admin list action (products, orders, coupons, blog, customers).
 */
export function parsePagination(options?: {
  page?: number;
  limit?: number;
}): {
  page: number;
  pageSize: number;
  from: number;
  to: number;
} {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, options?.limit ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { page, pageSize, from, to };
}
