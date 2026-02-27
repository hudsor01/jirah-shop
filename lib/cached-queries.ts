import "server-only";
import { cache } from "react";
import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { queryShopSettings } from "@/queries/settings";
import { queryProducts, queryFeaturedProducts, queryProductBySlug } from "@/queries/products";
import { queryBlogPosts, queryBlogPostBySlug } from "@/queries/blog";

// ─── Cached Storefront Queries ────────────────────────────
// These use Next.js 16 "use cache" + cacheTag() for cross-request
// caching. Mutations call revalidateTag() to bust these caches.
//
// IMPORTANT: "use cache" functions cannot call cookies() or other
// dynamic data sources. We use a public client (publishable key, no cookies)
// for public data reads. RLS applies normally — only public data is readable.

export async function cachedGetShopSettings() {
  "use cache";
  cacheTag("shop-settings");
  const client = createPublicClient();
  return queryShopSettings(client);
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
  const client = createPublicClient();
  return queryProducts({ ...options, client });
}

export async function cachedGetFeaturedProducts() {
  "use cache";
  cacheTag("products");
  const client = createPublicClient();
  return queryFeaturedProducts(client);
}

export async function cachedGetBlogPosts(options?: {
  tag?: string;
  limit?: number;
  page?: number;
}) {
  "use cache";
  cacheTag("blog");
  const client = createPublicClient();
  return queryBlogPosts({ ...options, client });
}

// ─── Per-Request Deduplication (React.cache) ─────────────
// React.cache() deduplicates within a single server request.
// When generateMetadata + page component both call the same function,
// only one DB query executes. This is NOT cross-request caching.

export const cachedGetProductBySlug = cache(queryProductBySlug);
export const cachedGetBlogPostBySlug = cache(queryBlogPostBySlug);
