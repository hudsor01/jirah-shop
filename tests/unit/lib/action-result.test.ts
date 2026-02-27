import { describe, it, expect } from 'vitest'
import { ok, fail } from '@/lib/action-result'
import type { ActionResult } from '@/lib/action-result'

describe('ok()', () => {
  it('returns success result with data', () => {
    const result = ok({ id: '123', name: 'Test' })
    expect(result).toEqual({ success: true, data: { id: '123', name: 'Test' } })
  })

  it('returns success result with null data', () => {
    const result = ok(null)
    expect(result).toEqual({ success: true, data: null })
  })
})

describe('fail()', () => {
  it('returns failure result with error message', () => {
    const result = fail('Something went wrong')
    expect(result).toEqual({ success: false, error: 'Something went wrong' })
  })
})

describe('type narrowing', () => {
  it('discriminates on success field', () => {
    const result: ActionResult<{ id: string }> = ok({ id: '123' })

    if (result.success) {
      // TypeScript should allow accessing .data here
      expect(result.data.id).toBe('123')
    } else {
      // This branch should not be reached
      expect.unreachable('Should not reach error branch')
    }
  })
})
