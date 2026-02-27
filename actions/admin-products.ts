"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath, updateTag } from "next/cache";
import { CURRENCY } from "@/lib/constants";
import { normalizeProduct, normalizeVariant } from "@/lib/normalize";
import { parsePagination } from "@/lib/pagination";
import type { Product, ProductVariant, ProductCategory, VariantType } from "@/types/database";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { uuidSchema, paginationSchema, formatZodError } from "@/lib/validations";

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  category: ProductCategory;
  subcategory: string | null;
  brand: string;
  is_own_brand: boolean;
  images: string[];
  ingredients: string | null;
  how_to_use: string | null;
  tags: string[];
  stock_quantity: number;
  has_variants: boolean;
  is_featured: boolean;
  is_active: boolean;
};

export type VariantFormData = {
  id?: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sort_order: number;
  is_active: boolean;
  variant_type: VariantType;
  color_hex: string | null;
  swatch_image: string | null;
  variant_images: string[] | null;
  description: string | null;
};

// ─── Zod Schemas ────────────────────────────────────────

const ProductFormDataSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  description: z.string(),
  short_description: z.string().max(500),
  price: z.number().positive("Price must be positive"),
  compare_at_price: z.number().positive().nullable(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().nullable(),
  brand: z.string().min(1, "Brand is required"),
  is_own_brand: z.boolean(),
  images: z.array(z.string().url()).max(8, "Maximum 8 images"),
  ingredients: z.string().nullable(),
  how_to_use: z.string().nullable(),
  tags: z.array(z.string()),
  stock_quantity: z.number().int().min(0, "Stock cannot be negative"),
  has_variants: z.boolean(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

const VariantFormDataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().positive("Price must be positive"),
  compare_at_price: z.number().positive().nullable(),
  stock_quantity: z.number().int().min(0, "Stock cannot be negative"),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  variant_type: z.string().min(1),
  color_hex: z.string().nullable(),
  swatch_image: z.string().nullable(),
  variant_images: z.array(z.string()).nullable(),
  description: z.string().nullable(),
});

const AdminProductsOptionsSchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
});

// ─── Actions ────────────────────────────────────────────

