import { BlogEditor } from "@/components/admin/blog-editor";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Create Post</h1>
        <p className="text-sm text-muted-foreground">
          Write a new blog post
        </p>
      </div>

      <BlogEditor />
    </div>
  );
}
