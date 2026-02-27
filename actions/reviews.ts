"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductReview } from "@/types/database";
import { uuidSchema, paginationSchema, formatZodError } from "@/lib/validations";
import { reviewLimiter } from "@/lib/rate-limit";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { queryProductReviews, queryAdminReviews } from "@/queries/reviews";

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
): Promise<ActionResult<{
  data: ProductReview[];
  total: number;
  page: number;
  pageSize: number;
}>> {
  const idParsed = z.string().min(1).safeParse(productId);
  if (!idParsed.success) {
    return fail("Invalid product ID");
  }

  const optionsParsed = StorefrontReviewOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return fail("Invalid options");
  }

  try {
    const result = await queryProductReviews(productId, options);
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch reviews");
  }
}

/**
 * Submits a product review from an authenticated user.
 *
 * Enforces rate limiting, validates authentication, parses form data with Zod
 * (product_id, rating 1-5, optional title, comment 10-5000 chars), checks if
 * the user has purchased the product via Supabase RPC, then inserts the review
 * as unapproved (is_approved=false) pending admin moderation.
 *
 * @param formData - Form data containing product_id, rating (1-5), title
 *   (optional, max 200 chars), and comment (10-5000 chars)
 * @returns ActionResult<void> - Success with undefined, or error message.
 *   Possible errors: "Too many requests, please try again later.", "Please
 *   sign in to leave a review.", Zod validation errors, Supabase insert errors
 *
 * @sideeffects
 * - Checks rate limit via reviewLimiter
 * - Validates user authentication via Supabase auth
 * - Calls has_purchased_product RPC to set is_verified_purchase flag
 * - Inserts review into Supabase (is_approved=false, pending moderation)
 */
export async function submitReview(formData: FormData): Promise<ActionResult<void>> {
  const rateCheck = await reviewLimiter.check();
  if (!rateCheck.success) {
    return fail("Too many requests, please try again later.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Please sign in to leave a review.");
  }

  const raw = {
    product_id: (formData.get("product_id") as string) || "",
    rating: Number(formData.get("rating")),
    title: ((formData.get("title") as string) || "").trim() || null,
    comment: ((formData.get("comment") as string) || "").trim(),
  };

  const result = ReviewSubmitSchema.safeParse(raw);
  if (!result.success) {
    return fail(formatZodError(result.error));
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
    return fail(error.message);
  }

  return ok(undefined);
}

// ─── Admin ────────────────────────────────────────────────

import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function getAdminReviews(options?: {
  status?: "pending" | "approved" | "all";
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ reviews: ProductReview[]; count: number }>> {
  await requireAdmin();

  const optionsParsed = ReviewOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return ok({ reviews: [], count: 0 });
  }

  try {
    const result = await queryAdminReviews(options);
    return ok(result);
  } catch (e) {
    logger.error("Error fetching admin reviews", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch reviews");
  }
}

export async function approveReview(
  id: string
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid review ID");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_reviews")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/admin/reviews");
  return ok(undefined);
}

/**
 * Permanently remove a review by ID.
 * Used by both "reject" (admin moderation) and "delete" (admin cleanup).
 */
export async function deleteReview(
  id: string
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid review ID");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/admin/reviews");
  return ok(undefined);
}

/**
 * Reject a pending review (alias for deleteReview).
 * Reviews start as is_approved=false, so deletion removes them permanently.
 */
export const rejectReview = deleteReview;
