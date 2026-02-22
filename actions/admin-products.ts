"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { CURRENCY } from "@/lib/constants";
import { normalizeProduct, normalizeVariant } from "@/lib/normalize";
import { parsePagination } from "@/lib/pagination";
import type { Product, ProductVariant, ProductCategory } from "@/types/database";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";

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
  variant_type: "size" | "color";
  color_hex: string | null;
  swatch_image: string | null;
  variant_images: string[] | null;
  description: string | null;
};

export async function getAdminProducts(options?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; count: number }> {
  await requireAdmin();
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
    console.error("Error fetching admin products:", error.message);
    return { products: [], count: 0 };
  }

  return { products: (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>)), count: count ?? 0 };
}

export async function getAdminProduct(
  id: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
  await requireAdmin();
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
  const supabase = await createClient();

  try {
    await requireAdmin();

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name: formData.name,
      description: formData.short_description,
      images: formData.images.slice(0, 8),
      metadata: { category: formData.category, brand: formData.brand },
    });

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
      return { success: false, error: error.message };
    }

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
        console.error("Error creating variants:", variantError.message);
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/");

    return { success: true, id: product.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateProduct(
  id: string,
  formData: ProductFormData,
  variants: VariantFormData[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    await requireAdmin();

    // Get existing product for Stripe IDs
    const { data: existing } = await supabase
      .from("products")
      .select("stripe_product_id, stripe_price_id")
      .eq("id", id)
      .single();

    const stripeProductId = existing?.stripe_product_id;
    let stripePriceId = existing?.stripe_price_id;

    if (stripeProductId) {
      // Update Stripe product
      await stripe.products.update(stripeProductId, {
        name: formData.name,
        description: formData.short_description,
        images: formData.images.slice(0, 8),
        metadata: { category: formData.category, brand: formData.brand },
      });

      // Create new price if price changed
      const newPrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(formData.price * 100),
        currency: CURRENCY,
      });

      // Deactivate old price
      if (stripePriceId) {
        await stripe.prices.update(stripePriceId, { active: false });
      }

      stripePriceId = newPrice.id;
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
      .select("id")
      .eq("product_id", id);

    const existingIds = existingVariants?.map((v) => v.id) ?? [];
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
        // Update existing variant
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

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    await requireAdmin();

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

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
