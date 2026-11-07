import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, MessageCircle, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — GameBoys" },
      { name: "description", content: "Review your GameBoys cart and check out." },
      { property: "og:title", content: "Your Cart — GameBoys" },
      { property: "og:description", content: "Send your order to GameBoys on WhatsApp." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { lines, total, setQty, orderLink, clear } = useCart();
  if (!lines.length)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl uppercase">Your cart is empty</h1>
        <Link to="/shop" className="btn mt-6 bg-primary text-primary-foreground">Go shopping</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl uppercase">Cart</h1>
      <div className="mt-6 divide-y rounded-xl border bg-card">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center gap-4 p-4">
            <img src={l.product.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-medium">{l.product.name}</p>
              <p className="text-sm text-accent">{formatPrice(l.product.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Less" onClick={() => setQty(l.id, l.qty - 1)} className="rounded-md bg-secondary p-2"><Minus className="h-4 w-4" /></button>
              <span className="w-6 text-center">{l.qty}</span>
              <button aria-label="More" onClick={() => setQty(l.id, l.qty + 1)} className="rounded-md bg-secondary p-2"><Plus className="h-4 w-4" /></button>
              <button aria-label="Remove" onClick={() => setQty(l.id, 0)} className="ml-2 p-2 text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button onClick={clear} className="text-sm text-muted-foreground hover:text-primary">Clear cart</button>
        <p className="font-display text-2xl">Total: <span className="text-primary">{formatPrice(total)}</span></p>
      </div>
      <Link to="/checkout" className="btn mt-6 w-full bg-primary py-4 text-primary-foreground">
        Checkout
      </Link>
      <a href={orderLink()} target="_blank" rel="noreferrer" className="btn mt-3 w-full border bg-secondary py-4 text-secondary-foreground">
        <MessageCircle className="h-5 w-5" /> Or order on WhatsApp
      </a>
    </div>
  );
}
