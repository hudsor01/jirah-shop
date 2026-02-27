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

vi.mock('@/queries/settings', () => ({
  queryShopSettings: vi.fn(() =>
    Promise.resolve({
      id: 'settings-001',
      shipping_cost: 5.99,
      free_shipping_threshold: 50,
      allowed_shipping_countries: ['US', 'CA'],
    })
  ),
}))

import { getShopSettings, updateShopSettings } from '@/actions/settings'
import { requireAdmin } from '@/lib/auth'
import { queryShopSettings } from '@/queries/settings'

const validSettingsForm = {
  shipping_cost: 5.99,
  free_shipping_threshold: 50,
  allowed_shipping_countries: ['US', 'CA'],
}

describe('getShopSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns settings from queryShopSettings', async () => {
    const result = await getShopSettings()
    expect(result).toBeDefined()
    expect(result.shipping_cost).toBe(5.99)
    expect(queryShopSettings).toHaveBeenCalled()
  })
})

describe('updateShopSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('succeeds with valid ID and form data', async () => {
    const result = await updateShopSettings(
      'a0000000-0000-4000-a000-000000000001',
      validSettingsForm
    )
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID', async () => {
    const result = await updateShopSettings('bad-id', validSettingsForm)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid settings ID')
    }
  })

  it('fails with negative shipping cost', async () => {
    const result = await updateShopSettings('a0000000-0000-4000-a000-000000000001', {
      ...validSettingsForm,
      shipping_cost: -1,
    })
    expect(result.success).toBe(false)
  })

  it('fails with empty countries array', async () => {
    const result = await updateShopSettings('a0000000-0000-4000-a000-000000000001', {
      ...validSettingsForm,
      allowed_shipping_countries: [],
    })
    expect(result.success).toBe(false)
  })

  it('fails when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'))
    await expect(
      updateShopSettings('a0000000-0000-4000-a000-000000000001', validSettingsForm)
    ).rejects.toThrow('Forbidden')
  })

  it('fails when DB update errors', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      }),
    })
    const result = await updateShopSettings(
      'a0000000-0000-4000-a000-000000000001',
      validSettingsForm
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('DB error')
    }
  })
})
