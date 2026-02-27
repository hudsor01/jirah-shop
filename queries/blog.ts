import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchInput } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";
import type { BlogPost } from "@/types/database";

// ─── Storefront Queries ──────────────────────────────────

export async function queryBlogPosts(options?: {
  tag?: string;
  limit?: number;
  page?: number;
}): Promise<{ data: BlogPost[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { page, pageSize, from, to } = parsePagination({
    page: options?.page,
    limit: options?.limit ?? 20,
  });

  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image, tags, is_published, published_at, created_at, updated_at",
      { count: "exact" }
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (options?.tag) {
    query = query.contains("tags", [options.tag]);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data as BlogPost[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function queryBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return null;
  }

  return data as BlogPost;
}

// ─── Admin Queries ───────────────────────────────────────

export async function queryAdminBlogPosts(options?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: BlogPost[]; count: number }> {
  const supabase = await createClient();
  const { from, to } = parsePagination(options);

  let query = supabase.from("blog_posts").select("*", { count: "exact" });

  if (options?.search) {
    const s = sanitizeSearchInput(options.search);
    query = query.ilike("title", `%${s}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return { posts: (data as BlogPost[]) ?? [], count: count ?? 0 };
}

export async function queryAdminBlogPost(id: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BlogPost;
}
