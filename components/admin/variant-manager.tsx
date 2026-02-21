"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { VariantFormData } from "@/actions/admin-products";

type VariantManagerProps = {
  variants: VariantFormData[];
  onChange: (variants: VariantFormData[]) => void;
};

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  function addVariant() {
    onChange([
      ...variants,
      {
        name: "",
        sku: "",
        price: 0,
        compare_at_price: null,
        stock_quantity: 0,
        sort_order: variants.length,
        is_active: true,
      },
    ]);
  }

  function updateVariant(index: number, updates: Partial<VariantFormData>) {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, ...updates } : v
    );
    onChange(updated);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {variants.map((variant, index) => (
        <div
          key={variant.id ?? `new-${index}`}
          className="space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Variant {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => removeVariant(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={variant.name}
                onChange={(e) =>
                  updateVariant(index, { name: e.target.value })
                }
                placeholder="30ml"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SKU</Label>
              <Input
                value={variant.sku}
                onChange={(e) =>
                  updateVariant(index, { sku: e.target.value })
                }
                placeholder="PROD-30ML"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={variant.price}
                onChange={(e) =>
                  updateVariant(index, {
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Compare at ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={variant.compare_at_price ?? ""}
                onChange={(e) =>
                  updateVariant(index, {
                    compare_at_price: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                min="0"
                value={variant.stock_quantity}
                onChange={(e) =>
                  updateVariant(index, {
                    stock_quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={variant.is_active}
              onCheckedChange={(checked) =>
                updateVariant(index, { is_active: checked })
              }
            />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addVariant}>
        <Plus className="mr-2 size-4" />
        Add Variant
      </Button>
    </div>
  );
}
