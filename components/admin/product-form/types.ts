import type { ProductCategory } from "@/types/database";

/** Shared form state passed to all product form subcomponents. */
export type ProductFormFields = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  isOwnBrand: boolean;
  images: string[];
  ingredients: string;
  howToUse: string;
  tags: string;
  hasVariants: boolean;
  isFeatured: boolean;
  isActive: boolean;
};

export type ProductFormHandlers = {
  setName: (v: string) => void;
  setSlug: (v: string) => void;
  setShortDescription: (v: string) => void;
  setDescription: (v: string) => void;
  setPrice: (v: string) => void;
  setCompareAtPrice: (v: string) => void;
  setStockQuantity: (v: string) => void;
  setCategory: (v: ProductCategory) => void;
  setSubcategory: (v: string) => void;
  setBrand: (v: string) => void;
  setIsOwnBrand: (v: boolean) => void;
  setImages: (v: string[]) => void;
  setIngredients: (v: string) => void;
  setHowToUse: (v: string) => void;
  setTags: (v: string) => void;
  setHasVariants: (v: boolean) => void;
  setIsFeatured: (v: boolean) => void;
  setIsActive: (v: boolean) => void;
  handleNameChange: (v: string) => void;
};
