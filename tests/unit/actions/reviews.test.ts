import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: any) => fn }
})

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      rpc: mockRpc,
    })
  ),
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

vi.mock('@/lib/rate-limit', () => ({
  reviewLimiter: { check: vi.fn(() => Promise.resolve({ success: true, remaining: 4, reset: Date.now() + 60000 })) },
}))

vi.mock('@/queries/reviews', () => ({
  queryProductReviews: vi.fn(() =>
    Promise.resolve({ data: [], total: 0, page: 1, pageSize: 20 })
  ),
  queryAdminReviews: vi.fn(() =>
    Promise.resolve({ reviews: [], count: 0 })
  ),
}))

import {
  getProductReviews,
  submitReview,
  getAdminReviews,
  approveReview,
  deleteReview,
  rejectReview,
} from '@/actions/reviews'
import { requireAdmin } from '@/lib/auth'
import { reviewLimiter } from '@/lib/rate-limit'
import { queryProductReviews } from '@/queries/reviews'

// ─── Helpers ──────────────────────────────────────────────

function makeReviewFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set('product_id', overrides.product_id ?? 'prod-001')
  fd.set('rating', overrides.rating ?? '4')
  fd.set('title', overrides.title ?? 'Great product')
  fd.set('comment', overrides.comment ?? 'This is a wonderful product that I really enjoy using!')
  return fd
}

// ─── getProductReviews ────────────────────────────────────

describe('getProductReviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns reviews for a valid product ID', async () => {
    const result = await getProductReviews('prod-001')
    expect(result.success).toBe(true)
    expect(queryProductReviews).toHaveBeenCalledWith('prod-001', undefined)
  })

  it('fails with empty product ID', async () => {
    const result = await getProductReviews('')
    expect(result.success).toBe(false)
  })

  it('handles query errors gracefully', async () => {
    vi.mocked(queryProductReviews).mockRejectedValueOnce(new Error('DB failure'))
    const result = await getProductReviews('prod-001')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('DB failure')
    }
  })
})

// ─── submitReview ─────────────────────────────────────────

describe('submitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-001' } } })
    mockRpc.mockResolvedValue({ data: true })
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('succeeds for an authenticated user', async () => {
    const result = await submitReview(makeReviewFormData())
    expect(result.success).toBe(true)
  })

  it('fails when rate limited', async () => {
    vi.mocked(reviewLimiter.check).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    })
    const result = await submitReview(makeReviewFormData())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Too many requests')
    }
  })

  it('fails when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await submitReview(makeReviewFormData())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('sign in')
    }
  })

  it('fails with invalid rating (0)', async () => {
    const result = await submitReview(makeReviewFormData({ rating: '0' }))
    expect(result.success).toBe(false)
  })

  it('fails with too-short comment', async () => {
    const result = await submitReview(makeReviewFormData({ comment: 'short' }))
    expect(result.success).toBe(false)
  })

  it('fails when DB insert errors', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'insert error' } }),
    })
    const result = await submitReview(makeReviewFormData())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('insert error')
    }
  })
})

// ─── approveReview ────────────────────────────────────────

describe('approveReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // approveReview: from().update({ is_approved: true }).eq("id", id)
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('succeeds with valid UUID', async () => {
    const result = await approveReview('a0000000-0000-4000-a000-000000000001')
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await approveReview('bad-id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid review ID')
    }
  })

  it('fails when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'))
    await expect(approveReview('a0000000-0000-4000-a000-000000000001')).rejects.toThrow('Forbidden')
  })
})

// ─── deleteReview ─────────────────────────────────────────

describe('deleteReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // deleteReview: from().delete().eq("id", id)
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('succeeds with valid UUID', async () => {
    const result = await deleteReview('a0000000-0000-4000-a000-000000000001')
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await deleteReview('invalid')
    expect(result.success).toBe(false)
  })
})

// ─── rejectReview ─────────────────────────────────────────

describe('rejectReview', () => {
  it('is an alias for deleteReview', () => {
    expect(rejectReview).toBe(deleteReview)
  })
})
