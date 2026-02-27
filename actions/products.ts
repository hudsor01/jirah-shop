"use server";

import { z } from "zod";
import { sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import {
  queryProducts,
  queryProductBySlug,
  queryFeaturedProducts,
  queryValidateCartPrices,
} from "@/queries/products";
import type { Product, ProductVariant } from "@/types/database";

// ─── Zod Schemas ─────────────────────────────────────────

const ProductQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  limit: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
});

// ─── Actions ─────────────────────────────────────────────

export async function getProducts(options?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
}): Promise<ActionResult<{ data: Product[]; total: number; page: number; pageSize: number }>> {
  const optionsParsed = ProductQuerySchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return ok({ data: [], total: 0, page: 1, pageSize: 20 });
  }

  try {
    const result = await queryProducts(options);
    return ok(result);
  } catch (e) {
    logger.error("Error fetching products", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch products");
  }
}

export async function getProductBySlug(
  slug: string
): Promise<ActionResult<{ product: Product; variants: ProductVariant[] } | null>> {
  const slugParsed = z.string().min(1).safeParse(slug);
  if (!slugParsed.success) {
    return ok(null);
  }

  try {
    const result = await queryProductBySlug(slug);
    return ok(result);
  } catch (e) {
    logger.error("Error fetching product by slug", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch product");
  }
}

export async function getFeaturedProducts(): Promise<ActionResult<Product[]>> {
  try {
    const result = await queryFeaturedProducts();
    return ok(result);
  } catch (e) {
    logger.error("Error fetching featured products", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch featured products");
  }
}

// ─── Cart Price Validation ────────────────────────────────

const CartValidationItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().nullable(),
  price: z.number().positive(),
});

/**
 * Validates that client-side cart prices match current server prices.
 * Returns which items have stale prices so the cart can update before checkout.
 */
export async function validateCartPrices(
  items: { product_id: string; variant_id: string | null; price: number }[]
): Promise<ActionResult<{
  valid: boolean;
  updates: { product_id: string; variant_id: string | null; newPrice: number }[];
}>> {
  const parsed = z.array(CartValidationItemSchema).safeParse(items);
  if (!parsed.success) {
    return ok({ valid: false, updates: [] });
  }

  try {
    const result = await queryValidateCartPrices(items);
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to validate cart prices");
  }
}
