import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────
const { mockFrom, mockStripe } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockStripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
}))

vi.mock('@/lib/constants', () => ({
  CURRENCY: 'usd',
  SITE_URL: 'http://localhost:3000',
}))

vi.mock('@/actions/settings', () => ({
  getShopSettings: vi.fn(() =>
    Promise.resolve({
      id: 'settings-001',
      shipping_cost: 5.99,
      free_shipping_threshold: 50,
      allowed_shipping_countries: ['US'],
    })
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { createCheckoutSession } from '@/actions/checkout'
import type { CartItem } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: 'prod-001',
    variant_id: null,
    name: 'Test Moisturizer',
    price: 29.99,
    quantity: 1,
    image: 'https://example.com/img.jpg',
    ...overrides,
  }
}

function setupProductLookup(
  products: Array<{ id: string; price: number; stock_quantity: number; is_active: boolean; name: string }>,
  variants: Array<{ id: string; price: number; stock_quantity: number; is_active: boolean; product_id: string }> = []
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'products') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: products }),
        }),
      }
    }
    if (table === 'product_variants') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: variants }),
        }),
      }
    }
    if (table === 'coupons') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      }
    }
    return {}
  })
}

function setupCouponLookup(coupon: Record<string, unknown> | null) {
  // Override just the coupons table part of mockFrom
  const originalImpl = mockFrom.getMockImplementation()
  mockFrom.mockImplementation((table: string) => {
    if (table === 'coupons') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: coupon }),
            }),
          }),
        }),
      }
    }
    if (originalImpl) return originalImpl(table)
    return {}
  })
}

