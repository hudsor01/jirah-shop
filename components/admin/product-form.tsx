"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/image-upload";
import { VariantManager } from "@/components/admin/variant-manager";

import { CATEGORIES } from "@/lib/constants";
import {
  createProduct,
  updateProduct,
  type ProductFormData,
  type VariantFormData,
} from "@/actions/admin-products";
import type { Product, ProductVariant, ProductCategory } from "@/types/database";

type ProductFormProps = {
  product?: Product;
  variants?: ProductVariant[];
};

export function ProductForm({ product, variants = [] }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(
    product?.short_description ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compare_at_price?.toString() ?? ""
  );
  const [category, setCategory] = useState<ProductCategory>(
    product?.category ?? "skincare"
  );
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [isOwnBrand, setIsOwnBrand] = useState(product?.is_own_brand ?? false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [ingredients, setIngredients] = useState(product?.ingredients ?? "");
  const [howToUse, setHowToUse] = useState(product?.how_to_use ?? "");
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "");
  const [stockQuantity, setStockQuantity] = useState(
    product?.stock_quantity?.toString() ?? "0"
  );
  const [hasVariants, setHasVariants] = useState(
    product?.has_variants ?? false
  );
  const [isFeatured, setIsFeatured] = useState(
    product?.is_featured ?? false
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [variantList, setVariantList] = useState<VariantFormData[]>(
    variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      compare_at_price: v.compare_at_price,
      stock_quantity: v.stock_quantity,
      sort_order: v.sort_order,
      is_active: v.is_active,
    }))
  );

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!product) {
      setSlug(generateSlug(value));
    }
  }

  function handleSubmit() {
    const formData: ProductFormData = {
      name,
      slug,
      description,
      short_description: shortDescription,
      price: parseFloat(price) || 0,
      compare_at_price: compareAtPrice
        ? parseFloat(compareAtPrice)
        : null,
      category,
      subcategory: subcategory || null,
      brand,
      is_own_brand: isOwnBrand,
      images,
      ingredients: ingredients || null,
      how_to_use: howToUse || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      stock_quantity: parseInt(stockQuantity) || 0,
      has_variants: hasVariants,
      is_featured: isFeatured,
      is_active: isActive,
    };

    startTransition(async () => {
      if (product) {
        const result = await updateProduct(
          product.id,
          formData,
          hasVariants ? variantList : []
        );
        if (result.success) {
          toast.success("Product updated successfully");
          router.push("/admin/products");
        } else {
          toast.error(result.error ?? "Failed to update product");
        }
      } else {
        const result = await createProduct(
          formData,
          hasVariants ? variantList : []
        );
        if (result.success) {
          toast.success("Product created successfully");
          router.push("/admin/products");
        } else {
          toast.error(result.error ?? "Failed to create product");
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
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

      {/* Pricing & Inventory */}
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

      {/* Category & Brand */}
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

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload images={images} onChange={setImages} />
        </CardContent>
      </Card>

      {/* Details */}
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

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="hasVariants"
              checked={hasVariants}
              onCheckedChange={setHasVariants}
            />
            <Label htmlFor="hasVariants">
              This product has variants (sizes, shades, etc.)
            </Label>
          </div>

          {hasVariants && (
            <>
              <Separator />
              <VariantManager
                variants={variantList}
                onChange={setVariantList}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Status */}
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

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/products")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? "Saving..."
            : product
              ? "Update Product"
              : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
