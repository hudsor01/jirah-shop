"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/image-upload";
import { VariantManager } from "@/components/admin/variant-manager";

import {
  createProduct,
  updateProduct,
  type ProductFormData,
  type VariantFormData,
} from "@/actions/admin-products";
import type { Product, ProductVariant, ProductCategory } from "@/types/database";
import { generateSlug } from "@/lib/slug";

import { BasicInfoFields } from "@/components/admin/product-form/basic-info-fields";
import { PricingFields } from "@/components/admin/product-form/pricing-fields";
import { CategoryBrandFields } from "@/components/admin/product-form/category-brand-fields";
import { DetailsFields } from "@/components/admin/product-form/details-fields";
import { StatusFields } from "@/components/admin/product-form/status-fields";

type ProductFormProps = {
  product?: Product;
  variants?: ProductVariant[];
};

export function ProductForm({ product, variants = [] }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Form state ────────────────────────────────────────
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
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
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
      variant_type: v.variant_type,
      color_hex: v.color_hex,
      swatch_image: v.swatch_image,
      variant_images: v.variant_images,
      description: v.description,
    }))
  );

  // ── Handlers ──────────────────────────────────────────
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
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
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

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <BasicInfoFields
        name={name}
        slug={slug}
        shortDescription={shortDescription}
        description={description}
        handleNameChange={handleNameChange}
        setSlug={setSlug}
        setShortDescription={setShortDescription}
        setDescription={setDescription}
      />

      <PricingFields
        price={price}
        compareAtPrice={compareAtPrice}
        stockQuantity={stockQuantity}
        setPrice={setPrice}
        setCompareAtPrice={setCompareAtPrice}
        setStockQuantity={setStockQuantity}
      />

      <CategoryBrandFields
        category={category}
        subcategory={subcategory}
        brand={brand}
        isOwnBrand={isOwnBrand}
        setCategory={setCategory}
        setSubcategory={setSubcategory}
        setBrand={setBrand}
        setIsOwnBrand={setIsOwnBrand}
      />

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload images={images} onChange={setImages} />
        </CardContent>
      </Card>

      <DetailsFields
        ingredients={ingredients}
        howToUse={howToUse}
        tags={tags}
        setIngredients={setIngredients}
        setHowToUse={setHowToUse}
        setTags={setTags}
      />

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

      <StatusFields
        isActive={isActive}
        isFeatured={isFeatured}
        setIsActive={setIsActive}
        setIsFeatured={setIsFeatured}
      />

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