export async function getAdminProducts(options?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; count: number }> {
  await requireAdmin();

  const optionsParsed = AdminProductsOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return { products: [], count: 0 };
  }

  const supabase = await createClient();
  const { from, to } = parsePagination(options);

  let query = supabase.from("products").select("*", { count: "exact" });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.search) {
    const s = sanitizeSearchInput(options.search);
    query = query.or(
      `name.ilike.%${s}%,brand.ilike.%${s}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Error fetching admin products", { error: error.message });
    return { products: [], count: 0 };
  }

  return { products: (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>)), count: count ?? 0 };
}

export async function getAdminProduct(
  id: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return null;
  }

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return null;
  }

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  return {
    product: normalizeProduct(product as Record<string, unknown>),
    variants: (variants ?? []).map((v) => normalizeVariant(v as Record<string, unknown>)),
  };
}

export async function createProduct(
  formData: ProductFormData,
  variants: VariantFormData[]
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requireAdmin();

  const formParsed = ProductFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return { success: false, error: formatZodError(formParsed.error) };
  }
  const variantsParsed = z.array(VariantFormDataSchema).safeParse(variants);
  if (!variantsParsed.success) {
    return { success: false, error: formatZodError(variantsParsed.error) };
  }

  const supabase = await createClient();

  // Track created resources for rollback cleanup
  let stripeProductId: string | null = null;
  let dbProductId: string | null = null;

  try {

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name: formData.name,
      description: formData.short_description,
      images: formData.images.slice(0, 8),
      metadata: { category: formData.category, brand: formData.brand },
    });
    stripeProductId = stripeProduct.id;

    // Create Stripe price
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(formData.price * 100),
      currency: CURRENCY,
    });

    // Insert product in DB
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        ...formData,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    dbProductId = product.id;

    // Insert variants
    if (variants.length > 0 && product) {
      const variantInserts = await Promise.all(
        variants.map(async (v) => {
          const variantStripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(v.price * 100),
            currency: CURRENCY,
            metadata: { variant_name: v.name },
          });

          return {
            product_id: product.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            compare_at_price: v.compare_at_price,
            stock_quantity: v.stock_quantity,
            sort_order: v.sort_order,
            is_active: v.is_active,
            stripe_price_id: variantStripePrice.id,
            variant_type: v.variant_type,
            color_hex: v.color_hex,
            swatch_image: v.swatch_image,
            variant_images: v.variant_images,
            description: v.description,
          };
        })
      );

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantInserts);

      if (variantError) {
        throw new Error(`Variant creation failed: ${variantError.message}`);
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    updateTag("products");

    return { success: true, id: product.id };
  } catch (err) {
    // Cleanup in reverse order of creation
    if (dbProductId) {
      const { error: cleanupDbError } = await supabase
        .from("products")
        .delete()
        .eq("id", dbProductId);
      logger.error("createProduct rollback: deleted Supabase product", {
        dbProductId,
        cleanupSuccess: !cleanupDbError,
      });
    }
    if (stripeProductId) {
      try {
        await stripe.products.update(stripeProductId, { active: false });
        logger.error("createProduct rollback: archived Stripe product", {
          stripeProductId,
        });
      } catch (stripeCleanupErr) {
        logger.error("createProduct rollback: failed to archive Stripe product", {
          stripeProductId,
          error: stripeCleanupErr instanceof Error ? stripeCleanupErr.message : "Unknown",
        });
      }
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateProduct(
  id: string,
  formData: ProductFormData,
  variants: VariantFormData[]
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid product ID" };
  }
  const formParsed = ProductFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return { success: false, error: formatZodError(formParsed.error) };
  }
  const variantsParsed = z.array(VariantFormDataSchema).safeParse(variants);
  if (!variantsParsed.success) {
    return { success: false, error: formatZodError(variantsParsed.error) };
  }

  const supabase = await createClient();

  try {

    // Get existing product for Stripe IDs and current price
    const { data: existing } = await supabase
      .from("products")
      .select("stripe_product_id, stripe_price_id, price")
      .eq("id", id)
      .single();

    const stripeProductId = existing?.stripe_product_id;
    let stripePriceId = existing?.stripe_price_id;
    const existingPrice = Number(existing?.price ?? 0);

    if (stripeProductId) {
      // Update Stripe product metadata
      await stripe.products.update(stripeProductId, {
        name: formData.name,
        description: formData.short_description,
        images: formData.images.slice(0, 8),
        metadata: { category: formData.category, brand: formData.brand },
      });

      // Only create a new Stripe price if the price actually changed
      if (Math.round(formData.price * 100) !== Math.round(existingPrice * 100)) {
        const newPrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(formData.price * 100),
          currency: CURRENCY,
        });

        if (stripePriceId) {
          await stripe.prices.update(stripePriceId, { active: false });
        }

        stripePriceId = newPrice.id;
      }
    }

    // Update product in DB
    const { error } = await supabase
      .from("products")
      .update({
        ...formData,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Handle variants: delete removed, update existing, insert new
    const { data: existingVariants } = await supabase
      .from("product_variants")
      .select("id, price, stripe_price_id")
      .eq("product_id", id);

    const existingVariantMap = new Map(
      (existingVariants ?? []).map((v) => [
        v.id as string,
        { price: Number(v.price ?? 0), stripePriceId: v.stripe_price_id as string | null },
      ])
    );
    const existingIds = [...existingVariantMap.keys()];
    const incomingIds = variants.filter((v) => v.id).map((v) => v.id!);
    const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));

    if (toDelete.length > 0) {
      await supabase
        .from("product_variants")
        .delete()
        .in("id", toDelete);
    }

    for (const v of variants) {
      if (v.id) {
        // Update existing variant — only create a new Stripe price if price changed
        const prev = existingVariantMap.get(v.id);
        let variantStripePriceId = prev?.stripePriceId ?? null;

        if (
          stripeProductId &&
          Math.round(v.price * 100) !== Math.round((prev?.price ?? 0) * 100)
        ) {
          const variantPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: Math.round(v.price * 100),
            currency: CURRENCY,
            metadata: { variant_name: v.name },
          });

          // Deactivate old variant price
          if (prev?.stripePriceId) {
            await stripe.prices.update(prev.stripePriceId, { active: false });
          }

          variantStripePriceId = variantPrice.id;
        }

        await supabase
          .from("product_variants")
          .update({
            name: v.name,
            sku: v.sku,
            price: v.price,
            compare_at_price: v.compare_at_price,
            stock_quantity: v.stock_quantity,
            sort_order: v.sort_order,
            is_active: v.is_active,
            stripe_price_id: variantStripePriceId,
            variant_type: v.variant_type,
            color_hex: v.color_hex,
            swatch_image: v.swatch_image,
            variant_images: v.variant_images,
            description: v.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", v.id);
      } else {
        // Insert new variant
        let variantStripePriceId: string | null = null;
        if (stripeProductId) {
          const variantPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: Math.round(v.price * 100),
            currency: CURRENCY,
            metadata: { variant_name: v.name },
          });
          variantStripePriceId = variantPrice.id;
        }

        await supabase.from("product_variants").insert({
          product_id: id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          compare_at_price: v.compare_at_price,
          stock_quantity: v.stock_quantity,
          sort_order: v.sort_order,
          is_active: v.is_active,
          stripe_price_id: variantStripePriceId,
          variant_type: v.variant_type,
          color_hex: v.color_hex,
          swatch_image: v.swatch_image,
          variant_images: v.variant_images,
          description: v.description,
        });
      }
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath("/");
    updateTag("products");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid product ID" };
  }

  const supabase = await createClient();

  try {

    const { data: product } = await supabase
      .from("products")
      .select("stripe_product_id")
      .eq("id", id)
      .single();

    // Archive in Stripe
    if (product?.stripe_product_id) {
      await stripe.products.update(product.stripe_product_id, {
        active: false,
      });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    updateTag("products");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
