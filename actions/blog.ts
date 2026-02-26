"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/database";
import { uuidSchema, paginationSchema, formatZodError } from "@/lib/validations";

// ─── Zod Schemas ─────────────────────────────────────────

const BlogQuerySchema = z.object({
  tag: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

const BlogFormDataSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z.string().min(1, "Slug is required").max(300),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(1000),
  cover_image: z.string().url().nullable(),
  tags: z.array(z.string()),
  is_published: z.boolean(),
});

const AdminBlogOptionsSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// ─── Storefront ──────────────────────────────────────────

export async function getBlogPosts(options?: {
  tag?: string;
  limit?: number;
}): Promise<{
  data: BlogPost[];
  error: string | null;
}> {
  const optionsParsed = BlogQuerySchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return { data: [], error: "Invalid query parameters" };
  }

  const supabase = await createClient();

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (options?.tag) {
    query = query.contains("tags", [options.tag]);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as BlogPost[], error: null };
}

export async function getBlogPostBySlug(slug: string): Promise<{
  data: BlogPost | null;
  error: string | null;
}> {
  const slugParsed = z.string().min(1).safeParse(slug);
  if (!slugParsed.success) {
    return { data: null, error: "Invalid slug" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as BlogPost, error: null };
}

// ─── Admin Blog Actions ────────────────────────────────────

import { revalidatePath } from "next/cache";
import { parsePagination } from "@/lib/pagination";
import { requireAdmin, sanitizeSearchInput } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { sanitizeRichHTML } from "@/lib/sanitize";

export type BlogFormData = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  tags: string[];
  is_published: boolean;
};

export async function getAdminBlogPosts(options?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: BlogPost[]; count: number }> {
  await requireAdmin();

  const optionsParsed = AdminBlogOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return { posts: [], count: 0 };
  }

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

  if (error) {
    logger.error("Error fetching blog posts", { error: error.message });
    return { posts: [], count: 0 };
  }

  return { posts: (data as BlogPost[]) ?? [], count: count ?? 0 };
}

export async function getAdminBlogPost(
  id: string
): Promise<BlogPost | null> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return null;
  }

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

export async function createBlogPost(
  formData: BlogFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requireAdmin();

  const formParsed = BlogFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return { success: false, error: formatZodError(formParsed.error) };
  }

  const supabase = await createClient();

  const sanitizedContent = sanitizeRichHTML(formData.content);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      ...formData,
      content: sanitizedContent,
      published_at: formData.is_published ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return { success: true, id: data.id };
}

export async function updateBlogPost(
  id: string,
  formData: BlogFormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid blog post ID" };
  }
  const formParsed = BlogFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return { success: false, error: formatZodError(formParsed.error) };
  }

  const supabase = await createClient();

  // Get existing to check if newly published
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("is_published")
    .eq("id", id)
    .single();

  const publishedAt =
    formData.is_published && !existing?.is_published
      ? new Date().toISOString()
      : undefined;

  const sanitizedContent = sanitizeRichHTML(formData.content);

  const { error } = await supabase
    .from("blog_posts")
    .update({
      ...formData,
      content: sanitizedContent,
      ...(publishedAt ? { published_at: publishedAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}/edit`);
  revalidatePath("/blog");

  return { success: true };
}

export async function deleteBlogPost(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid blog post ID" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return { success: true };
}
