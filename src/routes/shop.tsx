import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, type Category } from "@/lib/shop";
import { useProducts } from "@/lib/cart";
import { ProductCard } from "@/components/Layout";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): { category?: Category | undefined } => ({
    category: CATEGORIES.includes(s["category"] as Category) ? (s["category"] as Category) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Consoles & Accessories — GameBoys" },
      { name: "description", content: "Browse PS5, PS4, Xbox consoles, controllers, games and accessories at GameBoys." },
      { property: "og:title", content: "Shop Consoles & Accessories — GameBoys" },
      { property: "og:description", content: "PS5, PS4, Xbox and accessories. Order on WhatsApp." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const PRODUCTS = useProducts();
  const list = category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS;
  const chip = (active: boolean) =>
    `rounded-full border px-5 py-2 font-display text-sm uppercase ${active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl uppercase">Shop</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/shop" search={{}} className={chip(!category)}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} to="/shop" search={{ category: c }} className={chip(category === c)}>{c}</Link>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
