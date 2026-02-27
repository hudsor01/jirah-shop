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

type BasicInfoFieldsProps = Pick<
  ProductFormFields,
  "name" | "slug" | "shortDescription" | "description"
> &
  Pick<
    ProductFormHandlers,
    "handleNameChange" | "setSlug" | "setShortDescription" | "setDescription"
  >;

export function BasicInfoFields({
  name,
  slug,
  shortDescription,
  description,
  handleNameChange,
  setSlug,
  setShortDescription,
  setDescription,
}: BasicInfoFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-base">
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Hydrating Rose Serum"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="hydrating-rose-serum"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="A brief one-liner about this product"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed product description..."
            className="min-h-32"
          />
        </div>
      </CardContent>
    </Card>
  );
}
