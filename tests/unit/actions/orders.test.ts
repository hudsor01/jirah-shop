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

vi.mock('@/lib/email-notifications', () => ({
  notifyOrderStatusUpdate: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/queries/orders', () => ({
  queryAdminOrders: vi.fn(() => Promise.resolve({ orders: [], count: 0 })),
  queryAdminOrder: vi.fn(() => Promise.resolve(null)),
  queryRecentOrders: vi.fn(() => Promise.resolve([])),
  queryOrderStats: vi.fn(() =>
    Promise.resolve({
      totalRevenue: 1000,
      ordersToday: 5,
      totalCustomers: 100,
      lowStockProducts: 2,
    })
  ),
  querySalesData: vi.fn(() => Promise.resolve([])),
}))

import {
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  getOrderStats,
  getRecentOrders,
  getSalesData,
} from '@/actions/orders'
import { requireAdmin } from '@/lib/auth'
import { queryAdminOrders, queryOrderStats, querySalesData } from '@/queries/orders'

// ─── getAdminOrders ───────────────────────────────────────

describe('getAdminOrders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns orders on success', async () => {
    const result = await getAdminOrders()
    expect(result.success).toBe(true)
    expect(queryAdminOrders).toHaveBeenCalled()
  })

  it('requires admin access', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'))
    await expect(getAdminOrders()).rejects.toThrow('Forbidden')
  })

  it('handles query errors', async () => {
    vi.mocked(queryAdminOrders).mockRejectedValueOnce(new Error('DB error'))
    const result = await getAdminOrders()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('DB error')
    }
  })
})

// ─── getAdminOrder ────────────────────────────────────────

describe('getAdminOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null for invalid UUID (returns ok with null)', async () => {
    const result = await getAdminOrder('bad-id')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })

  it('returns order for valid UUID', async () => {
    const result = await getAdminOrder('a0000000-0000-4000-a000-000000000001')
    expect(result.success).toBe(true)
  })
})

// ─── updateOrderStatus ───────────────────────────────────

describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // mockFrom is called twice: once for update, once for select (email lookup)
    mockFrom
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email: 'test@example.com', id: 'a0000000-0000-4000-a000-000000000001' } }),
          }),
        }),
      })
  })

  it('succeeds with valid ID and status', async () => {
    const result = await updateOrderStatus('a0000000-0000-4000-a000-000000000001', 'shipped')
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await updateOrderStatus('bad-id', 'shipped')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid order ID')
    }
  })

  it('fails with invalid status', async () => {
    const result = await updateOrderStatus(
      'a0000000-0000-4000-a000-000000000001',
      'invalid_status' as any
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid order status')
    }
  })

  it('fails when DB update errors', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      }),
    })
    const result = await updateOrderStatus('a0000000-0000-4000-a000-000000000001', 'shipped')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('DB error')
    }
  })
})

// ─── getOrderStats ────────────────────────────────────────

describe('getOrderStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns stats on success', async () => {
    const result = await getOrderStats()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.totalRevenue).toBe(1000)
    }
    expect(queryOrderStats).toHaveBeenCalled()
  })

  it('handles query errors', async () => {
    vi.mocked(queryOrderStats).mockRejectedValueOnce(new Error('Stats error'))
    const result = await getOrderStats()
    expect(result.success).toBe(false)
  })
})

// ─── getRecentOrders ──────────────────────────────────────

describe('getRecentOrders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns recent orders on success', async () => {
    const result = await getRecentOrders()
    expect(result.success).toBe(true)
  })
})

// ─── getSalesData ─────────────────────────────────────────

describe('getSalesData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns sales data with default 30 days', async () => {
    const result = await getSalesData()
    expect(result.success).toBe(true)
    expect(querySalesData).toHaveBeenCalledWith(30)
  })

  it('accepts custom days parameter', async () => {
    const result = await getSalesData(7)
    expect(result.success).toBe(true)
    expect(querySalesData).toHaveBeenCalledWith(7)
  })

  it('fails with invalid days (0)', async () => {
    const result = await getSalesData(0)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid days parameter')
    }
  })

  it('fails with days exceeding maximum (366)', async () => {
    const result = await getSalesData(366)
    expect(result.success).toBe(false)
  })
})
