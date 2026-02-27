import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, formatDateLong } from '@/lib/format'

describe('formatPrice', () => {
  it('formats a standard price', () => {
    expect(formatPrice(12.99)).toBe('$12.99')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('formats with thousands separator', () => {
    expect(formatPrice(1000)).toBe('$1,000.00')
  })

  it('formats cents correctly', () => {
    expect(formatPrice(0.5)).toBe('$0.50')
  })
})

describe('formatDate', () => {
  it('formats a January date', () => {
    // Use noon UTC to avoid timezone rollover issues
    const result = formatDate('2025-01-15T12:00:00Z')
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2025')
  })

  it('formats a December date', () => {
    const result = formatDate('2025-12-15T12:00:00Z')
    expect(result).toContain('Dec')
    expect(result).toContain('15')
    expect(result).toContain('2025')
  })
})

describe('formatDateLong', () => {
  it('formats with full month name', () => {
    const result = formatDateLong('2025-01-15T12:00:00Z')
    expect(result).toContain('January')
    expect(result).toContain('15')
    expect(result).toContain('2025')
  })

  it('formats June correctly', () => {
    const result = formatDateLong('2025-06-15T12:00:00Z')
    expect(result).toContain('June')
    expect(result).toContain('2025')
  })
})
