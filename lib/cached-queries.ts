import "server-only";
import { cache } from "react";
import { cacheTag } from "next/cache";
import { getShopSettings } from "@/actions/settings";
import { getProducts, getFeaturedProducts, getProductBySlug } from "@/actions/products";
import { getBlogPosts, getBlogPostBySlug } from "@/actions/blog";

// ─── Helpers ──────────────────────────────────────────────
// Unwraps ActionResult, throwing on failure so storefront pages
// get raw data and errors propagate to the nearest error boundary.

function unwrap<T>(result: { success: true; data: T } | { success: false; error: string }): T {
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// ─── Cached Storefront Queries ────────────────────────────
// These use Next.js 16 "use cache" + cacheTag() for cross-request
// caching. Mutations call revalidateTag() to bust these caches.

export async function cachedGetShopSettings() {
  "use cache";
  cacheTag("shop-settings");
  // getShopSettings returns raw ShopSettings (not ActionResult) — no unwrap needed
  return getShopSettings();
}

export async function cachedGetProducts(options?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
}) {
  "use cache";
  cacheTag("products");
  return unwrap(await getProducts(options));
}

export async function cachedGetFeaturedProducts() {
  "use cache";
  cacheTag("products");
  return unwrap(await getFeaturedProducts());
}

export async function cachedGetBlogPosts(options?: {
  tag?: string;
  limit?: number;
  page?: number;
}) {
  "use cache";
  cacheTag("blog");
  return unwrap(await getBlogPosts(options));
}

// ─── Per-Request Deduplication (React.cache) ─────────────
// React.cache() deduplicates within a single server request.
// When generateMetadata + page component both call the same function,
// only one DB query executes. This is NOT cross-request caching.

async function unwrapProductBySlug(slug: string) {
  return unwrap(await getProductBySlug(slug));
}

async function unwrapBlogPostBySlug(slug: string) {
  return unwrap(await getBlogPostBySlug(slug));
}

export const cachedGetProductBySlug = cache(unwrapProductBySlug);
export const cachedGetBlogPostBySlug = cache(unwrapBlogPostBySlug);