// ─── Tests ────────────────────────────────────────────────

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    })
  })

  // ─── Validation ────────────────────────────────────

  describe('validation', () => {
    it('fails when cart is empty', async () => {
      const result = await createCheckoutSession([])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Cart is empty')
      }
    })

    it('fails when item has negative price', async () => {
      const result = await createCheckoutSession([makeCartItem({ price: -10 })])
      expect(result.success).toBe(false)
    })

    it('fails when item has zero quantity', async () => {
      const result = await createCheckoutSession([makeCartItem({ quantity: 0 })])
      expect(result.success).toBe(false)
    })
  })

  // ─── Price validation (server-side) ────────────────

  describe('price validation', () => {
    it('replaces client prices with DB prices', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 15, stock_quantity: 100, is_active: true, name: 'DB Product' },
      ])

      const result = await createCheckoutSession([makeCartItem({ price: 10 })])
      expect(result.success).toBe(true)

      // Stripe should receive the DB price ($15), not the client price ($10)
      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const lineItem = createCall.line_items[0]
      // unit_amount should be 1500 (15 * 100 cents)
      expect(lineItem.price_data.unit_amount).toBe(1500)
    })

    it('fails when product not found in DB', async () => {
      setupProductLookup([]) // no products returned

      const result = await createCheckoutSession([makeCartItem()])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Item is currently unavailable')
      }
    })

    it('fails when product is_active=false', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 29.99, stock_quantity: 100, is_active: false, name: 'Inactive' },
      ])

      const result = await createCheckoutSession([makeCartItem()])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Item is currently unavailable')
      }
    })

    it('fails when variant not found', async () => {
      setupProductLookup(
        [{ id: 'prod-001', price: 29.99, stock_quantity: 100, is_active: true, name: 'Product' }],
        [] // no variants
      )

      const result = await createCheckoutSession([
        makeCartItem({ variant_id: 'var-001' }),
      ])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Item is currently unavailable')
      }
    })

    it('fails when variant is_active=false', async () => {
      setupProductLookup(
        [{ id: 'prod-001', price: 29.99, stock_quantity: 100, is_active: true, name: 'Product' }],
        [{ id: 'var-001', price: 19.99, stock_quantity: 50, is_active: false, product_id: 'prod-001' }]
      )

      const result = await createCheckoutSession([
        makeCartItem({ variant_id: 'var-001' }),
      ])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Item is currently unavailable')
      }
    })
  })

  // ─── Stock checks ──────────────────────────────────

  describe('stock checks', () => {
    it('fails when requested quantity exceeds stock', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 29.99, stock_quantity: 2, is_active: true, name: 'Product' },
      ])

      const result = await createCheckoutSession([makeCartItem({ quantity: 5 })])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Item is currently unavailable')
      }
    })

    it('succeeds when quantity equals available stock', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 29.99, stock_quantity: 3, is_active: true, name: 'Product' },
      ])

      const result = await createCheckoutSession([makeCartItem({ quantity: 3 })])
      expect(result.success).toBe(true)
    })
  })

  // ─── Coupon logic ──────────────────────────────────

  describe('coupon logic', () => {
    beforeEach(() => {
      setupProductLookup([
        { id: 'prod-001', price: 100, stock_quantity: 100, is_active: true, name: 'Product' },
      ])
    })

    it('fails when coupon not found', async () => {
      setupCouponLookup(null)

      const result = await createCheckoutSession([makeCartItem({ price: 100 })], 'BADCODE')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Coupon is not valid')
      }
    })

    it('fails when coupon expired', async () => {
      setupCouponLookup({
        code: 'EXPIRED',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        expires_at: '2020-01-01T00:00:00Z',
        max_uses: null,
        current_uses: 0,
        min_order_amount: null,
      })

      const result = await createCheckoutSession([makeCartItem({ price: 100 })], 'EXPIRED')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Coupon is not valid')
      }
    })

    it('fails when max uses reached', async () => {
      setupCouponLookup({
        code: 'MAXED',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        expires_at: null,
        max_uses: 5,
        current_uses: 5,
        min_order_amount: null,
      })

      const result = await createCheckoutSession([makeCartItem({ price: 100 })], 'MAXED')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Coupon is not valid')
      }
    })

    it('fails when order below minimum', async () => {
      setupCouponLookup({
        code: 'HIGHMIN',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        expires_at: null,
        max_uses: null,
        current_uses: 0,
        min_order_amount: 200,
      })

      const result = await createCheckoutSession([makeCartItem({ price: 100 })], 'HIGHMIN')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Coupon is not valid')
      }
    })

    it('applies percentage discount correctly', async () => {
      setupCouponLookup({
        code: 'SAVE10',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        expires_at: null,
        max_uses: null,
        current_uses: 0,
        min_order_amount: null,
      })

      const result = await createCheckoutSession([makeCartItem({ price: 100 })], 'SAVE10')
      expect(result.success).toBe(true)

      // 10% off $100 = $90, so unit_amount should be 9000
      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const lineItem = createCall.line_items[0]
      expect(lineItem.price_data.unit_amount).toBe(9000)
    })

    it('applies fixed discount correctly', async () => {
      setupCouponLookup({
        code: 'FLAT10',
        discount_type: 'fixed',
        discount_value: 10,
        is_active: true,
        expires_at: null,
        max_uses: null,
        current_uses: 0,
        min_order_amount: null,
      })

      const result = await createCheckoutSession([makeCartItem({ price: 100 })], 'FLAT10')
      expect(result.success).toBe(true)

      // $10 off $100 = $90, so unit_amount should be 9000
      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const lineItem = createCall.line_items[0]
      expect(lineItem.price_data.unit_amount).toBe(9000)
    })

    it('fixed discount capped at subtotal', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 5, stock_quantity: 100, is_active: true, name: 'Cheap Product' },
      ])
      setupCouponLookup({
        code: 'BIGFLAT',
        discount_type: 'fixed',
        discount_value: 100,
        is_active: true,
        expires_at: null,
        max_uses: null,
        current_uses: 0,
        min_order_amount: null,
      })

      const result = await createCheckoutSession([makeCartItem({ price: 5 })], 'BIGFLAT')
      expect(result.success).toBe(true)

      // $100 off $5 → capped at $5 → unit_amount = 0
      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const lineItem = createCall.line_items[0]
      expect(lineItem.price_data.unit_amount).toBe(0)
    })
  })

  // ─── Session creation ──────────────────────────────

  describe('session creation', () => {
    beforeEach(() => {
      setupProductLookup([
        { id: 'prod-001', price: 29.99, stock_quantity: 100, is_active: true, name: 'Test Moisturizer' },
      ])
    })

    it('returns ok with URL on success (no coupon)', async () => {
      const result = await createCheckoutSession([makeCartItem()])
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBe('https://checkout.stripe.com/c/pay/cs_test_123')
      }
    })

    it('returns ok with URL on success with valid coupon', async () => {
      setupCouponLookup({
        code: 'SAVE10',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        expires_at: null,
        max_uses: null,
        current_uses: 0,
        min_order_amount: null,
      })

      const result = await createCheckoutSession([makeCartItem()], 'SAVE10')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBeDefined()
      }
    })

    it('adds shipping when subtotal below threshold', async () => {
      // 29.99 < 50 threshold
      await createCheckoutSession([makeCartItem()])

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const shippingItem = createCall.line_items.find(
        (li: any) => li.price_data.product_data.name === 'Shipping'
      )
      expect(shippingItem).toBeDefined()
      expect(shippingItem.price_data.unit_amount).toBe(599) // 5.99 * 100
    })

    it('no shipping when subtotal >= threshold', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 60, stock_quantity: 100, is_active: true, name: 'Expensive' },
      ])

      await createCheckoutSession([makeCartItem({ price: 60 })])

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const shippingItem = createCall.line_items.find(
        (li: any) => li.price_data.product_data.name === 'Shipping'
      )
      expect(shippingItem).toBeUndefined()
    })

    it('line items include correct metadata', async () => {
      await createCheckoutSession([makeCartItem()])

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      const lineItem = createCall.line_items[0]
      expect(lineItem.price_data.product_data.metadata).toEqual({
        product_id: 'prod-001',
        variant_id: '',
        original_unit_price: '29.99',
      })
    })

    it('session metadata includes coupon and discount info', async () => {
      setupCouponLookup({
        code: 'SAVE10',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        expires_at: null,
        max_uses: null,
        current_uses: 0,
        min_order_amount: null,
      })

      await createCheckoutSession([makeCartItem()], 'SAVE10')

      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.metadata.coupon_code).toBe('SAVE10')
      expect(parseFloat(createCall.metadata.discount_amount)).toBeCloseTo(3.0, 1) // 10% of 29.99
      expect(parseFloat(createCall.metadata.original_subtotal)).toBeCloseTo(29.99, 2)
    })
  })

  // ─── Error handling ────────────────────────────────

  describe('error handling', () => {
    it('returns fail when Stripe throws', async () => {
      setupProductLookup([
        { id: 'prod-001', price: 29.99, stock_quantity: 100, is_active: true, name: 'Product' },
      ])
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(new Error('Stripe API down'))

      const result = await createCheckoutSession([makeCartItem()])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Stripe API down')
      }
    })
  })
})
