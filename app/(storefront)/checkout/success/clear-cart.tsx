"use client";

import { useEffect } from "react";
import { useCart } from "@/providers/cart-provider";

export function ClearCartOnSuccess({ sessionId }: { sessionId: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
    const key = `cart-cleared:${sessionId}`;
    if (sessionStorage.getItem(key)) return;
    clearCart();
    sessionStorage.setItem(key, "1");
  }, [sessionId, clearCart]);

  return null;
}
