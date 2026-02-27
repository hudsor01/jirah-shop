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
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&fit=crop&auto=format",
  },
  {
    value: "makeup",
    label: "Makeup",
    description: "Foundations, lip tints, eye palettes & more",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80&fit=crop&auto=format",
  },
  {
    value: "hair",
    label: "Hair Care",
    description: "Shampoos, treatments, styling & more",
    image:
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80&fit=crop&auto=format",
  },
  {
    value: "body",
    label: "Body Care",
    description: "Body lotions, scrubs, bath essentials & more",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80&fit=crop&auto=format",
  },
  {
    value: "tools",
    label: "Beauty Tools",
    description: "Brushes, rollers, gua sha & more",
    image:
      "https://images.unsplash.com/photo-1522338242992-e1a54f0e2ed4?w=800&q=80&fit=crop&auto=format",
  },
];

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const CURRENCY = "usd";
export const SHIPPING_COST = 5.99;
export const FREE_SHIPPING_THRESHOLD = 50;
export const LOW_STOCK_THRESHOLD = 10;
export const ALLOWED_SHIPPING_COUNTRIES = ["US", "CA", "GB", "AU"] as const;
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL environment variable");
}
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
