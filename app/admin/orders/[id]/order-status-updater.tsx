"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { updateOrderStatus } from "@/actions/orders";
import type { OrderStatus } from "@/types/database";

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

type OrderStatusUpdaterProps = {
  orderId: string;
  currentStatus: OrderStatus;
};

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: OrderStatusUpdaterProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        status as OrderStatus
      );
      if (result.success) {
        toast.success(`Status updated to ${status}`);
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-sm">Update Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Select
            defaultValue={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPending && (
            <span className="self-center text-sm text-muted-foreground">
              Updating...
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
