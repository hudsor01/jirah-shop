import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: any) => fn }
})

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/rate-limit', () => ({
  contactLimiter: { check: vi.fn(() => Promise.resolve({ success: true, remaining: 2, reset: Date.now() + 60000 })) },
}))

import { submitContactForm } from '@/actions/contact'
import { contactLimiter } from '@/lib/rate-limit'

function makeContactFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set('name', overrides.name ?? 'Jane Doe')
  fd.set('email', overrides.email ?? 'jane@example.com')
  fd.set('subject', overrides.subject ?? 'Question about order')
  fd.set('message', overrides.message ?? 'I have a question about my recent purchase.')
  return fd
}

describe('submitContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('succeeds with valid form data', async () => {
    const result = await submitContactForm(makeContactFormData())
    expect(result.success).toBe(true)
  })

  it('fails when rate limited', async () => {
    vi.mocked(contactLimiter.check).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    })
    const result = await submitContactForm(makeContactFormData())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Too many requests')
    }
  })

  it('fails with empty name', async () => {
    const result = await submitContactForm(makeContactFormData({ name: '' }))
    expect(result.success).toBe(false)
  })

  it('fails with invalid email', async () => {
    const result = await submitContactForm(makeContactFormData({ email: 'not-an-email' }))
    expect(result.success).toBe(false)
  })

  it('fails with empty message', async () => {
    const result = await submitContactForm(makeContactFormData({ message: '' }))
    expect(result.success).toBe(false)
  })

  it('allows null subject', async () => {
    const fd = makeContactFormData()
    fd.set('subject', '')
    const result = await submitContactForm(fd)
    expect(result.success).toBe(true)
  })

  it('fails when DB insert errors', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    })
    const result = await submitContactForm(makeContactFormData())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Something went wrong')
    }
  })
})
