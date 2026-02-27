import type { Metadata } from "next";
import { getBlogPosts } from "@/actions/blog";
import { BlogCard } from "./blog-card";
import { PaginationControls } from "@/components/storefront/pagination-controls";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, tutorials, and ingredient guides for your beauty journey. Explore the Jirah Shop beauty journal.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const tag = typeof params.tag === "string" ? params.tag : undefined;

  const { data: posts, total, page: currentPage, pageSize, error } =
    await getBlogPosts({ page, tag });

  const totalPages = Math.ceil(total / pageSize);

  const paginationParams: Record<string, string> = {};
  if (tag) paginationParams.tag = tag;

  return (
    <section className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center sm:mb-16">
          <p className="text-primary text-sm font-medium uppercase tracking-widest">Beauty Journal</p>
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            Plan Your Beauty Journey
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-lg text-muted-foreground">
            Tips, tutorials, and ingredient guides for your skin, hair, and body
          </p>
        </div>

        {/* Posts Grid */}
        {error ? (
          <p className="mt-12 text-center text-muted-foreground">
            Unable to load posts at this time. Please try again later.
          </p>
        ) : posts.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            No posts yet. Check back soon!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div key={post.id} className="last:max-lg:col-span-full">
                  <BlogCard
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    coverImage={post.cover_image}
                    tags={post.tags}
                    publishedAt={post.published_at}
                  />
                </div>
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/blog"
              searchParams={paginationParams}
            />
          </>
        )}
      </div>
    </section>
  );
}
