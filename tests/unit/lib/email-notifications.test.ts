import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────

const { mockSendEmail, mockSendEmailAsync } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg_test' }),
  mockSendEmailAsync: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
  sendEmailAsync: mockSendEmailAsync,
}))

vi.mock('@/lib/env.server', () => ({
  getAdminEmail: vi.fn(() => 'admin@test.com'),
}))

import {
  notifyOrderConfirmation,
  notifyAdminNewOrder,
  notifyContactAutoReply,
  notifyAdminContactAlert,
  notifyOrderStatusUpdate,
} from '@/lib/email-notifications'
import type { OrderEmailProps, ContactEmailProps } from '@/emails/types'

// ─── Fixtures ─────────────────────────────────────────────

const orderProps: OrderEmailProps = {
  orderNumber: 'ORD-001',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  items: [
    {
      productName: 'Face Cream',
      variantName: null,
      quantity: 2,
      unitPrice: 29.99,
      totalPrice: 59.98,
    },
  ],
  subtotal: 59.98,
  shippingCost: 5.99,
  discountAmount: 0,
  total: 65.97,
  couponCode: null,
  shippingAddress: {
    name: 'Jane Doe',
    line1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'US',
  },
  orderDate: '2024-01-15T10:00:00Z',
}

const contactProps: ContactEmailProps = {
  name: 'John Smith',
  email: 'john@example.com',
  subject: 'Product inquiry',
  message: 'Is this product cruelty-free?',
}

// ─── Tests ────────────────────────────────────────────────

describe('notifyOrderConfirmation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fires async email to customer', () => {
    notifyOrderConfirmation(orderProps)

    expect(mockSendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: expect.stringContaining('ORD-001'),
      })
    )
  })
})

describe('notifyAdminNewOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fires async email to admin', () => {
    notifyAdminNewOrder(orderProps)

    expect(mockSendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@test.com',
        subject: expect.stringContaining('ORD-001'),
      })
    )
  })

  it('includes total in subject', () => {
    notifyAdminNewOrder(orderProps)

    expect(mockSendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('$65.97'),
      })
    )
  })
})

describe('notifyContactAutoReply', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends awaitable email to customer', async () => {
    const result = await notifyContactAutoReply(contactProps)

    expect(result.success).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: expect.stringContaining('received your message'),
      })
    )
  })
})

describe('notifyAdminContactAlert', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends email to admin with replyTo set to customer', async () => {
    await notifyAdminContactAlert(contactProps)

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@test.com',
        replyTo: 'john@example.com',
        subject: expect.stringContaining('Product inquiry'),
      })
    )
  })

  it('handles null subject gracefully', async () => {
    await notifyAdminContactAlert({ ...contactProps, subject: null })

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('No subject'),
      })
    )
  })
})

describe('notifyOrderStatusUpdate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends email with default status message for shipped', async () => {
    await notifyOrderStatusUpdate('jane@example.com', {
      orderNumber: 'ORD-001',
      customerName: 'Jane Doe',
      newStatus: 'shipped',
    })

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: expect.stringContaining('Shipped'),
      })
    )
  })

  it('uses custom status message when provided', async () => {
    await notifyOrderStatusUpdate('jane@example.com', {
      orderNumber: 'ORD-002',
      customerName: 'Jane Doe',
      newStatus: 'delivered',
      statusMessage: 'Your parcel has arrived!',
    })

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
      })
    )
  })

  it('passes trackingUrl when provided', async () => {
    await notifyOrderStatusUpdate('jane@example.com', {
      orderNumber: 'ORD-003',
      customerName: 'Jane Doe',
      newStatus: 'shipped',
      trackingUrl: 'https://tracking.example.com/123',
    })

    expect(mockSendEmail).toHaveBeenCalled()
  })

  it('handles unknown status with generic message', async () => {
    await notifyOrderStatusUpdate('jane@example.com', {
      orderNumber: 'ORD-004',
      customerName: 'Jane Doe',
      newStatus: 'processing',
    })

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Processing'),
      })
    )
  })
})
