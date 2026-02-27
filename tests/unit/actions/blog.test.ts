import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: any) => fn }
})

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ id: 'admin-001', app_metadata: { role: 'admin' } })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/queries/blog', () => ({
  queryBlogPosts: vi.fn(() => Promise.resolve({ data: [], total: 0, page: 1, pageSize: 20 })),
  queryBlogPostBySlug: vi.fn(() => Promise.resolve(null)),
  queryAdminBlogPosts: vi.fn(() => Promise.resolve({ posts: [], count: 0 })),
  queryAdminBlogPost: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('@/lib/sanitize', () => ({
  sanitizeRichHTML: vi.fn((html: string) => html),
}))

import { createBlogPost, updateBlogPost, deleteBlogPost } from '@/actions/blog'
import { requireAdmin } from '@/lib/auth'

const validBlogForm = {
  title: 'Test Post',
  slug: 'test-post',
  content: '<p>Test content</p>',
  excerpt: 'Test excerpt',
  cover_image: null,
  tags: ['test'],
  is_published: false,
}

describe('createBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // createBlogPost: from().insert().select().single()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'blog-001' },
            error: null,
          }),
        }),
      }),
    })
  })

  it('returns ok with blog post ID on success', async () => {
    const result = await createBlogPost(validBlogForm)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('blog-001')
    }
  })

  it('requires admin access', async () => {
    expect(requireAdmin).toHaveBeenCalled
    await createBlogPost(validBlogForm)
    expect(requireAdmin).toHaveBeenCalled()
  })

  it('fails when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden: admin access required'))

    await expect(createBlogPost(validBlogForm)).rejects.toThrow('Forbidden')
  })

  it('fails when Supabase insert fails', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB error' },
          }),
        }),
      }),
    })

    const result = await createBlogPost(validBlogForm)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('DB error')
    }
  })
})

describe('updateBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // updateBlogPost calls from() twice:
    // 1. from().select("is_published").eq("id", id).single()
    // 2. from().update({...}).eq("id", id)
    const mockEqForUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockEqForSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { is_published: false },
        error: null,
      }),
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: mockEqForSelect,
      }),
      update: vi.fn().mockReturnValue({
        eq: mockEqForUpdate,
      }),
    })
  })

  it('returns ok on success', async () => {
    const result = await updateBlogPost('a0000000-0000-4000-a000-000000000001', validBlogForm)
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await updateBlogPost('not-a-uuid', validBlogForm)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid blog post ID')
    }
  })
})

describe('deleteBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // deleteBlogPost: from().delete().eq("id", id)
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('returns ok on success', async () => {
    const result = await deleteBlogPost('a0000000-0000-4000-a000-000000000001')
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await deleteBlogPost('invalid')
    expect(result.success).toBe(false)
  })
})
