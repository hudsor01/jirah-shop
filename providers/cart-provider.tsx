"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import type { Cart, CartItem } from "@/types/database";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
} from "@/lib/constants";

const CART_STORAGE_KEY = "jirah-shop-cart";

type CartContextValue = {
  items: CartItem[];
  couponCode: string | null;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  freeShippingThreshold: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null,
    quantity: number
  ) => void;
  updateItemPrices: (
    updates: { product_id: string; variant_id: string | null; newPrice: number }[]
  ) => void;
  clearCart: () => void;
  setCoupon: (code: string | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): Cart {
  if (typeof window === "undefined") {
    return { items: [], coupon_code: null };
  }
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Cart;
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        coupon_code: parsed.coupon_code ?? null,
      };
    }
  } catch {
    // Corrupted data — start fresh
  }
  return { items: [], coupon_code: null };
}

function saveCart(cart: Cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function itemKey(productId: string, variantId: string | null) {
  return `${productId}::${variantId ?? ""}`;
}

type CartProviderProps = {
  children: React.ReactNode;
  shippingCost?: number;
  freeShippingThreshold?: number;
};

type CartStateInternal = {
  items: CartItem[];
  couponCode: string | null;
  hydrated: boolean;
};

export function CartProvider({
  children,
  shippingCost: shippingCostSetting = SHIPPING_COST,
  freeShippingThreshold: freeShippingThresholdSetting = FREE_SHIPPING_THRESHOLD,
}: CartProviderProps) {
  const [{ items, couponCode, hydrated }, setCartState] =
    useState<CartStateInternal>({ items: [], couponCode: null, hydrated: false });

  // Hydrate from localStorage on mount.
  // startTransition marks the update as non-urgent (correct for initial hydration)
  // and satisfies the rule by placing setState inside a callback, not at the top level.
  useEffect(() => {
    const cart = loadCart();
    startTransition(() => {
      setCartState({ items: cart.items, couponCode: cart.coupon_code, hydrated: true });
    });
  }, []);

  // Persist to localStorage when state changes (skip before hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveCart({ items, coupon_code: couponCode });
  }, [items, couponCode, hydrated]);

  const addItem = useCallback((newItem: CartItem) => {
    setCartState((prev) => {
      const key = itemKey(newItem.product_id, newItem.variant_id);
      const existing = prev.items.find(
        (i) => itemKey(i.product_id, i.variant_id) === key
      );
      const newItems = existing
        ? prev.items.map((i) =>
            itemKey(i.product_id, i.variant_id) === key
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          )
        : [...prev.items, newItem];
      return { ...prev, items: newItems };
    });
    toast.success(`Added to cart`, {
      description: newItem.name,
    });
  }, []);

  const removeItem = useCallback(
    (productId: string, variantId: string | null) => {
      const key = itemKey(productId, variantId);
      setCartState((prev) => {
        const item = prev.items.find(
          (i) => itemKey(i.product_id, i.variant_id) === key
        );
        if (item) {
          toast("Item removed from cart", {
            description: item.name,
          });
        }
        return {
          ...prev,
          items: prev.items.filter(
            (i) => itemKey(i.product_id, i.variant_id) !== key
          ),
        };
      });
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      if (quantity < 1) return;
      const key = itemKey(productId, variantId);
      setCartState((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          itemKey(i.product_id, i.variant_id) === key
            ? { ...i, quantity }
            : i
        ),
      }));
    },
    []
  );

  const updateItemPrices = useCallback(
    (updates: { product_id: string; variant_id: string | null; newPrice: number }[]) => {
      setCartState((prev) => {
        const updateMap = new Map(
          updates.map((u) => [itemKey(u.product_id, u.variant_id), u.newPrice])
        );
        return {
          ...prev,
          items: prev.items.map((i) => {
            const key = itemKey(i.product_id, i.variant_id);
            const newPrice = updateMap.get(key);
            return newPrice !== undefined ? { ...i, price: newPrice } : i;
          }),
        };
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartState((prev) => ({ ...prev, items: [], couponCode: null }));
    toast("Cart cleared");
  }, []);

  const setCoupon = useCallback((code: string | null) => {
    setCartState((prev) => ({ ...prev, couponCode: code }));
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const shippingCost = useMemo(
    () => (subtotal >= freeShippingThresholdSetting ? 0 : shippingCostSetting),
    [subtotal, shippingCostSetting, freeShippingThresholdSetting]
  );

  const total = useMemo(
    () => subtotal + shippingCost,
    [subtotal, shippingCost]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      couponCode,
      itemCount,
      subtotal,
      shippingCost,
      freeShippingThreshold: freeShippingThresholdSetting,
      total,
      addItem,
      removeItem,
      updateQuantity,
      updateItemPrices,
      clearCart,
      setCoupon,
    }),
    [
      items,
      couponCode,
      itemCount,
      subtotal,
      shippingCost,
      freeShippingThresholdSetting,
      total,
      addItem,
      removeItem,
      updateQuantity,
      updateItemPrices,
      clearCart,
      setCoupon,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
