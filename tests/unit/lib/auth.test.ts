import { describe, it, expect, vi, beforeEach } from 'vitest'

// Unwrap React.cache so requireAdmin behaves as a normal async function
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: any) => fn }
})

// Mock the server-side Supabase client
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}))

import { requireAdmin, sanitizeRedirect, sanitizeSearchInput } from '@/lib/auth'

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when authenticated with admin role', async () => {
    const adminUser = {
      id: 'admin-001',
      email: 'admin@test.com',
      app_metadata: { role: 'admin' },
    }
    mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null })

    const user = await requireAdmin()
    expect(user).toEqual(adminUser)
  })

  it('throws "Unauthorized: not authenticated" when getUser returns error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth session missing' },
    })

    await expect(requireAdmin()).rejects.toThrow('Unauthorized: not authenticated')
  })

  it('throws "Unauthorized: not authenticated" when getUser returns null user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(requireAdmin()).rejects.toThrow('Unauthorized: not authenticated')
  })

  it('throws "Forbidden: admin access required" when user role is not admin', async () => {
    const regularUser = {
      id: 'user-001',
      email: 'user@test.com',
      app_metadata: { role: 'customer' },
    }
    mockGetUser.mockResolvedValue({ data: { user: regularUser }, error: null })

    await expect(requireAdmin()).rejects.toThrow('Forbidden: admin access required')
  })

  it('throws "Forbidden: admin access required" when app_metadata is undefined', async () => {
    const noMetaUser = {
      id: 'user-002',
      email: 'user@test.com',
      app_metadata: undefined,
    }
    mockGetUser.mockResolvedValue({ data: { user: noMetaUser }, error: null })

    await expect(requireAdmin()).rejects.toThrow('Forbidden: admin access required')
  })
})

describe('sanitizeRedirect', () => {
  it('returns the path when starting with single slash', () => {
    expect(sanitizeRedirect('/dashboard')).toBe('/dashboard')
  })

  it('returns "/" for protocol-relative URL', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/')
  })

  it('returns "/" for absolute URL', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/')
  })

  it('returns "/" for URL with backslash trick', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBe('/')
  })

  it('returns "/" for empty string', () => {
    expect(sanitizeRedirect('')).toBe('/')
  })

  it('returns "/" for path starting with no slash', () => {
    expect(sanitizeRedirect('dashboard')).toBe('/')
  })

  it('preserves query parameters', () => {
    expect(sanitizeRedirect('/search?q=test')).toBe('/search?q=test')
  })

  it('preserves hash fragments', () => {
    expect(sanitizeRedirect('/page#section')).toBe('/page#section')
  })
})

describe('sanitizeSearchInput', () => {
  it('removes commas from input', () => {
    expect(sanitizeSearchInput('a,b')).toBe('ab')
  })

  it('removes parentheses', () => {
    expect(sanitizeSearchInput('foo(bar)')).toBe('foobar')
  })

  it('removes backslashes', () => {
    expect(sanitizeSearchInput('foo\\bar')).toBe('foobar')
  })

  it('removes closing braces', () => {
    expect(sanitizeSearchInput('foo}')).toBe('foo')
  })

  it('escapes percent signs', () => {
    expect(sanitizeSearchInput('50%')).toBe('50\\%')
  })

  it('escapes underscores', () => {
    expect(sanitizeSearchInput('foo_bar')).toBe('foo\\_bar')
  })

  it('preserves normal text', () => {
    expect(sanitizeSearchInput('hello world')).toBe('hello world')
  })

  it('handles combined injection attempt', () => {
    expect(sanitizeSearchInput('a,b(c)\\d}%e_f')).toBe('abcd\\%e\\_f')
  })
})
