import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { SERVICES, formatPrice, whatsappLink, repairImage } from "@/lib/shop";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Console Repair & Maintenance — GameBoys" },
      { name: "description", content: "PS5, PS4 and Xbox repairs: cleaning, HDMI, controllers, disc drives and more." },
      { property: "og:title", content: "Console Repair & Maintenance — GameBoys" },
      { property: "og:description", content: "Book a PlayStation or Xbox repair on WhatsApp." },
    ],
  }),
  component: Maintenance,
});

function Maintenance() {
  const [device, setDevice] = useState("PS5");
  const [issue, setIssue] = useState("");
  const [name, setName] = useState("");
  const link = whatsappLink(`Hello GameBoys! I need a repair.\nName: ${name}\nDevice: ${device}\nProblem: ${issue}`);
  const field = "w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-accent";
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl uppercase md:text-5xl">Repair <span className="text-primary">&</span> maintenance</h1>
          <p className="mt-4 text-muted-foreground">Bring your console back to life. Starting prices below — final price after inspection.</p>
        </div>
        <img src={repairImage} alt="Console repair" width={1200} height={800} className="rounded-2xl border" />
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="rounded-xl border bg-card p-6 hover:border-primary">
            <h3 className="text-lg">{s.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            <p className="mt-4 font-display text-accent">From {formatPrice(s.from)}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-xl rounded-2xl border bg-card p-8">
        <h2 className="text-2xl uppercase">Book a repair</h2>
        <div className="mt-6 space-y-4">
          <input className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={field} value={device} onChange={(e) => setDevice(e.target.value)}>
            {["PS5", "PS4", "Xbox Series X/S", "Xbox One", "Controller", "Other"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <textarea className={field} rows={4} placeholder="What's the problem?" value={issue} onChange={(e) => setIssue(e.target.value)} />
          <a href={link} target="_blank" rel="noreferrer" className="btn w-full bg-whatsapp text-background">
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
