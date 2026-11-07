import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { formatPrice, whatsappLink, type Product } from "./shop";

type Line = { id: string; qty: number };
type Ctx = {
  products: Product[];
  lines: (Line & { product: Product })[];
  count: number;
  total: number;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  orderLink: () => string;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "gameboys-cart";

export function CartProvider({ children, products }: { children: ReactNode; products: Product[] }) {
  const [raw, setRaw] = useState<Line[]>([]);
  useEffect(() => {
    try {
      setRaw(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {}
  }, []);
  const save = (next: Line[]) => {
    setRaw(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const lines = raw
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.id)! }))
    .filter((l) => l.product);
  const total = lines.reduce((s, l) => s + l.qty * l.product.price, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const value: Ctx = {
    products,
    lines,
    count,
    total,
    add: (id) => {
      const ex = raw.find((l) => l.id === id);
      save(ex ? raw.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...raw, { id, qty: 1 }]);
    },
    setQty: (id, qty) => save(qty <= 0 ? raw.filter((l) => l.id !== id) : raw.map((l) => (l.id === id ? { ...l, qty } : l))),
    clear: () => save([]),
    orderLink: () =>
      whatsappLink(
        `Hello GameBoys! I'd like to order:\n` +
          lines.map((l) => `• ${l.qty} x ${l.product.name} — ${formatPrice(l.qty * l.product.price)}`).join("\n") +
          `\nTotal: ${formatPrice(total)}`,
      ),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export const useProducts = () => useCart().products;
