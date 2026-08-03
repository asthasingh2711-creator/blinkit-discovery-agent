"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_CART, getProduct, type CartLine } from "@/lib/products";

/** Demo lock: max distinct product lines in cart */
export const MAX_CART_LINES = 10;

type CartContextValue = {
  lines: CartLine[];
  setQty: (productId: string, qty: number) => void;
  addProduct: (productId: string) => void;
  /** Replace entire cart (guided demo reset) */
  replaceCart: (productIds: string[]) => void;
  itemCount: number;
  subtotal: number;
  /** Briefly highlighted after Discovery / ADD */
  flashProductId: string | null;
  atLineLimit: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(DEMO_CART);
  const [flashProductId, setFlashProductId] = useState<string | null>(null);

  const flash = useCallback((productId: string) => {
    setFlashProductId(productId);
    window.setTimeout(() => setFlashProductId(null), 1200);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.productId !== productId);
      if (!prev.some((l) => l.productId === productId)) {
        if (prev.length >= MAX_CART_LINES) return prev;
        return [...prev, { productId, qty }];
      }
      return prev.map((l) =>
        l.productId === productId ? { ...l, qty } : l,
      );
    });
  }, []);

  const addProduct = useCallback(
    (productId: string) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === productId ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        if (prev.length >= MAX_CART_LINES) return prev;
        return [...prev, { productId, qty: 1 }];
      });
      flash(productId);
    },
    [flash],
  );

  const replaceCart = useCallback((productIds: string[]) => {
    setLines(
      productIds.slice(0, MAX_CART_LINES).map((productId) => ({
        productId,
        qty: 1,
      })),
    );
  }, []);

  const { itemCount, subtotal } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const line of lines) {
      const product = getProduct(line.productId);
      if (!product) continue;
      count += line.qty;
      total += product.price * line.qty;
    }
    return { itemCount: count, subtotal: total };
  }, [lines]);

  const atLineLimit = lines.length >= MAX_CART_LINES;

  const value = useMemo(
    () => ({
      lines,
      setQty,
      addProduct,
      replaceCart,
      itemCount,
      subtotal,
      flashProductId,
      atLineLimit,
    }),
    [
      lines,
      setQty,
      addProduct,
      replaceCart,
      itemCount,
      subtotal,
      flashProductId,
      atLineLimit,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
