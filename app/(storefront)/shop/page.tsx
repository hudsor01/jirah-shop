import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/actions/products";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SearchBar } from "@/components/storefront/search-bar";
import { PaginationControls } from "@/components/storefront/pagination-controls";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop All",
  description:
    "Explore our curated collection of premium Asian beauty products. K-beauty skincare, J-beauty essentials, makeup, hair care, and beauty tools.",
};

type SortOption = {
  value: string;
  label: string;
};

const sortOptions: SortOption[] = [
  { value: "", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "best-sellers", label: "Best Sellers" },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;

  const { data: products, total, page: currentPage, pageSize } = await getProducts({
    category,
    search,
    sort,
    page,
  });

  const totalPages = Math.ceil(total / pageSize);

  // Build searchParams record for pagination links (preserve category/search/sort)
  const paginationParams: Record<string, string> = {};
  if (category) paginationParams.category = category;
  if (search) paginationParams.search = search;
  if (sort) paginationParams.sort = sort;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Shop
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover premium Asian beauty, curated for you.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !category
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.value;
          const href = `/shop?category=${cat.value}${search ? `&search=${search}` : ""}${sort ? `&sort=${sort}` : ""}`;

          return (
            <Link
              key={cat.value}
              href={href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar />

        {/* Sort Dropdown (native select for server component compatibility) */}
        <SortSelect currentSort={sort} searchParams={params} />
      </div>

      {/* Results Count */}
      <p className="mb-6 text-sm text-muted-foreground">
        {total} {total === 1 ? "product" : "products"} found
        {search && (
          <>
            {" "}
            for &ldquo;<span className="font-medium text-foreground">{search}</span>&rdquo;
          </>
        )}
        {category && (
          <>
            {" "}
            in{" "}
            <span className="font-medium text-foreground">
              {CATEGORIES.find((c) => c.value === category)?.label ?? category}
            </span>
          </>
        )}
      </p>

      {/* Product Grid */}
      <ProductGrid products={products} />

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/shop"
        searchParams={paginationParams}
      />
    </div>
  );
}

function SortSelect({
  currentSort,
  searchParams,
}: {
  currentSort?: string;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Build base URL preserving other params
  const baseParams = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (key !== "sort" && typeof val === "string") {
      baseParams.set(key, val);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
      <div className="flex flex-wrap gap-1.5">
        {sortOptions.map((option) => {
          const isActive = (currentSort ?? "") === option.value;
          const params = new URLSearchParams(baseParams);
          if (option.value) {
            params.set("sort", option.value);
          }
          const href = `/shop?${params.toString()}`;

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
