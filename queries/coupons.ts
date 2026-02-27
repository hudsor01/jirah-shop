import { createClient } from "@/lib/supabase/server";
import { normalizeCoupon } from "@/lib/normalize";
import { sanitizeSearchInput } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";
import type { Coupon } from "@/types/database";

export async function queryAdminCoupons(options?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ coupons: Coupon[]; count: number }> {
  const supabase = await createClient();
  const { from, to } = parsePagination(options);

  let query = supabase.from("coupons").select("*", { count: "exact" });

  if (options?.search) {
    const s = sanitizeSearchInput(options.search);
    query = query.ilike("code", `%${s}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    coupons: (data ?? []).map((c) => normalizeCoupon(c as Record<string, unknown>)),
    count: count ?? 0,
  };
}
