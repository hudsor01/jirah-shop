"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/database";
import { uuidSchema, paginationSchema, formatZodError } from "@/lib/validations";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import {
  queryBlogPosts,
  queryBlogPostBySlug,
  queryAdminBlogPosts,
  queryAdminBlogPost,
} from "@/queries/blog";

// ─── Zod Schemas ─────────────────────────────────────────

const BlogQuerySchema = z.object({
  tag: z.string().optional(),
  limit: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
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
  page?: number;
}): Promise<ActionResult<{
  data: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}>> {
  const optionsParsed = BlogQuerySchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return fail("Invalid query parameters");
  }

  try {
    const result = await queryBlogPosts(options);
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch blog posts");
  }
}

export async function getBlogPostBySlug(slug: string): Promise<ActionResult<BlogPost | null>> {
  const slugParsed = z.string().min(1).safeParse(slug);
  if (!slugParsed.success) {
    return fail("Invalid slug");
  }

  try {
    const result = await queryBlogPostBySlug(slug);
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch blog post");
  }
}

// ─── Admin Blog Actions ────────────────────────────────────

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
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
}): Promise<ActionResult<{ posts: BlogPost[]; count: number }>> {
  await requireAdmin();

  const optionsParsed = AdminBlogOptionsSchema.safeParse(options ?? {});
  if (!optionsParsed.success) {
    return ok({ posts: [], count: 0 });
  }

  try {
    const result = await queryAdminBlogPosts(options);
    return ok(result);
  } catch (e) {
    logger.error("Error fetching blog posts", { error: e instanceof Error ? e.message : "Unknown" });
    return fail(e instanceof Error ? e.message : "Failed to fetch blog posts");
  }
}

export async function getAdminBlogPost(
  id: string
): Promise<ActionResult<BlogPost | null>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return ok(null);
  }

  try {
    const result = await queryAdminBlogPost(id);
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch blog post");
  }
}

export async function createBlogPost(
  formData: BlogFormData
): Promise<ActionResult<string>> {
  await requireAdmin();

  const formParsed = BlogFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return fail(formatZodError(formParsed.error));
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
    return fail(error.message);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  updateTag("blog");

  return ok(data.id);
}

export async function updateBlogPost(
  id: string,
  formData: BlogFormData
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid blog post ID");
  }
  const formParsed = BlogFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return fail(formatZodError(formParsed.error));
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
    return fail(error.message);
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}/edit`);
  revalidatePath("/blog");
  updateTag("blog");

  return ok(undefined);
}

export async function deleteBlogPost(
  id: string
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid blog post ID");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  updateTag("blog");

  return ok(undefined);
}
