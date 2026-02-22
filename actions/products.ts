"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeProduct, normalizeVariant } from "@/lib/normalize";
import type { Product, ProductVariant } from "@/types/database";
import { sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function getProducts(options?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
}): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.search) {
    const s = sanitizeSearchInput(options.search);
    query = query.or(
      `name.ilike.%${s}%,brand.ilike.%${s}%,tags.cs.{${s}}`
    );
  }

  switch (options?.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "best-sellers":
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Error fetching products", { error: error.message });
    return [];
  }

  return (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>));
}

export async function getProductBySlug(
  slug: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (productError || !product) {
    return null;
  }

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (variantsError) {
    logger.error("Error fetching variants", { error: variantsError.message });
  }

  return {
    product: normalizeProduct(product as Record<string, unknown>),
    variants: (variants ?? []).map((v) => normalizeVariant(v as Record<string, unknown>)),
  };
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    logger.error("Error fetching featured products", { error: error.message });
    return [];
  }

  return (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>));
}

