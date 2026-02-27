import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    exception: vi.fn(),
  },
}))

import { sendEmail, sendEmailAsync } from '@/lib/email'
import { logger } from '@/lib/logger'
import { createElement } from 'react'

function mockReactElement() {
  return createElement('div', null, 'Test email')
}

// ─── Tests ────────────────────────────────────────────────

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends an email and returns success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_123' }, error: null })

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test Subject',
      react: mockReactElement(),
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('msg_123')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Test Subject',
        from: expect.stringContaining('Jirah Shop'),
      })
    )
  })

  it('returns failure when Resend returns an error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid recipient' },
    })

    const result = await sendEmail({
      to: 'bad@example.com',
      subject: 'Test',
      react: mockReactElement(),
    })

    expect(result.success).toBe(false)
    expect(result.messageId).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(
      'Email send failed',
      expect.objectContaining({ error: 'Invalid recipient' })
    )
  })

  it('returns failure and logs exception on network error', async () => {
    mockSend.mockRejectedValue(new Error('Network timeout'))

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      react: mockReactElement(),
    })

    expect(result.success).toBe(false)
    expect(logger.exception).toHaveBeenCalled()
  })

  it('passes replyTo when provided', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_456' }, error: null })

    await sendEmail({
      to: 'admin@example.com',
      subject: 'Contact',
      react: mockReactElement(),
      replyTo: 'customer@example.com',
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'customer@example.com',
      })
    )
  })

  it('handles array of recipients', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_789' }, error: null })

    const result = await sendEmail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Bulk',
      react: mockReactElement(),
    })

    expect(result.success).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['a@example.com', 'b@example.com'],
      })
    )
  })
})

describe('sendEmailAsync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not throw on send failure', () => {
    mockSend.mockRejectedValue(new Error('Fail'))

    expect(() =>
      sendEmailAsync({
        to: 'user@example.com',
        subject: 'Test',
        react: mockReactElement(),
      })
    ).not.toThrow()
  })

  it('calls sendEmail internally', () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_async' }, error: null })

    sendEmailAsync({
      to: 'user@example.com',
      subject: 'Async Test',
      react: mockReactElement(),
    })

    // sendEmail is called internally, which calls mockSend
    expect(mockSend).toHaveBeenCalled()
  })
})
