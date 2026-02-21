"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createBlogPost,
  updateBlogPost,
  type BlogFormData,
} from "@/actions/blog";
import type { BlogPost } from "@/types/database";

type BlogEditorProps = {
  post?: BlogPost;
};

export function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "");
  const [isPublished, setIsPublished] = useState(
    post?.is_published ?? false
  );

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!post) {
      setSlug(generateSlug(value));
    }
  }

  function handleSubmit() {
    const formData: BlogFormData = {
      title,
      slug,
      content,
      excerpt,
      cover_image: coverImage || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_published: isPublished,
    };

    startTransition(async () => {
      if (post) {
        const result = await updateBlogPost(post.id, formData);
        if (result.success) {
          toast.success("Post updated successfully");
          router.push("/admin/blog");
        } else {
          toast.error(result.error ?? "Failed to update post");
        }
      } else {
        const result = await createBlogPost(formData);
        if (result.success) {
          toast.success("Post created successfully");
          router.push("/admin/blog");
        } else {
          toast.error(result.error ?? "Failed to create post");
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Amazing Blog Post"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-amazing-blog-post"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief summary of this post..."
              className="min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="skincare, beauty tips, k-beauty"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your blog post content here. Markdown is supported..."
            className="min-h-[400px] font-mono text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Rich text editor coming soon. For now, write content as plain text
            or Markdown.
          </p>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Publishing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="isPublished">
              {isPublished ? "Published" : "Draft"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/blog")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? "Saving..."
            : post
              ? "Update Post"
              : "Create Post"}
        </Button>
      </div>
    </div>
  );
}
