import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { getAdminProducts } from "@/actions/admin-products";
import { ProductsClient } from "./products-client";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  const { search, category, page } = await searchParams;
  const currentPage = parseInt(page ?? "1");
  const pageSize = 20;

  const { products, count } = await getAdminProducts({
    search,
    category,
    page: currentPage,
    limit: pageSize,
  });

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog ({count} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductsClient
        products={products}
        totalCount={count}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        initialSearch={search ?? ""}
        initialCategory={category ?? ""}
      />
    </div>
  );
}
