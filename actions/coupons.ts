"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeCoupon } from "@/lib/normalize";
import { parsePagination } from "@/lib/pagination";
import type { Coupon, DiscountType } from "@/types/database";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";

export type CouponFormData = {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  is_active: boolean;
  expires_at: string | null;
};

export async function getAdminCoupons(options?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ coupons: Coupon[]; count: number }> {
  await requireAdmin();
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

  if (error) {
    logger.error("Error fetching coupons", { error: error.message });
    return { coupons: [], count: 0 };
  }

  return { coupons: (data ?? []).map((c) => normalizeCoupon(c as Record<string, unknown>)), count: count ?? 0 };
}

export async function createCoupon(
  formData: CouponFormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("coupons").insert({
    ...formData,
    code: formData.code.toUpperCase(),
    current_uses: 0,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function updateCoupon(
  id: string,
  formData: CouponFormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("coupons")
    .update({
      ...formData,
      code: formData.code.toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/coupons");
  return { success: true };
}
