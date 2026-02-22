"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        variant_type: "size",
        color_hex: null,
        swatch_image: null,
        variant_images: null,
        description: null,
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

          {/* Type + Name + SKU */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={variant.variant_type}
                onValueChange={(value: "size" | "color") =>
                  updateVariant(index, {
                    variant_type: value,
                    // Clear color-specific fields when switching to size
                    ...(value === "size"
                      ? { color_hex: null, swatch_image: null }
                      : {}),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={variant.name}
                onChange={(e) =>
                  updateVariant(index, { name: e.target.value })
                }
                placeholder={
                  variant.variant_type === "size" ? "30ml" : "Rose Gold"
                }
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

          {/* Price + Compare + Stock */}
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

          {/* Color-specific fields */}
          {variant.variant_type === "color" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Color Hex</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={variant.color_hex ?? "#000000"}
                    onChange={(e) =>
                      updateVariant(index, { color_hex: e.target.value })
                    }
                    className="h-9 w-12 shrink-0 cursor-pointer p-1"
                  />
                  <Input
                    value={variant.color_hex ?? ""}
                    onChange={(e) =>
                      updateVariant(index, {
                        color_hex: e.target.value || null,
                      })
                    }
                    placeholder="#FF5A5A"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Swatch Image URL</Label>
                <Input
                  value={variant.swatch_image ?? ""}
                  onChange={(e) =>
                    updateVariant(index, {
                      swatch_image: e.target.value || null,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Variant Images (comma-separated URLs) */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Variant Images (one URL per line, optional)
            </Label>
            <Textarea
              rows={2}
              value={variant.variant_images?.join("\n") ?? ""}
              onChange={(e) => {
                const urls = e.target.value
                  .split("\n")
                  .map((u) => u.trim())
                  .filter(Boolean);
                updateVariant(index, {
                  variant_images: urls.length > 0 ? urls : null,
                });
              }}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              rows={2}
              value={variant.description ?? ""}
              onChange={(e) =>
                updateVariant(index, {
                  description: e.target.value || null,
                })
              }
              placeholder="Additional details about this variant..."
            />
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
