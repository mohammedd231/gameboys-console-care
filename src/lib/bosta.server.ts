// BOSTA — creates a delivery for an order and returns its tracking number.
// Env: BOSTA_API_KEY (Bosta dashboard → Settings → API Integration), BOSTA_BASE_URL (optional; default production
// https://app.bosta.co, use https://stg-app.bosta.co for testing), BOSTA_WEBHOOK_SECRET (optional, for status webhook).
// Written from public API notes (POST /api/v2/deliveries, header `Authorization: <key>`); verify on first real call.
import { codAmount, type Order } from "./orders";

const base = () => (process.env["BOSTA_BASE_URL"] || "https://app.bosta.co").replace(/\/$/, "");
export const bostaConfigured = () => Boolean(process.env["BOSTA_API_KEY"]);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { Authorization: process.env["BOSTA_API_KEY"] ?? "", "Content-Type": "application/json", ...(init.headers as object) },
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok || json?.success === false) throw new Error(`Bosta ${res.status}: ${json?.message ?? text.slice(0, 300)}`);
  return json as T;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const ALIASES: Record<string, string> = { qalyubia: "qalubia", kafrelsheikh: "kafrelsheikh", newvalley: "elwadielgedid", matrouh: "matruh", monufia: "menoufia", beheira: "elbehiera", sharqia: "elsharqia", dakahlia: "eldakahlia", gharbia: "elgharbia" };

/** Bosta wants its own city name/code; match our governorate against the live list. */
async function resolveCity(governorate: string): Promise<{ city: string }> {
  try {
    const res = await call<{ data?: any[] }>("/api/v2/cities");
    const want = ALIASES[norm(governorate)] ?? norm(governorate);
    const hit = (res.data ?? []).find((c) => [c.name, c.nameEn, c.code, c._id].filter(Boolean).some((v: string) => norm(String(v)) === want));
    if (hit) return { city: String(hit.code ?? hit._id ?? hit.name) };
  } catch {}
  return { city: governorate };
}

export async function createBostaDelivery(order: Order, webhookUrl?: string): Promise<{ trackingNumber: string }> {
  if (!bostaConfigured()) throw new Error("Bosta is not configured (BOSTA_API_KEY)");
  const c = order.customer;
  const [first, ...rest] = c.name.split(" ");
  const { city } = await resolveCity(c.governorate);
  const body = {
    type: 10,
    cod: codAmount(order),
    businessReference: order.id,
    notes: c.notes || undefined,
    webhookUrl,
    receiver: { firstName: first, lastName: rest.join(" ") || "-", phone: c.phone, email: c.email || undefined },
    dropOffAddress: { city, firstLine: c.address },
    specs: { packageDetails: { itemsCount: order.items.reduce((s, i) => s + i.qty, 0), description: order.items.map((i) => `${i.qty} x ${i.name}`).join(", ").slice(0, 200) } },
  };
  const res = await call<{ data?: { trackingNumber?: string } }>("/api/v2/deliveries?apiVersion=1", { method: "POST", body: JSON.stringify(body) });
  const trackingNumber = res.data?.trackingNumber;
  if (!trackingNumber) throw new Error("Bosta did not return a tracking number");
  return { trackingNumber };
}
