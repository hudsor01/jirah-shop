import "server-only";
import { cache } from "react";
import { cacheTag } from "next/cache";
import { getShopSettings } from "@/actions/settings";
import { getProducts, getFeaturedProducts, getProductBySlug } from "@/actions/products";
import { getBlogPosts, getBlogPostBySlug } from "@/actions/blog";

// ─── Cached Storefront Queries ────────────────────────────
// These use Next.js 16 "use cache" + cacheTag() for cross-request
// caching. Mutations call revalidateTag() to bust these caches.

export async function cachedGetShopSettings() {
  "use cache";
  cacheTag("shop-settings");
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
  return getProducts(options);
}

export async function cachedGetFeaturedProducts() {
  "use cache";
  cacheTag("products");
  return getFeaturedProducts();
}

export async function cachedGetBlogPosts(options?: {
  tag?: string;
  limit?: number;
  page?: number;
}) {
  "use cache";
  cacheTag("blog");
  return getBlogPosts(options);
}

// ─── Per-Request Deduplication (React.cache) ─────────────
// React.cache() deduplicates within a single server request.
// When generateMetadata + page component both call the same function,
// only one DB query executes. This is NOT cross-request caching.

export const cachedGetProductBySlug = cache(getProductBySlug);
export const cachedGetBlogPostBySlug = cache(getBlogPostBySlug);
