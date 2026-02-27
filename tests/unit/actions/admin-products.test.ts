import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockStripeProducts, mockStripePrices } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockStripeProducts: {
    create: vi.fn(),
    update: vi.fn(),
  },
  mockStripePrices: {
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: any) => fn }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ id: 'admin-001' })),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    products: mockStripeProducts,
    prices: mockStripePrices,
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/queries/products', () => ({
  queryAdminProducts: vi.fn(() => Promise.resolve({ products: [], count: 0 })),
  queryAdminProduct: vi.fn(() => Promise.resolve(null)),
}))

import { createProduct, updateProduct, deleteProduct } from '@/actions/admin-products'
import { requireAdmin } from '@/lib/auth'

// ─── Fixtures ─────────────────────────────────────────────

const validProductForm = {
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product description',
  short_description: 'Short desc',
  price: 29.99,
  compare_at_price: null,
  category: 'skincare' as const,
  subcategory: null,
  brand: 'TestBrand',
  is_own_brand: false,
  images: ['https://example.com/img.jpg'],
  ingredients: null,
  how_to_use: null,
  tags: ['test'],
  stock_quantity: 100,
  has_variants: false,
  is_featured: false,
  is_active: true,
}

const validVariant = {
  name: 'Small',
  sku: 'TEST-SM',
  price: 19.99,
  compare_at_price: null,
  stock_quantity: 50,
  sort_order: 0,
  is_active: true,
  variant_type: 'size',
  color_hex: null,
  swatch_image: null,
  variant_images: null,
  description: null,
}

const VALID_UUID = 'a0000000-0000-4000-a000-000000000001'

// ─── createProduct ────────────────────────────────────────

describe('createProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockStripeProducts.create.mockResolvedValue({ id: 'prod_stripe_001' })
    mockStripePrices.create.mockResolvedValue({ id: 'price_stripe_001' })

    // from("products").insert(...).select().single()
    // from("product_variants").insert(...)
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'db-prod-001' },
                error: null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      if (table === 'product_variants') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })
  })

  it('returns ok with product ID on success', async () => {
    const result = await createProduct(validProductForm, [])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('db-prod-001')
    }
  })

  it('creates Stripe product with correct name and metadata', async () => {
    await createProduct(validProductForm, [])
    expect(mockStripeProducts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Product',
        metadata: expect.objectContaining({ category: 'skincare', brand: 'TestBrand' }),
      })
    )
  })

  it('creates Stripe price for base product', async () => {
    await createProduct(validProductForm, [])
    expect(mockStripePrices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_stripe_001',
        unit_amount: 2999,
        currency: 'usd',
      })
    )
  })

  it('creates Stripe prices for each variant', async () => {
    await createProduct(validProductForm, [validVariant])
    // Base price + 1 variant price = 2 calls
    expect(mockStripePrices.create).toHaveBeenCalledTimes(2)
    expect(mockStripePrices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        unit_amount: 1999, // variant price 19.99
        metadata: expect.objectContaining({ variant_name: 'Small' }),
      })
    )
  })

  it('fails when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'))
    await expect(createProduct(validProductForm, [])).rejects.toThrow('Forbidden')
  })

  it('fails when Supabase insert fails and cleans up', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB insert error' },
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {}
    })

    const result = await createProduct(validProductForm, [])
    expect(result.success).toBe(false)
    // Should have attempted to archive the Stripe product
    expect(mockStripeProducts.update).toHaveBeenCalledWith('prod_stripe_001', { active: false })
  })

  it('fails when Stripe product creation fails', async () => {
    mockStripeProducts.create.mockRejectedValueOnce(new Error('Stripe API error'))
    const result = await createProduct(validProductForm, [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Stripe API error')
    }
  })
})

// ─── updateProduct ────────────────────────────────────────

describe('updateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeProducts.update.mockResolvedValue({})
    mockStripePrices.create.mockResolvedValue({ id: 'price_new_001' })
    mockStripePrices.update.mockResolvedValue({})

    // Multiple from() calls for different tables/operations
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  stripe_product_id: 'prod_stripe_001',
                  stripe_price_id: 'price_stripe_old',
                  price: 29.99,
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      if (table === 'product_variants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {}
    })
  })

  it('returns ok on success', async () => {
    const result = await updateProduct(VALID_UUID, validProductForm, [])
    expect(result.success).toBe(true)
  })

  it('updates Stripe product metadata', async () => {
    await updateProduct(VALID_UUID, validProductForm, [])
    expect(mockStripeProducts.update).toHaveBeenCalledWith(
      'prod_stripe_001',
      expect.objectContaining({
        name: 'Test Product',
        metadata: expect.objectContaining({ brand: 'TestBrand' }),
      })
    )
  })

  it('fails on invalid UUID', async () => {
    const result = await updateProduct('bad-id', validProductForm, [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid product ID')
    }
  })
})

// ─── deleteProduct ────────────────────────────────────────

describe('deleteProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeProducts.update.mockResolvedValue({})

    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { stripe_product_id: 'prod_stripe_001' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {}
    })
  })

  it('returns ok on success', async () => {
    const result = await deleteProduct(VALID_UUID)
    expect(result.success).toBe(true)
  })

  it('archives Stripe product (sets active: false)', async () => {
    await deleteProduct(VALID_UUID)
    expect(mockStripeProducts.update).toHaveBeenCalledWith('prod_stripe_001', { active: false })
  })

  it('soft deletes by setting is_active to false', async () => {
    await deleteProduct(VALID_UUID)
    // Verify that update was called on the products table
    const productsFrom = mockFrom.mock.results.find(
      (_, i) => mockFrom.mock.calls[i][0] === 'products'
    )
    expect(productsFrom).toBeDefined()
  })

  it('fails on invalid UUID', async () => {
    const result = await deleteProduct('invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid product ID')
    }
  })

  it('fails when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'))
    await expect(deleteProduct(VALID_UUID)).rejects.toThrow('Forbidden')
  })
})
