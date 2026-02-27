import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: any) => fn }
})

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ id: 'admin-001' })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/queries/coupons', () => ({
  queryAdminCoupons: vi.fn(() => Promise.resolve({ coupons: [], count: 0 })),
}))

import { createCoupon, updateCoupon, deleteCoupon } from '@/actions/coupons'
import { requireAdmin } from '@/lib/auth'

const validCouponForm = {
  code: 'SAVE10',
  discount_type: 'percentage' as const,
  discount_value: 10,
  min_order_amount: null,
  max_uses: null,
  is_active: true,
  expires_at: null,
}

describe('createCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // createCoupon: from().insert({...})
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('returns ok on success', async () => {
    const result = await createCoupon(validCouponForm)
    expect(result.success).toBe(true)
  })

  it('fails with invalid discount_value (zero)', async () => {
    const result = await createCoupon({ ...validCouponForm, discount_value: 0 })
    expect(result.success).toBe(false)
  })

  it('fails with negative discount_value', async () => {
    const result = await createCoupon({ ...validCouponForm, discount_value: -5 })
    expect(result.success).toBe(false)
  })

  it('fails when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'))
    await expect(createCoupon(validCouponForm)).rejects.toThrow('Forbidden')
  })
})

describe('updateCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // updateCoupon: from().update({...}).eq("id", id)
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('returns ok on success', async () => {
    const result = await updateCoupon('a0000000-0000-4000-a000-000000000001', validCouponForm)
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await updateCoupon('bad-id', validCouponForm)
    expect(result.success).toBe(false)
  })
})

describe('deleteCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // deleteCoupon: from().delete().eq("id", id)
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('returns ok on success', async () => {
    const result = await deleteCoupon('a0000000-0000-4000-a000-000000000001')
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await deleteCoupon('invalid')
    expect(result.success).toBe(false)
  })
})
