import type { Metadata } from "next";
import { getBlogPosts } from "@/actions/blog";
import { BlogCard } from "./blog-card";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, tutorials, and ingredient guides for your beauty journey. Explore the Jirah Shop beauty journal.",
};

export default async function BlogPage() {
  const { data: posts, error } = await getBlogPosts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
          Beauty Journal
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Tips, tutorials, and ingredient guides for your beauty journey
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
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              coverImage={post.cover_image}
              tags={post.tags}
              publishedAt={post.published_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
