"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteProduct } from "@/actions/admin-products";
import { CATEGORIES } from "@/lib/constants";
import type { Product } from "@/types/database";

type ProductsClientProps = {
  products: Product[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  initialSearch: string;
  initialCategory: string;
};

export function ProductsClient({
  products,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  initialSearch,
  initialCategory,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  function applyFilters(params: Record<string, string>) {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    if (!params.page) {
      newParams.delete("page");
    }
    router.push(`/admin/products?${newParams.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return;

    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success("Product deactivated");
      } else {
        toast.error(result.error ?? "Failed to delete product");
      }
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-64"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Select
          value={initialCategory || "all"}
          onValueChange={(v) =>
            applyFilters({ category: v === "all" ? "" : v })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="size-10 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell className="text-right">
                    ${product.price.toFixed(2)}
                    {product.compare_at_price && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        ${product.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.stock_quantity < LOW_STOCK_THRESHOLD
                          ? "text-destructive font-medium"
                          : ""
                      }
                    >
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                      >
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          handleDelete(product.id, product.name)
                        }
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                applyFilters({ page: String(currentPage - 1) })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                applyFilters({ page: String(currentPage + 1) })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
