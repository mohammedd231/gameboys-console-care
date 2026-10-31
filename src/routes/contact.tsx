import { createFileRoute } from "@tanstack/react-router";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/shop";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact GameBoys — Roxy, Cairo" },
      { name: "description", content: "Visit GameBoys in Roxy or message us on WhatsApp." },
      { property: "og:title", content: "Contact GameBoys" },
      { property: "og:description", content: "Find our shop in Roxy or chat with us on WhatsApp." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const items = [
    { icon: MapPin, t: "Address", d: "Roxy, Cairo (full address coming soon)" },
    { icon: Phone, t: "Phone", d: "+90 534 916 9555" },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl uppercase">Get in <span className="text-primary">touch</span></h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {items.map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-xl border bg-card p-6">
            <I className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-3 font-display uppercase">{t}</p>
            <p className="mt-1 text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <a href={whatsappLink("Hello GameBoys!")} target="_blank" rel="noreferrer" className="btn mt-10 bg-whatsapp text-background">
        <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
      </a>
    </div>
  );
}
