import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cachedGetProductBySlug } from "@/lib/cached-queries";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/lib/constants";
import { ProductDisplay } from "./product-display";
import { sanitizeRichHTML } from "@/lib/sanitize";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await cachedGetProductBySlug(slug);

  if (!result) {
    return { title: "Product Not Found" };
  }

  const { product } = result;

  return {
    title: product.name,
    description:
      product.short_description || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sku?: string }>;
}) {
  const [{ slug }, { sku }] = await Promise.all([params, searchParams]);
  const result = await cachedGetProductBySlug(slug);

  if (!result) {
    notFound();
  }

  const { product, variants } = result;

  const categoryInfo = CATEGORIES.find((c) => c.value === product.category);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/shop">Shop</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/shop/${product.category}`}>
                {categoryInfo?.label ?? product.category}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Main Section — client component owns variant state */}
      <Suspense fallback={null}>
        <ProductDisplay
          product={product}
          variants={variants}
          initialSku={sku ?? null}
        />
      </Suspense>

      {/* Below Fold: Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="how-to-use">How to Use</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            {/* Admin-authored HTML content — not user-generated input */}
            <div
              className="prose prose-sm max-w-none leading-relaxed text-muted-foreground [&_h2]:font-serif [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-foreground [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHTML(product.description) }}
            />
          </TabsContent>

          <TabsContent value="ingredients" className="mt-6">
            {product.ingredients ? (
              <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.ingredients}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ingredient information is not yet available for this product.
              </p>
            )}
          </TabsContent>

          <TabsContent value="how-to-use" className="mt-6">
            {product.how_to_use ? (
              <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.how_to_use}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Usage instructions are not yet available for this product.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
