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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATEGORIES } from "@/lib/constants";
import type { ProductCategory } from "@/types/database";
import type { ProductFormFields, ProductFormHandlers } from "./types";

type CategoryBrandFieldsProps = Pick<
  ProductFormFields,
  "category" | "subcategory" | "brand" | "isOwnBrand"
> &
  Pick<
    ProductFormHandlers,
    "setCategory" | "setSubcategory" | "setBrand" | "setIsOwnBrand"
  >;

export function CategoryBrandFields({
  category,
  subcategory,
  brand,
  isOwnBrand,
  setCategory,
  setSubcategory,
  setBrand,
  setIsOwnBrand,
}: CategoryBrandFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base">
          Category & Brand
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ProductCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="Serums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Jirah Beauty"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="isOwnBrand"
            checked={isOwnBrand}
            onCheckedChange={setIsOwnBrand}
          />
          <Label htmlFor="isOwnBrand">Own brand product</Label>
        </div>
      </CardContent>
    </Card>
  );
}
