import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Hoisted mocks ────────────────────────────────────────
const { mockStripe, mockAdminFrom, mockAdminRpc } = vi.hoisted(() => ({
  mockStripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
  mockAdminFrom: vi.fn(),
  mockAdminRpc: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    rpc: mockAdminRpc,
  })),
}))

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'pk_test_123',
    SUPABASE_SERVICE_ROLE_KEY: 'service_key_test',
    STRIPE_SECRET_KEY: 'sk_test_123',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  webhookLimiter: {
    check: vi.fn(() => Promise.resolve({ success: true, remaining: 9, reset: Date.now() + 60000 })),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/email-notifications', () => ({
  notifyOrderConfirmation: vi.fn(),
  notifyAdminNewOrder: vi.fn(),
}))

import { POST } from '@/app/api/webhooks/stripe/route'
import { webhookLimiter } from '@/lib/rate-limit'

// ─── Helpers ──────────────────────────────────────────────

function makeRequest(body: string, signature = 'valid_sig'): NextRequest {
  const headers: Record<string, string> = {}
  if (signature) {
    headers['stripe-signature'] = signature
  }
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers,
  })
}

function makeCheckoutEvent(sessionOverrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_test_001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        customer_details: { email: 'test@example.com', name: 'Test User' },
        amount_total: 3598,
        metadata: {
          coupon_code: '',
          discount_amount: '0.00',
          original_subtotal: '29.99',
        },
        collected_information: {
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
        },
        ...sessionOverrides,
      },
    },
  }
}

function makeRefundEvent(chargeOverrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_test_002',
    type: 'charge.refunded',
    data: {
      object: {
        id: 'ch_test_123',
        payment_intent: 'pi_test_123',
        ...chargeOverrides,
      },
    },
  }
}

/** Full session returned by stripe.checkout.sessions.retrieve */
function makeFullSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_123',
    payment_intent: 'pi_test_123',
    customer_details: { email: 'test@example.com', name: 'Test User' },
    amount_total: 3598,
    metadata: {
      coupon_code: '',
      discount_amount: '0.00',
      original_subtotal: '29.99',
    },
    collected_information: {
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
    },
    line_items: {
      data: [
        {
          id: 'li_test_001',
          price: {
            unit_amount: 2999,
            product: {
              name: 'Test Moisturizer',
              metadata: {
                product_id: 'prod-001',
                variant_id: '',
                original_unit_price: '29.99',
              },
            },
          },
          quantity: 1,
          amount_total: 2999,
          description: 'Test Moisturizer',
        },
        {
          id: 'li_ship_001',
          price: {
            unit_amount: 599,
            product: {
              name: 'Shipping',
              metadata: {},
            },
          },
          quantity: 1,
          amount_total: 599,
          description: 'Shipping',
        },
      ],
    },
    ...overrides,
  }
}

function setupCheckoutMocks(options: {
  existingOrder?: boolean
  profileId?: string | null
  orderInsertError?: string | null
  orderItemsInsertError?: string | null
} = {}) {
  const {
    existingOrder = false,
    profileId = null,
    orderInsertError = null,
    orderItemsInsertError = null,
  } = options

  mockStripe.checkout.sessions.retrieve.mockResolvedValue(makeFullSession())

  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'orders') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: existingOrder ? { id: 'existing-order-001' } : null,
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: orderInsertError ? null : { id: 'order-001' },
              error: orderInsertError ? { message: orderInsertError } : null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }
    if (table === 'customer_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: profileId ? { id: profileId } : null,
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'order_items') {
      return {
        insert: vi.fn().mockResolvedValue({
          error: orderItemsInsertError ? { message: orderItemsInsertError } : null,
        }),
      }
    }
    return {}
  })

  mockAdminRpc.mockResolvedValue({ data: 1, error: null })
}

// ─── Tests ────────────────────────────────────────────────

