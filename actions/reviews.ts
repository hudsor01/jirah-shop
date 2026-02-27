"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductReview } from "@/types/database";
import { uuidSchema, paginationSchema, formatZodError } from "@/lib/validations";
import { parsePagination } from "@/lib/pagination";
import { reviewLimiter } from "@/lib/rate-limit";

// ─── Zod Schemas ─────────────────────────────────────────

const ReviewSubmitSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  title: z.string().max(200, "Review title must be under 200 characters").nullable(),
  comment: z.string().min(10, "Review comment must be at least 10 characters").max(5000, "Review comment must be under 5000 characters"),
});

const ReviewOptionsSchema = z.object({
  status: z.enum(["pending", "approved", "all"]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ─── Storefront ───────────────────────────────────────────

const StorefrontReviewOptionsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function getProductReviews(
  productId: string,
  options?: { page?: number; limit?: number }
): Promise<{
  data: ProductReview[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}> {
  const idParsed = z.string().min(1).safeParse(productId);
  if (!idParsed.success) {
    return { data: [], total: 0, page: 1, pageSize: 20, error: "Invalid product ID" };
  }

  const optionsParsed = StorefrontReviewOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return { data: [], total: 0, page: 1, pageSize: 20, error: "Invalid options" };
  }

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

  if (error) {
    return { data: [], total: 0, page, pageSize, error: error.message };
  }

  return {
    data: data as ProductReview[],
    total: count ?? 0,
    page,
    pageSize,
    error: null,
  };
}

export async function submitReview(formData: FormData): Promise<{
  success: boolean;
  error: string | null;
}> {
  const rateCheck = await reviewLimiter.check();
  if (!rateCheck.success) {
    return { success: false, error: "Too many requests, please try again later." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to leave a review." };
  }

  const raw = {
    product_id: (formData.get("product_id") as string) || "",
    rating: Number(formData.get("rating")),
    title: ((formData.get("title") as string) || "").trim() || null,
    comment: ((formData.get("comment") as string) || "").trim(),
  };

  const result = ReviewSubmitSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }

  const { data: hasPurchased } = await supabase.rpc('has_purchased_product', {
    p_user_id: user.id,
    p_product_id: result.data.product_id,
  })

  const { error } = await supabase.from("product_reviews").insert({
    product_id: result.data.product_id,
    user_id: user.id,
    rating: result.data.rating,
    title: result.data.title,
    comment: result.data.comment,
    is_verified_purchase: hasPurchased ?? false,
    is_approved: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ─── Admin ────────────────────────────────────────────────

import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function getAdminReviews(options?: {
  status?: "pending" | "approved" | "all";
  page?: number;
  limit?: number;
}): Promise<{ reviews: ProductReview[]; count: number }> {
  await requireAdmin();

  const optionsParsed = ReviewOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return { reviews: [], count: 0 };
  }

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

  if (error) {
    logger.error("Error fetching admin reviews", { error: error.message });
    return { reviews: [], count: 0 };
  }

  return { reviews: (data as ProductReview[]) ?? [], count: count ?? 0 };
}

export async function approveReview(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid review ID" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_reviews")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function rejectReview(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid review ID" };
  }

  const supabase = await createClient();

  // Delete rather than update: reviews start as is_approved=false, so
  // updating to false is a no-op. Deletion removes it from the queue permanently.
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function deleteReview(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid review ID" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}
