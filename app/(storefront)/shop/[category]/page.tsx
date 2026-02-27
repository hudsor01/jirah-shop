import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts } from "@/actions/products";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SearchBar } from "@/components/storefront/search-bar";
import { PaginationControls } from "@/components/storefront/pagination-controls";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function findCategory(slug: string) {
  return CATEGORIES.find((c) => c.value === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = findCategory(category);

  if (!cat) {
    return { title: "Category Not Found" };
  }

  return {
    title: cat.label,
    description: `Shop ${cat.label.toLowerCase()} products at Jirah Shop. ${cat.description}`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;
  const pageParam = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;

  const cat = findCategory(category);
  if (!cat) {
    notFound();
  }

  const { data: products, total, page: currentPage, pageSize } = await getProducts({
    category: cat.value,
    sort,
    search,
    page: pageParam,
  });

  const totalPages = Math.ceil(total / pageSize);

  const paginationParams: Record<string, string> = {};
  if (sort) paginationParams.sort = sort;
  if (search) paginationParams.search = search;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Category Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{cat.label}</span>
        </nav>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {cat.label}
        </h1>
        <p className="mt-2 text-muted-foreground">{cat.description}</p>
      </div>

      {/* Category Navigation Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          All
        </Link>
        {CATEGORIES.map((c) => {
          const isActive = c.value === category;
          return (
            <Link
              key={c.value}
              href={`/shop/${c.value}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar />

        <SortLinks currentSort={sort} category={category} search={search} />
      </div>

      {/* Results Count */}
      <p className="mb-6 text-sm text-muted-foreground">
        {total} {total === 1 ? "product" : "products"}
        {search && (
          <>
            {" "}
            for &ldquo;<span className="font-medium text-foreground">{search}</span>&rdquo;
          </>
        )}
      </p>

      {/* Product Grid */}
      <ProductGrid products={products} />

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/shop/${category}`}
        searchParams={paginationParams}
      />
    </div>
  );
}

const sortOptions = [
  { value: "", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "best-sellers", label: "Best Sellers" },
];

function SortLinks({
  currentSort,
  category,
  search,
}: {
  currentSort?: string;
  category: string;
  search?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
      <div className="flex flex-wrap gap-1.5">
        {sortOptions.map((option) => {
          const isActive = (currentSort ?? "") === option.value;
          const params = new URLSearchParams();
          if (option.value) params.set("sort", option.value);
          if (search) params.set("search", search);
          const query = params.toString();
          const href = `/shop/${category}${query ? `?${query}` : ""}`;

          return (
            <Link
              key={option.value}
              href={href}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
