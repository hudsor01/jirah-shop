import { getAdminBlogPosts } from "@/actions/blog";
import { BlogListClient } from "./blog-list-client";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page } = await searchParams;
  const currentPage = parseInt(page ?? "1");
  const pageSize = 20;

  const { posts, count } = await getAdminBlogPosts({
    search,
    page: currentPage,
    limit: pageSize,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Manage blog posts ({count} total)
        </p>
      </div>

      <BlogListClient
        posts={posts}
        totalCount={count}
        currentPage={currentPage}
        pageSize={pageSize}
        initialSearch={search ?? ""}
      />
    </div>
  );
}
