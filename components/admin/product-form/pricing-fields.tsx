import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductFormFields, ProductFormHandlers } from "./types";

type PricingFieldsProps = Pick<
  ProductFormFields,
  "price" | "compareAtPrice" | "stockQuantity"
> &
  Pick<ProductFormHandlers, "setPrice" | "setCompareAtPrice" | "setStockQuantity">;

export function PricingFields({
  price,
  compareAtPrice,
  stockQuantity,
  setPrice,
  setCompareAtPrice,
  setStockQuantity,
}: PricingFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base">
          Pricing & Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="29.99"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare at Price ($)</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="39.99"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input
              id="stockQuantity"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="100"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
