import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/lib/constants";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/format";
import { ProductActions } from "./product-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result) {
    return { title: "Product Not Found" };
  }

  const { product } = result;

  return {
    title: product.name,
    description: product.short_description || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result) {
    notFound();
  }

  const { product, variants } = result;

  const categoryInfo = CATEGORIES.find((c) => c.value === product.category);
  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

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

      {/* Product Main Section */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: Image Gallery */}
        <ImageGallery product={product} />

        {/* Right: Product Details */}
        <div className="flex flex-col">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-2">
            {product.is_own_brand ? (
              <Badge className="rounded-md bg-primary/90 text-primary-foreground text-xs">
                By Jirah
              </Badge>
            ) : (
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {product.brand}
              </p>
            )}
          </div>

          {/* Product Name */}
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Star Rating Placeholder */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex text-primary" aria-label="Rating: 4.5 out of 5">
              {[1, 2, 3, 4].map((star) => (
                <svg
                  key={star}
                  className="size-4 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <svg className="size-4" viewBox="0 0 20 20">
                <defs>
                  <linearGradient id="half-star">
                    <stop offset="50%" className="[stop-color:currentColor]" />
                    <stop offset="50%" className="[stop-color:transparent]" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#half-star)"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">4.5 (Reviews coming soon)</span>
          </div>

          <Separator className="my-5" />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price!)}
                </span>
                <Badge variant="destructive" className="rounded-md text-xs">
                  Save {discountPercent}%
                </Badge>
              </>
            )}
          </div>

          {/* Short Description */}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {product.short_description}
          </p>

          <Separator className="my-5" />

          {/* Add to Cart Actions (client component) */}
          <ProductActions product={product} variants={variants} />

          <Separator className="my-5" />

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-md px-2.5 py-0.5 text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Below Fold: Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="how-to-use">How to Use</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div
              className="prose prose-sm max-w-none text-muted-foreground leading-relaxed [&_h2]:font-serif [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-foreground [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </TabsContent>

          <TabsContent value="ingredients" className="mt-6">
            {product.ingredients ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
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
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
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

function ImageGallery({ product }: { product: Product }) {
  const images = product.images ?? [];
  const mainImage = images[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/30">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br/oklch from-primary/10 via-secondary/20 to-accent/10">
            <span className="font-serif text-6xl font-semibold text-muted-foreground/20">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Row */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative size-20 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-secondary/30 transition-colors hover:border-primary cursor-pointer"
            >
              <Image
                src={image}
                alt={`${product.name} - Image ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Placeholder thumbnails if only one or no images */}
      {images.length <= 1 && (
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="size-20 shrink-0 rounded-lg bg-secondary/30 border border-border/50"
            />
          ))}
        </div>
      )}
    </div>
  );
}
