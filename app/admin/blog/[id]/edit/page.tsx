import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-editor";
import { getAdminBlogPost } from "@/actions/blog";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getAdminBlogPost(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Edit Post</h1>
        <p className="text-sm text-muted-foreground">
          Update {result.data.title}
        </p>
      </div>

      <BlogEditor post={result.data} />
    </div>
  );
}
