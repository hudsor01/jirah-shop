import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

import { CartProvider, useCart } from '@/providers/cart-provider'
import type { CartItem } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────

const CART_STORAGE_KEY = 'jirah-shop-cart'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider shippingCost={5.99} freeShippingThreshold={50}>
      {children}
    </CartProvider>
  )
}

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: 'prod-001',
    variant_id: null,
    name: 'Test Product',
    price: 25,
    quantity: 1,
    image: 'https://example.com/img.jpg',
    slug: 'test-product',
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────

describe('CartProvider / useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('throws when useCart is used outside CartProvider', () => {
    // Suppress console.error from React for this expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      renderHook(() => useCart())
    }).toThrow('useCart must be used within a CartProvider')
    spy.mockRestore()
  })

  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.itemCount).toBe(0)
    expect(result.current.subtotal).toBe(0)
    expect(result.current.couponCode).toBeNull()
  })

  // ─── addItem ──────────────────────────────────────────

  describe('addItem', () => {
    it('adds a new item to cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem())
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].name).toBe('Test Product')
      })
    })

    it('increments quantity for existing item (same product_id + variant_id)', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ quantity: 1 }))
      })
      act(() => {
        result.current.addItem(makeItem({ quantity: 2 }))
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].quantity).toBe(3)
      })
    })

    it('treats different variant_id as separate items', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ variant_id: null }))
      })
      act(() => {
        result.current.addItem(makeItem({ variant_id: 'var-001' }))
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2)
      })
    })
  })

  // ─── removeItem ───────────────────────────────────────

  describe('removeItem', () => {
    it('removes item from cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem())
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
      })

      act(() => {
        result.current.removeItem('prod-001', null)
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })
    })

    it('handles non-existent item gracefully', () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.removeItem('nonexistent', null)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  // ─── updateQuantity ───────────────────────────────────

  describe('updateQuantity', () => {
    it('changes item quantity', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ quantity: 1 }))
      })

      act(() => {
        result.current.updateQuantity('prod-001', null, 5)
      })

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(5)
      })
    })

    it('ignores quantity < 1', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ quantity: 2 }))
      })

      act(() => {
        result.current.updateQuantity('prod-001', null, 0)
      })

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(2)
      })
    })
  })

  // ─── updateItemPrices ─────────────────────────────────

  describe('updateItemPrices', () => {
    it('updates prices for matching items', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 10 }))
      })

      act(() => {
        result.current.updateItemPrices([
          { product_id: 'prod-001', variant_id: null, newPrice: 15 },
        ])
      })

      await waitFor(() => {
        expect(result.current.items[0].price).toBe(15)
      })
    })
  })

  // ─── clearCart ────────────────────────────────────────

  describe('clearCart', () => {
    it('empties all items and resets coupon', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem())
        result.current.setCoupon('SAVE10')
      })

      act(() => {
        result.current.clearCart()
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
        expect(result.current.couponCode).toBeNull()
      })
    })
  })

  // ─── setCoupon ────────────────────────────────────────

  describe('setCoupon', () => {
    it('sets coupon code', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.setCoupon('SAVE20')
      })

      await waitFor(() => {
        expect(result.current.couponCode).toBe('SAVE20')
      })
    })

    it('clears coupon when set to null', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.setCoupon('SAVE20')
      })

      act(() => {
        result.current.setCoupon(null)
      })

      await waitFor(() => {
        expect(result.current.couponCode).toBeNull()
      })
    })
  })

  // ─── Computed values ──────────────────────────────────

  describe('computed values', () => {
    it('itemCount sums all quantities', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ product_id: 'p1', quantity: 2 }))
        result.current.addItem(makeItem({ product_id: 'p2', quantity: 3 }))
      })

      await waitFor(() => {
        expect(result.current.itemCount).toBe(5)
      })
    })

    it('subtotal computes price * quantity sum', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ product_id: 'p1', price: 10, quantity: 2 }))
        result.current.addItem(makeItem({ product_id: 'p2', price: 5, quantity: 3 }))
      })

      await waitFor(() => {
        // 10*2 + 5*3 = 35
        expect(result.current.subtotal).toBe(35)
      })
    })

    it('shippingCost is 0 when subtotal >= freeShippingThreshold', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 60, quantity: 1 }))
      })

      await waitFor(() => {
        expect(result.current.shippingCost).toBe(0)
      })
    })

    it('shippingCost equals shippingCostSetting when subtotal < freeShippingThreshold', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 10, quantity: 1 }))
      })

      await waitFor(() => {
        expect(result.current.shippingCost).toBe(5.99)
      })
    })

    it('total equals subtotal + shippingCost', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 10, quantity: 1 }))
      })

      await waitFor(() => {
        // 10 + 5.99 shipping = 15.99
        expect(result.current.total).toBe(15.99)
      })
    })

    it('total equals subtotal when free shipping applies', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 100, quantity: 1 }))
      })

      await waitFor(() => {
        expect(result.current.total).toBe(100)
      })
    })
  })

  // ─── localStorage persistence ─────────────────────────

  describe('localStorage persistence', () => {
    it('saves cart to localStorage on item change', async () => {
      const { result } = renderHook(() => useCart(), { wrapper })

      // Wait for hydration
      await waitFor(() => {
        expect(result.current.items).toEqual([])
      })

      act(() => {
        result.current.addItem(makeItem())
      })

      await waitFor(() => {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed.items).toHaveLength(1)
      })
    })

    it('loads cart from localStorage on mount (hydration)', async () => {
      // Pre-populate localStorage
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items: [makeItem({ name: 'Persisted Item', quantity: 3 })],
          coupon_code: 'WELCOME',
        })
      )

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].name).toBe('Persisted Item')
        expect(result.current.items[0].quantity).toBe(3)
        expect(result.current.couponCode).toBe('WELCOME')
      })
    })

    it('handles corrupted localStorage gracefully', async () => {
      localStorage.setItem(CART_STORAGE_KEY, 'not-valid-json{{{')

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toEqual([])
      })
    })

    it('handles missing localStorage gracefully', () => {
      // No localStorage entry set
      const { result } = renderHook(() => useCart(), { wrapper })
      expect(result.current.items).toEqual([])
    })
  })

  // ─── Props ────────────────────────────────────────────

  describe('props', () => {
    it('accepts custom shippingCost prop', async () => {
      function customWrapper({ children }: { children: React.ReactNode }) {
        return (
          <CartProvider shippingCost={9.99} freeShippingThreshold={100}>
            {children}
          </CartProvider>
        )
      }

      const { result } = renderHook(() => useCart(), { wrapper: customWrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 10, quantity: 1 }))
      })

      await waitFor(() => {
        expect(result.current.shippingCost).toBe(9.99)
      })
    })

    it('accepts custom freeShippingThreshold prop', async () => {
      function customWrapper({ children }: { children: React.ReactNode }) {
        return (
          <CartProvider shippingCost={5.99} freeShippingThreshold={25}>
            {children}
          </CartProvider>
        )
      }

      const { result } = renderHook(() => useCart(), { wrapper: customWrapper })

      act(() => {
        result.current.addItem(makeItem({ price: 30, quantity: 1 }))
      })

      await waitFor(() => {
        expect(result.current.shippingCost).toBe(0)
        expect(result.current.freeShippingThreshold).toBe(25)
      })
    })
  })
})
