// PRODUCT STORE — Supabase table public.shop_products + public storage bucket "product-images".
// Same REST approach as orders.server.ts. In local dev without Supabase it serves the sample catalog.
import { CATEGORIES, SAMPLE_PRODUCTS, type Product } from "./shop";

const url = () => (process.env["SUPABASE_URL"] ?? "").replace(/\/$/, "");
const key = () => process.env["SUPABASE_SECRET_KEY"] ?? "";
const configured = () => Boolean(url() && key());

type Row = { id: string; name: string; category: Product["category"]; price: number; image: string; tag: string; active: boolean; sort: number };
const fromRow = (r: Row): Product => ({ id: r.id, name: r.name, category: r.category, price: r.price, image: r.image, tag: r.tag || undefined, active: r.active, sort: r.sort });

function headers(extra: Record<string, string> = {}) {
  const k = key();
  const h: Record<string, string> = { apikey: k, ...extra };
  if (!k.startsWith("sb_")) h["Authorization"] = `Bearer ${k}`;
  return h;
}
async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${url()}/rest/v1/${path}`, {
    ...init,
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers as object) }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

const g = globalThis as unknown as { __gbProducts?: Product[] };
function mem() {
  if (configured()) return null;
  if (process.env["NODE_ENV"] === "production") throw new Error("Supabase is not configured");
  return (g.__gbProducts ??= SAMPLE_PRODUCTS.map((p, i) => ({ ...p, active: true, sort: i + 1 })));
}

export async function listProducts(includeHidden = false): Promise<Product[]> {
  const m = mem();
  const all = m ?? (await rest<Row[]>("shop_products?select=*&order=sort.asc,created_at.asc&limit=1000")).map(fromRow);
  return includeHidden ? all : all.filter((p) => p.active !== false);
}

export function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function saveProduct(p: Product): Promise<Product> {
  if (!CATEGORIES.includes(p.category)) throw new Error("Bad category");
  const m = mem();
  if (m) {
    const i = m.findIndex((x) => x.id === p.id);
    if (i >= 0) m[i] = p;
    else m.push(p);
    return p;
  }
  const row: Row = { id: p.id, name: p.name, category: p.category, price: p.price, image: p.image, tag: p.tag ?? "", active: p.active !== false, sort: p.sort ?? 0 };
  const rows = await rest<Row[]>("shop_products?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  return fromRow(rows[0]!);
}

export async function deleteProduct(id: string) {
  const m = mem();
  if (m) {
    const i = m.findIndex((x) => x.id === id);
    if (i >= 0) m.splice(i, 1);
    return;
  }
  await rest<Row[]>(`shop_products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Uploads a JPEG/PNG/WebP to the public bucket and returns its public URL. */
export async function uploadProductImage(base64: string, contentType: string): Promise<string> {
  if (!configured()) throw new Error("Image upload needs Supabase configured");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  if (bytes.length > 3_000_000) throw new Error("Image too large");
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${url()}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "false" }),
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${await res.text()}`);
  return `${url()}/storage/v1/object/public/product-images/${path}`;
}
