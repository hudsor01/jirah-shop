import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductFormFields, ProductFormHandlers } from "./types";

type DetailsFieldsProps = Pick<
  ProductFormFields,
  "ingredients" | "howToUse" | "tags"
> &
  Pick<ProductFormHandlers, "setIngredients" | "setHowToUse" | "setTags">;

export function DetailsFields({
  ingredients,
  howToUse,
  tags,
  setIngredients,
  setHowToUse,
  setTags,
}: DetailsFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base">
          Product Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients</Label>
          <Textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Water, Glycerin, Rosa Damascena Extract..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="howToUse">How to Use</Label>
          <Textarea
            id="howToUse"
            value={howToUse}
            onChange={(e) => setHowToUse(e.target.value)}
            placeholder="Apply 2-3 drops to clean skin..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="hydrating, rose, k-beauty, serum"
          />
        </div>
      </CardContent>
    </Card>
  );
}
