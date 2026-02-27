import "server-only";
import { cache } from "react";
import { cacheTag } from "next/cache";
import { queryShopSettings } from "@/queries/settings";
import { queryProducts, queryFeaturedProducts, queryProductBySlug } from "@/queries/products";
import { queryBlogPosts, queryBlogPostBySlug } from "@/queries/blog";

// ─── Cached Storefront Queries ────────────────────────────
// These use Next.js 16 "use cache" + cacheTag() for cross-request
// caching. Mutations call revalidateTag() to bust these caches.
// Query functions are pure data access — no ActionResult wrapping.

export async function cachedGetShopSettings() {
  "use cache";
  cacheTag("shop-settings");
  return queryShopSettings();
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
  return queryProducts(options);
}

export async function cachedGetFeaturedProducts() {
  "use cache";
  cacheTag("products");
  return queryFeaturedProducts();
}

export async function cachedGetBlogPosts(options?: {
  tag?: string;
  limit?: number;
  page?: number;
}) {
  "use cache";
  cacheTag("blog");
  return queryBlogPosts(options);
}

// ─── Per-Request Deduplication (React.cache) ─────────────
// React.cache() deduplicates within a single server request.
// When generateMetadata + page component both call the same function,
// only one DB query executes. This is NOT cross-request caching.

export const cachedGetProductBySlug = cache(queryProductBySlug);
export const cachedGetBlogPostBySlug = cache(queryBlogPostBySlug);
