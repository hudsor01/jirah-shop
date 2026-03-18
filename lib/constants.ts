import type { ProductCategory } from "@/types/database";

export const SITE_NAME = "Jirah Shop";
export const SITE_DESCRIPTION =
  "Discover premium Asian beauty products. From K-beauty skincare to J-beauty essentials — own-brand formulations and curated picks for every skin type.";

export const CATEGORIES: {
  value: ProductCategory;
  label: string;
  description: string;
  image: string;
}[] = [
  {
    value: "skincare",
    label: "Skincare",
    description: "Cleansers, serums, moisturizers, masks & more",
    image: "/images/categories/skincare.jpg",
  },
  {
    value: "makeup",
    label: "Makeup",
    description: "Foundations, lip tints, eye palettes & more",
    image: "/images/categories/makeup.jpg",
  },
  {
    value: "hair",
    label: "Hair Care",
    description: "Shampoos, treatments, styling & more",
    image: "/images/categories/hair.jpg",
  },
  {
    value: "body",
    label: "Body Care",
    description: "Body lotions, scrubs, bath essentials & more",
    image: "/images/categories/body.jpg",
  },
  {
    value: "tools",
    label: "Beauty Tools",
    description: "Brushes, rollers, gua sha & more",
    image: "/images/categories/tools.jpg",
  },
];

export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const CURRENCY = "usd";
export const SHIPPING_COST = 5.99;
export const FREE_SHIPPING_THRESHOLD = 50;
export const LOW_STOCK_THRESHOLD = 10;
export const ALLOWED_SHIPPING_COUNTRIES = ["US", "CA", "GB", "AU"] as const;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";
