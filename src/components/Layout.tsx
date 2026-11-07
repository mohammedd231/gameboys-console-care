import { Link } from "@tanstack/react-router";
import { ShoppingCart, MessageCircle } from "lucide-react";
import logo from "@/assets/gameboys-logo.jpeg.asset.json";
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
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="GameBoys logo" className="h-12 w-auto rounded-md bg-logo-bg p-1" />
        </Link>
        <nav className="hidden gap-6 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="font-display text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/cart" className="relative rounded-full bg-secondary p-3 hover:bg-muted" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>
      <nav className="flex justify-around border-t py-2 md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="text-xs font-display uppercase text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <img src={logo.url} alt="GameBoys" className="h-16 rounded-md bg-logo-bg p-1" />
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
