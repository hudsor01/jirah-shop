"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductReview } from "@/types/database";

// ─── Storefront ───────────────────────────────────────────

export async function getProductReviews(productId: string): Promise<{
  data: ProductReview[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as ProductReview[], error: null };
}

export async function submitReview(formData: FormData): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to leave a review." };
  }

  const productId = formData.get("product_id") as string;
  const rating = Number(formData.get("rating"));
  const title = ((formData.get("title") as string) || "").trim() || null;
  const comment = ((formData.get("comment") as string) || "").trim();

  if (!productId || !rating || !comment) {
    return {
      success: false,
      error: "Please provide a rating and comment.",
    };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5." };
  }

  if (title && title.length > 200) {
    return { success: false, error: "Review title must be under 200 characters." };
  }

  if (comment.length < 10) {
    return { success: false, error: "Review comment must be at least 10 characters." };
  }

  if (comment.length > 5000) {
    return { success: false, error: "Review comment must be under 5000 characters." };
  }

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    title,
    comment,
    is_verified_purchase: false,
    is_approved: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ─── Admin ────────────────────────────────────────────────

import { requireAdmin } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";

export async function getAdminReviews(options?: {
  status?: "pending" | "approved" | "all";
  page?: number;
  limit?: number;
}): Promise<{ reviews: ProductReview[]; count: number }> {
  await requireAdmin();
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
    console.error("Error fetching admin reviews:", error.message);
    return { reviews: [], count: 0 };
  }

  return { reviews: (data as ProductReview[]) ?? [], count: count ?? 0 };
}

export async function approveReview(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
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
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_reviews")
    .update({ is_approved: false })
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
