// ─── Product ────────────────────────────────────────────
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  category: ProductCategory;
  subcategory: string | null;
  brand: string;
  is_own_brand: boolean;
  images: string[];
  ingredients: string | null;
  how_to_use: string | null;
  tags: string[];
  stock_quantity: number;
  has_variants: boolean;
  is_featured: boolean;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductCategory =
  | "skincare"
  | "makeup"
  | "hair"
  | "body"
  | "tools";

export type VariantType = "size" | "color";

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  stripe_price_id: string | null;
  sort_order: number;
  is_active: boolean;
  variant_type: VariantType;
  color_hex: string | null;
  swatch_image: string | null;
  variant_images: string[] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Review ─────────────────────────────────────────────
export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Order ──────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Order = {
  id: string;
  user_id: string | null;
  email: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  shipping_address: ShippingAddress;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

// ─── Customer ───────────────────────────────────────────
export type CustomerProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  default_shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
};

// ─── Coupon ─────────────────────────────────────────────
export type DiscountType = "percentage" | "fixed_amount";

export type Coupon = {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Blog ───────────────────────────────────────────────
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Shop Settings ──────────────────────────────────────
export type ShopSettings = {
  id: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  allowed_shipping_countries: string[];
  updated_at: string;
};

// ─── Cart ───────────────────────────────────────────────
export type CartItem = {
  product_id: string;
  variant_id: string | null;
  name: string;
  variant_name: string | null;
  price: number;
  quantity: number;
  image: string;
};

export type Cart = {
  items: CartItem[];
  coupon_code: string | null;
};
