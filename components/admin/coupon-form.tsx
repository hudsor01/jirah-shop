"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createCoupon,
  updateCoupon,
  type CouponFormData,
} from "@/actions/coupons";
import type { Coupon, DiscountType } from "@/types/database";

type CouponFormProps = {
  coupon?: Coupon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CouponForm({ coupon, open, onOpenChange }: CouponFormProps) {
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(
    coupon?.discount_type ?? "percentage"
  );
  const [discountValue, setDiscountValue] = useState(
    coupon?.discount_value?.toString() ?? ""
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    coupon?.min_order_amount?.toString() ?? ""
  );
  const [maxUses, setMaxUses] = useState(
    coupon?.max_uses?.toString() ?? ""
  );
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expires_at
      ? new Date(coupon.expires_at).toISOString().split("T")[0]
      : ""
  );

  function resetForm() {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxUses("");
    setIsActive(true);
    setExpiresAt("");
  }

  function handleSubmit() {
    const formData: CouponFormData = {
      code,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      min_order_amount: minOrderAmount
        ? parseFloat(minOrderAmount)
        : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      is_active: isActive,
      expires_at: expiresAt
        ? new Date(expiresAt).toISOString()
        : null,
    };

    startTransition(async () => {
      if (coupon) {
        const result = await updateCoupon(coupon.id, formData);
        if (result.success) {
          toast.success("Coupon updated successfully");
          onOpenChange(false);
        } else {
          toast.error(result.error ?? "Failed to update coupon");
        }
      } else {
        const result = await createCoupon(formData);
        if (result.success) {
          toast.success("Coupon created successfully");
          resetForm();
          onOpenChange(false);
        } else {
          toast.error(result.error ?? "Failed to create coupon");
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {coupon ? "Edit Coupon" : "Create Coupon"}
          </DialogTitle>
          <DialogDescription>
            {coupon
              ? "Update the coupon details below."
              : "Fill in the details to create a new coupon."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="font-mono uppercase"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as DiscountType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {discountType === "percentage"
                  ? "Discount (%)"
                  : "Discount ($)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "20" : "10.00"}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Min. Order ($)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="couponActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="couponActive">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? "Saving..."
              : coupon
                ? "Update"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