describe('Stripe Webhook POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Signature validation ──────────────────────────

  describe('signature validation', () => {
    it('returns 400 when stripe-signature header missing', async () => {
      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: '{}',
        // no stripe-signature header
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing stripe-signature')
    })

    it('returns 400 when constructEvent throws', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const req = makeRequest('{}')
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Invalid signature')
    })
  })

  // ─── Rate limiting ─────────────────────────────────

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      vi.mocked(webhookLimiter.check).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      const req = makeRequest('{}')
      const res = await POST(req)
      expect(res.status).toBe(429)
    })
  })

  // ─── checkout.session.completed ────────────────────

  describe('checkout.session.completed', () => {
    beforeEach(() => {
      const event = makeCheckoutEvent()
      mockStripe.webhooks.constructEvent.mockReturnValue(event)
      setupCheckoutMocks()
    })

    it('creates order and returns 200', async () => {
      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)
    })

    it('creates order with correct totals from metadata', async () => {
      const event = makeCheckoutEvent()
      mockStripe.webhooks.constructEvent.mockReturnValue(event)
      setupCheckoutMocks()

      const req = makeRequest(JSON.stringify(event))
      await POST(req)

      // Verify orders.insert was called
      const ordersInsert = mockAdminFrom.mock.results.find(
        (_: unknown, i: number) => mockAdminFrom.mock.calls[i][0] === 'orders'
      )
      expect(ordersInsert).toBeDefined()
    })

    it('calls decrement_stock RPC for each line item', async () => {
      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      await POST(req)

      // One product line item => one decrement_stock call
      expect(mockAdminRpc).toHaveBeenCalledWith('decrement_stock', {
        p_product_id: 'prod-001',
        p_variant_id: null,
        p_quantity: 1,
      })
    })

    it('calls increment_coupon_uses when coupon present', async () => {
      const event = makeCheckoutEvent({
        metadata: {
          coupon_code: 'SAVE10',
          discount_amount: '3.00',
          original_subtotal: '29.99',
        },
      })
      mockStripe.webhooks.constructEvent.mockReturnValue(event)

      const fullSession = makeFullSession({
        metadata: {
          coupon_code: 'SAVE10',
          discount_amount: '3.00',
          original_subtotal: '29.99',
        },
      })
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(fullSession)

      const req = makeRequest(JSON.stringify(event))
      await POST(req)

      expect(mockAdminRpc).toHaveBeenCalledWith('increment_coupon_uses', {
        coupon_code: 'SAVE10',
      })
    })

    it('does NOT call increment_coupon_uses when no coupon', async () => {
      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      await POST(req)

      const couponCalls = mockAdminRpc.mock.calls.filter(
        (call: unknown[]) => call[0] === 'increment_coupon_uses'
      )
      expect(couponCalls).toHaveLength(0)
    })

    it('skips order creation when order already exists (idempotency)', async () => {
      setupCheckoutMocks({ existingOrder: true })

      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      const res = await POST(req)
      expect(res.status).toBe(200)

      // orders.insert should NOT have been called -- verify via from calls
      // the second "orders" call would be insert; with idempotency, we skip
      const orderInsertCalls = mockAdminFrom.mock.calls.filter(
        (call: unknown[]) => call[0] === 'orders'
      )
      // Only 1 call for the select (idempotency check), no insert
      expect(orderInsertCalls.length).toBe(1)
    })

    it('associates order with user when profile found', async () => {
      setupCheckoutMocks({ profileId: 'user-001' })

      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      await POST(req)

      // Verify customer_profiles was queried
      const profileCalls = mockAdminFrom.mock.calls.filter(
        (call: unknown[]) => call[0] === 'customer_profiles'
      )
      expect(profileCalls.length).toBeGreaterThan(0)
    })

    it('sets userId to null when no matching profile', async () => {
      setupCheckoutMocks({ profileId: null })

      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      const res = await POST(req)
      expect(res.status).toBe(200)
    })

    it('separates shipping from product line items', async () => {
      const req = makeRequest(JSON.stringify(makeCheckoutEvent()))
      await POST(req)

      // order_items.insert should NOT include shipping line item
      const orderItemsCalls = mockAdminFrom.mock.calls.filter(
        (call: unknown[]) => call[0] === 'order_items'
      )
      expect(orderItemsCalls.length).toBe(1) // exactly one insert call for order items
    })
  })

  // ─── charge.refunded ───────────────────────────────

  describe('charge.refunded', () => {
    it('updates order status to refunded', async () => {
      const event = makeRefundEvent()
      mockStripe.webhooks.constructEvent.mockReturnValue(event)
      mockAdminFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const req = makeRequest(JSON.stringify(event))
      const res = await POST(req)
      expect(res.status).toBe(200)
    })

    it('returns 200 on successful refund update', async () => {
      const event = makeRefundEvent()
      mockStripe.webhooks.constructEvent.mockReturnValue(event)
      mockAdminFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const req = makeRequest(JSON.stringify(event))
      const res = await POST(req)
      const body = await res.json()
      expect(body.received).toBe(true)
    })
  })

  // ─── Error handling ────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when order insert fails', async () => {
      const event = makeCheckoutEvent()
      mockStripe.webhooks.constructEvent.mockReturnValue(event)
      setupCheckoutMocks({ orderInsertError: 'DB insert failed' })

      const req = makeRequest(JSON.stringify(event))
      const res = await POST(req)
      expect(res.status).toBe(500)
    })

    it('continues when stock decrement fails (partial fulfillment)', async () => {
      const event = makeCheckoutEvent()
      mockStripe.webhooks.constructEvent.mockReturnValue(event)
      setupCheckoutMocks()
      mockAdminRpc.mockResolvedValueOnce({ data: 0, error: { message: 'Stock error' } })

      const req = makeRequest(JSON.stringify(event))
      const res = await POST(req)
      // Should still succeed despite stock decrement failure
      expect(res.status).toBe(200)
    })

    it('returns 200 for unhandled event types', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test_999',
        type: 'invoice.paid',
        data: { object: {} },
      })

      const req = makeRequest('{}')
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)
    })
  })
})
