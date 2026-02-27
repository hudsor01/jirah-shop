"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeCoupon } from "@/lib/normalize";
import { parsePagination } from "@/lib/pagination";
import type { Coupon, DiscountType } from "@/types/database";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { uuidSchema, paginationSchema, formatZodError } from "@/lib/validations";
import { type ActionResult, ok, fail } from "@/lib/action-result";

// ─── Zod Schemas ─────────────────────────────────────────

const CouponFormDataSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.number().positive("Discount value must be positive"),
  min_order_amount: z.number().min(0).nullable(),
  max_uses: z.number().int().positive().nullable(),
  is_active: z.boolean(),
  expires_at: z.string().nullable(),
});

const AdminCouponsOptionsSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// ─── Actions ─────────────────────────────────────────────

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
}): Promise<ActionResult<{ coupons: Coupon[]; count: number }>> {
  await requireAdmin();

  const optionsParsed = AdminCouponsOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return ok({ coupons: [], count: 0 });
  }

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
    return fail(error.message);
  }

  return ok({ coupons: (data ?? []).map((c) => normalizeCoupon(c as Record<string, unknown>)), count: count ?? 0 });
}

export async function createCoupon(
  formData: CouponFormData
): Promise<ActionResult<void>> {
  await requireAdmin();

  const formParsed = CouponFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return fail(formatZodError(formParsed.error));
  }

  const supabase = await createClient();

  const { error } = await supabase.from("coupons").insert({
    ...formData,
    code: formData.code.toUpperCase(),
    current_uses: 0,
  });

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/admin/coupons");
  return ok(undefined);
}

export async function updateCoupon(
  id: string,
  formData: CouponFormData
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid coupon ID");
  }
  const formParsed = CouponFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return fail(formatZodError(formParsed.error));
  }

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
    return fail(error.message);
  }

  revalidatePath("/admin/coupons");
  return ok(undefined);
}

export async function deleteCoupon(
  id: string
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid coupon ID");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/admin/coupons");
  return ok(undefined);
}
