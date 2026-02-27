import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductFormFields, ProductFormHandlers } from "./types";

type StatusFieldsProps = Pick<ProductFormFields, "isActive" | "isFeatured"> &
  Pick<ProductFormHandlers, "setIsActive" | "setIsFeatured">;

export function StatusFields({
  isActive,
  isFeatured,
  setIsActive,
  setIsFeatured,
}: StatusFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base">Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="isActive">Active (visible in storefront)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="isFeatured"
            checked={isFeatured}
            onCheckedChange={setIsFeatured}
          />
          <Label htmlFor="isFeatured">Featured product</Label>
        </div>
      </CardContent>
    </Card>
  );
}
