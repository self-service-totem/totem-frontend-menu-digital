import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, CartModifier, Product } from '@/types';

interface AddToCartInput {
  product: Product;
  quantity: number;
  note?: string;
  modifiers?: CartModifier[];
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  add: (input: AddToCartInput) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'ffresco.cart';

// A line is unique by product + chosen modifiers + free-text note, so the same
// dish with different customizations stays as separate rows.
const buildLineId = (productId: string, modifiers?: CartModifier[], note?: string) => {
  const mods = (modifiers ?? []).map((m) => m.optionId).sort().join(',');
  const trimmedNote = note?.trim() ?? '';
  return [productId, mods, trimmedNote].filter(Boolean).join('::');
};

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persist on every change so a refresh or tab-switch never loses the cart.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage indisponível */
    }
  }, [items]);

  const add = useCallback(({ product, quantity, note, modifiers }: AddToCartInput) => {
    if (quantity <= 0) return;
    const modifierPrice = (modifiers ?? []).reduce((s, m) => s + m.priceModifier, 0);
    const id = buildLineId(product.id, modifiers, note);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      const newItem: CartItem = {
        id,
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        basePrice: product.price,
        unitPrice: product.price + modifierPrice,
        quantity,
        note: note?.trim() ? note.trim() : undefined,
        modifiers: modifiers && modifiers.length > 0 ? modifiers : undefined,
      };
      return [...prev, newItem];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
    const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
    return { items, totalQuantity, subtotal, add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
