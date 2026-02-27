import { vi } from 'vitest'

/**
 * Creates a mock Stripe client for testing checkout, webhooks, and admin product sync.
 *
 * Usage:
 *   const mockStripe = createMockStripeClient()
 *   vi.mock('@/lib/stripe', () => ({
 *     stripe: mockStripe,
 *     getStripe: () => mockStripe,
 *   }))
 */
export function createMockStripeClient() {
  return {
    checkout: {
      sessions: {
        create: vi.fn(() =>
          Promise.resolve({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/c/pay/cs_test_123',
          })
        ),
        retrieve: vi.fn(() =>
          Promise.resolve({
            id: 'cs_test_123',
            payment_intent: 'pi_test_123',
            customer_email: 'test@example.com',
            metadata: {},
            amount_total: 2999,
            line_items: { data: [] },
          })
        ),
      },
    },
    products: {
      create: vi.fn(() =>
        Promise.resolve({ id: 'prod_test_123', name: 'Test Product' })
      ),
      update: vi.fn(() =>
        Promise.resolve({ id: 'prod_test_123', name: 'Updated Product' })
      ),
      del: vi.fn(() => Promise.resolve({ id: 'prod_test_123', deleted: true })),
    },
    prices: {
      create: vi.fn(() =>
        Promise.resolve({ id: 'price_test_123', unit_amount: 2999 })
      ),
      update: vi.fn(() =>
        Promise.resolve({ id: 'price_test_123', active: false })
      ),
    },
    webhooks: {
      constructEvent: vi.fn(
        (body: string, signature: string, _secret: string) => {
          return JSON.parse(body)
        }
      ),
    },
  }
}

/**
 * Creates a mock Stripe event for webhook testing.
 */
export function createMockStripeEvent(
  type: string,
  data: Record<string, unknown> = {}
) {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: {
      object: {
        id: 'cs_test_123',
        ...data,
      },
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2024-06-20',
  }
}
