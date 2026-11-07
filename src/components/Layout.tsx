import { Link } from "@tanstack/react-router";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { whatsappLink, formatPrice, productImage, type Product } from "@/lib/shop";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-[#0a2a80] via-[#1c0f6b] to-[#4a0f7a] shadow-lg">
      <div className="relative mx-auto max-w-6xl px-4 pb-2 pt-3">
        <Link to="/" className="mx-auto flex w-fit justify-center" aria-label="GameBoys home">
          <img src="/gameboys-logo.png" alt="GameBoys — since 1992" className="h-16 w-auto md:h-24" />
        </Link>
        <Link to="/cart" className="absolute right-4 top-4 rounded-full bg-white/15 p-3 backdrop-blur hover:bg-white/25 md:top-8" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        <nav className="mt-2 flex justify-center gap-5 border-t border-white/10 pt-2 sm:gap-10">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="font-display text-xs uppercase tracking-wide text-white/75 transition-colors hover:text-white sm:text-sm"
              activeProps={{ className: "!text-white border-b-2 border-primary" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <img src="/gameboys-logo.png" alt="GameBoys" className="h-20 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Consoles, accessories & repairs since 1992.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="font-display uppercase text-foreground">Visit us</p>
          <p className="mt-2">Roxy, Cairo</p>
        </div>
        <div className="text-sm">
          <p className="font-display uppercase">Order on WhatsApp</p>
          <a href={whatsappLink("Hello GameBoys!")} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-whatsapp">
            <MessageCircle className="h-4 w-4" /> +90 534 916 9555
          </a>
        </div>
      </div>
    </footer>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <div className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:border-accent hover:shadow-glow-blue">
      <div className="relative aspect-square overflow-hidden">
        <img src={productImage(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {p.tag && <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">{p.tag}</span>}
        <span className="absolute right-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs">{p.category}</span>
      </div>
      <div className="p-4">
        <h3 className="text-base leading-tight">{p.name}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-accent">{formatPrice(p.price)}</span>
          <button onClick={() => add(p.id)} className="btn bg-primary px-4 py-2 text-xs text-primary-foreground">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
