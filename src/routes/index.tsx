import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, Truck, ShieldCheck } from "lucide-react";
import { CATEGORIES, heroImage, repairImage } from "@/lib/shop";
import { useProducts } from "@/lib/cart";
import { ProductCard } from "@/components/Layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameBoys — PS5, PS4 & Xbox Shop and Repairs" },
      { name: "description", content: "Buy PS5, PS4, Xbox consoles, controllers and accessories, and book console repairs at GameBoys, since 1992." },
      { property: "og:title", content: "GameBoys — PS5, PS4 & Xbox Shop and Repairs" },
      { property: "og:description", content: "Consoles, accessories, games and maintenance. Order easily on WhatsApp." },
    ],
  }),
  component: Index,
});

function Index() {
  const PRODUCTS = useProducts();
  return (
    <>
      <section className="relative flex min-h-[min(56vw,100svh)] items-center overflow-hidden">
        <img src={heroImage} alt="Game console with controllers in red and blue light" width={1600} height={912} className="absolute inset-x-0 bottom-0 top-36 h-[calc(100%-9rem)] w-full object-cover object-[65%_top] md:inset-0 md:top-0 md:h-full md:object-top" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-60 md:pb-24 md:pt-40">
          <p className="font-display text-sm uppercase tracking-widest text-accent">Since 1992</p>
          <h1 className="mt-3 max-w-xl text-5xl uppercase leading-none md:text-7xl">
            Level up <span className="text-primary">your game</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">PS5, PS4, Xbox, accessories and expert repairs — all in one shop.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn bg-primary text-primary-foreground shadow-glow-red">Shop now</Link>
            <Link to="/maintenance" className="btn border border-accent bg-background/40 text-foreground">Book a repair</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Trusted since 1992", d: "Over 30 years serving gamers." },
          { icon: Truck, t: "Easy WhatsApp orders", d: "Pick, send, we confirm." },
          { icon: Wrench, t: "In-house repairs", d: "Consoles & controllers fixed fast." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="flex items-center gap-4 rounded-xl border bg-card p-5">
            <I className="h-8 w-8 text-primary" />
            <div>
              <p className="font-display text-sm uppercase">{t}</p>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c} to="/shop" search={{ category: c }} className="rounded-full border px-5 py-2 font-display text-sm uppercase hover:border-primary hover:text-primary">
              {c}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex items-end justify-between">
          <h2 className="text-3xl uppercase">Featured</h2>
          <Link to="/shop" className="text-sm text-accent hover:underline">View all →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {PRODUCTS.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid overflow-hidden rounded-2xl border bg-card md:grid-cols-2">
          <img src={repairImage} alt="Technician repairing a console" loading="lazy" width={1200} height={800} className="h-full w-full object-cover" />
          <div className="p-8 md:p-12">
            <h2 className="text-3xl uppercase">Console broken? <span className="text-primary">We fix it.</span></h2>
            <p className="mt-4 text-muted-foreground">Overheating, HDMI, controller drift, disc drive — our technicians repair PlayStation and Xbox consoles.</p>
            <Link to="/maintenance" className="btn mt-6 bg-accent text-accent-foreground shadow-glow-blue">See repair services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
