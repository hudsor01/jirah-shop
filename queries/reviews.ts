import { createClient } from "@/lib/supabase/server";
import { parsePagination } from "@/lib/pagination";
import type { ProductReview } from "@/types/database";

// ─── Storefront Queries ──────────────────────────────────

export async function queryProductReviews(
  productId: string,
  options?: { page?: number; limit?: number }
): Promise<{ data: ProductReview[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { page, pageSize, from, to } = parsePagination({
    page: options?.page,
    limit: options?.limit ?? 20,
  });

  const { data, error, count } = await supabase
    .from("product_reviews")
    .select("*", { count: "exact" })
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: data as ProductReview[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ─── Admin Queries ───────────────────────────────────────

export async function queryAdminReviews(options?: {
  status?: "pending" | "approved" | "all";
  page?: number;
  limit?: number;
}): Promise<{ reviews: ProductReview[]; count: number }> {
  const supabase = await createClient();
  const { from, to } = parsePagination(options);

  let query = supabase
    .from("product_reviews")
    .select("*", { count: "exact" });

  if (options?.status === "pending") {
    query = query.eq("is_approved", false);
  } else if (options?.status === "approved") {
    query = query.eq("is_approved", true);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return { reviews: (data as ProductReview[]) ?? [], count: count ?? 0 };
}
