import type {
  Product,
  ProductVariant,
  CartItem,
  Order,
  OrderItem,
  Coupon,
  BlogPost,
  ShopSettings,
  ProductReview,
} from '@/types/database'

/**
 * Test fixture factories with sensible defaults.
 * Override any field via the `overrides` parameter.
 */

export function mockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-001',
    name: 'Test Moisturizer',
    slug: 'test-moisturizer',
    description: 'A test moisturizer for testing',
    short_description: 'Test moisturizer',
    price: 29.99,
    compare_at_price: null,
    category: 'skincare',
    subcategory: null,
    brand: 'TestBrand',
    is_own_brand: false,
    images: ['https://test.supabase.co/storage/v1/object/public/products/test.jpg'],
    ingredients: null,
    how_to_use: null,
    tags: ['test'],
    stock_quantity: 100,
    has_variants: false,
    is_featured: false,
    is_active: true,
    stripe_product_id: 'prod_test_123',
    stripe_price_id: 'price_test_123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function mockVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'var-001',
    product_id: 'prod-001',
    name: '50ml',
    sku: 'TEST-50ML',
    price: 29.99,
    compare_at_price: null,
    stock_quantity: 50,
    stripe_price_id: 'price_var_test_123',
    sort_order: 0,
    is_active: true,
    variant_type: 'size',
    color_hex: null,
    swatch_image: null,
    variant_images: null,
    description: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function mockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: 'prod-001',
    variant_id: null,
    name: 'Test Moisturizer',
    variant_name: null,
    price: 29.99,
    quantity: 1,
    image: 'https://test.supabase.co/storage/v1/object/public/products/test.jpg',
    ...overrides,
  }
}

export function mockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-001',
    user_id: null,
    email: 'test@example.com',
    stripe_checkout_session_id: 'cs_test_123',
    stripe_payment_intent_id: 'pi_test_123',
    status: 'paid',
    subtotal: 29.99,
    shipping_cost: 5.99,
    discount_amount: 0,
    total: 35.98,
    shipping_address: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Testville',
      state: 'TS',
      postal_code: '12345',
      country: 'US',
    },
    coupon_code: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function mockOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item-001',
    order_id: 'order-001',
    product_id: 'prod-001',
    variant_id: null,
    product_name: 'Test Moisturizer',
    variant_name: null,
    quantity: 1,
    unit_price: 29.99,
    total_price: 29.99,
    ...overrides,
  }
}

export function mockCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'coupon-001',
    code: 'TESTCODE',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: null,
    max_uses: null,
    current_uses: 0,
    is_active: true,
    expires_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function mockBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'blog-001',
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    content: '<p>Test content</p>',
    excerpt: 'Test excerpt',
    cover_image: null,
    tags: ['test'],
    is_published: true,
    published_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function mockShopSettings(overrides: Partial<ShopSettings> = {}): ShopSettings {
  return {
    id: 'settings-001',
    shipping_cost: 5.99,
    free_shipping_threshold: 50,
    allowed_shipping_countries: ['US'],
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function mockReview(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    id: 'review-001',
    product_id: 'prod-001',
    user_id: 'user-001',
    rating: 5,
    title: 'Great product!',
    comment: 'I love this moisturizer.',
    is_verified_purchase: true,
    is_approved: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

/**
 * Mock Stripe Checkout Session object.
 */
export function mockStripeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    payment_intent: 'pi_test_123',
    payment_status: 'paid',
    status: 'complete',
    customer_email: 'test@example.com',
    amount_total: 3598,
    amount_subtotal: 2999,
    total_details: {
      amount_discount: 0,
      amount_shipping: 599,
      amount_tax: 0,
    },
    metadata: {
      coupon_code: '',
    },
    shipping_details: {
      name: 'Test User',
      address: {
        line1: '123 Test St',
        line2: null,
        city: 'Testville',
        state: 'TS',
        postal_code: '12345',
        country: 'US',
      },
    },
    ...overrides,
  }
}

/**
 * Mock Stripe line item.
 */
export function mockStripeLineItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'li_test_123',
    object: 'item',
    price: {
      id: 'price_test_123',
      product: 'prod_test_123',
      unit_amount: 2999,
      metadata: {
        supabase_product_id: 'prod-001',
        supabase_variant_id: '',
      },
    },
    quantity: 1,
    amount_total: 2999,
    description: 'Test Moisturizer',
    ...overrides,
  }
}

/**
 * Mock admin user for requireAdmin tests.
 */
export function mockAdminUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'admin-001',
    email: 'admin@jirahshop.com',
    app_metadata: { role: 'admin' },
    user_metadata: {},
    ...overrides,
  }
}

/**
 * Mock regular (non-admin) user.
 */
export function mockRegularUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-001',
    email: 'user@example.com',
    app_metadata: { role: 'customer' },
    user_metadata: {},
    ...overrides,
  }
}
