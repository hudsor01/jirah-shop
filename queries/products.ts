import { createClient } from "@/lib/supabase/server";
import { normalizeProduct, normalizeVariant } from "@/lib/normalize";
import { sanitizeSearchInput } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";
import type { Product, ProductVariant } from "@/types/database";

// ─── Storefront Queries ──────────────────────────────────

export async function queryProducts(options?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
}): Promise<{ data: Product[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { page, pageSize, from, to } = parsePagination({
    page: options?.page,
    limit: options?.limit ?? 20,
  });

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.search) {
    const s = sanitizeSearchInput(options.search);
    query = query.or(
      `name.ilike.%${s}%,brand.ilike.%${s}%,tags::text.ilike.%${s}%`
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

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function queryProductBySlug(
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

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return {
    product: normalizeProduct(product as Record<string, unknown>),
    variants: (variants ?? []).map((v) => normalizeVariant(v as Record<string, unknown>)),
  };
}

export async function queryFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw error;

  return (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>));
}

export async function queryValidateCartPrices(
  items: { product_id: string; variant_id: string | null; price: number }[]
): Promise<{
  valid: boolean;
  updates: { product_id: string; variant_id: string | null; newPrice: number }[];
}> {
  const supabase = await createClient();

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const variantIds = items
    .map((i) => i.variant_id)
    .filter((id): id is string => !!id);

  const [productsResult, variantsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, price")
      .in("id", productIds),
    variantIds.length
      ? supabase
          .from("product_variants")
          .select("id, price, product_id")
          .in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; price: number; product_id: string }[] }),
  ]);

  const productPriceMap = new Map(
    productsResult.data?.map((p) => [p.id, Number(p.price)]) ?? []
  );
  const variantPriceMap = new Map(
    variantsResult.data?.map((v) => [v.id, Number(v.price)]) ?? []
  );

  const updates: { product_id: string; variant_id: string | null; newPrice: number }[] = [];

  for (const item of items) {
    const serverPrice = item.variant_id
      ? variantPriceMap.get(item.variant_id)
      : productPriceMap.get(item.product_id);

    if (serverPrice !== undefined && Math.round(serverPrice * 100) !== Math.round(item.price * 100)) {
      updates.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        newPrice: serverPrice,
      });
    }
  }

  return { valid: updates.length === 0, updates };
}

// ─── Admin Queries ───────────────────────────────────────

export async function queryAdminProducts(options?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; count: number }> {
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

  if (error) throw error;

  return {
    products: (data ?? []).map((p) => normalizeProduct(p as Record<string, unknown>)),
    count: count ?? 0,
  };
}

export async function queryAdminProduct(
  id: string
): Promise<{ product: Product; variants: ProductVariant[] } | null> {
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
