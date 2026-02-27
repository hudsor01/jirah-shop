import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { CartProvider } from '@/providers/cart-provider'
import type { CartItem } from '@/types/database'

const CART_STORAGE_KEY = 'jirah-shop-cart'

type CartRenderOptions = RenderOptions & {
  initialItems?: CartItem[]
  initialCoupon?: string | null
  shippingCost?: number
  freeShippingThreshold?: number
}

/**
 * Renders a component wrapped in CartProvider.
 *
 * Optionally pre-populates localStorage with initial cart items
 * so the provider hydrates with data.
 */
export function renderWithCart(
  ui: React.ReactElement,
  {
    initialItems = [],
    initialCoupon = null,
    shippingCost,
    freeShippingThreshold,
    ...renderOptions
  }: CartRenderOptions = {}
) {
  // Pre-populate localStorage before render
  if (initialItems.length > 0 || initialCoupon) {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: initialItems,
        coupon_code: initialCoupon,
      })
    )
  } else {
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CartProvider
        shippingCost={shippingCost}
        freeShippingThreshold={freeShippingThreshold}
      >
        {children}
      </CartProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Creates a CartProvider wrapper function for use with renderHook.
 */
export function createCartWrapper(options?: {
  shippingCost?: number
  freeShippingThreshold?: number
}) {
  return function CartWrapper({ children }: { children: React.ReactNode }) {
    return (
      <CartProvider
        shippingCost={options?.shippingCost}
        freeShippingThreshold={options?.freeShippingThreshold}
      >
        {children}
      </CartProvider>
    )
  }
}
