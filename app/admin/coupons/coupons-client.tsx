"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CouponForm } from "@/components/admin/coupon-form";
import { deleteCoupon } from "@/actions/coupons";
import type { Coupon } from "@/types/database";

type CouponsClientProps = {
  coupons: Coupon[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  initialSearch: string;
};

export function CouponsClient({
  coupons,
  totalCount,
  currentPage,
  pageSize,
  initialSearch,
}: CouponsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | undefined>(
    undefined
  );

  const totalPages = Math.ceil(totalCount / pageSize);

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
    router.push(`/admin/coupons?${newParams.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search });
  }

  function handleEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditingCoupon(undefined);
    setFormOpen(true);
  }

  function handleDelete(id: string, code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return;

    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result.success) {
        toast.success("Coupon deleted");
      } else {
        toast.error(result.error ?? "Failed to delete coupon");
      }
    });
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupons..."
            className="w-64"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Coupon
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min. Order</TableHead>
              <TableHead className="text-right">Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">
                    {coupon.code}
                  </TableCell>
                  <TableCell>
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `$${coupon.discount_value.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {coupon.min_order_amount
                      ? `$${coupon.min_order_amount.toFixed(2)}`
                      : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    {coupon.current_uses}
                    {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {coupon.is_active ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-500 border-gray-200"
                        >
                          Inactive
                        </Badge>
                      )}
                      {isExpired(coupon.expires_at) && (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-600 border-red-200"
                        >
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.expires_at
                      ? new Date(coupon.expires_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          handleDelete(coupon.id, coupon.code)
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

      {/* Coupon form dialog */}
      <CouponForm
        key={editingCoupon?.id ?? "new"}
        coupon={editingCoupon}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
