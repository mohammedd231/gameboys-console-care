// ORDER STORE — Supabase (table: public.shop_orders), called over plain REST so no
// extra npm package is needed. The table has row-level security with NO policies,
// so only this server (using the secret key) can read or write orders.
//
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY  (server only — never expose to the browser)
// Without them, local dev falls back to in-memory storage; production throws.
import type { Order, OrderItem, PaymentMethod, PublicOrder } from "./orders";

const url = () => (process.env["SUPABASE_URL"] ?? "").replace(/\/$/, "");
const key = () => process.env["SUPABASE_SECRET_KEY"] ?? "";
const configured = () => Boolean(url() && key());

type Row = {
  id: string;
  created_at: string;
  status: Order["status"];
  payment: Order["payment"];
  payment_status: Order["paymentStatus"];
  customer: Order["customer"];
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  tracking_number: string;
  admin_note: string;
  paymob_txn_id: string;
};

const toRow = (o: Order): Row => ({
  id: o.id,
  created_at: o.createdAt,
  status: o.status,
  payment: o.payment,
  payment_status: o.paymentStatus,
  customer: o.customer,
  items: o.items,
  subtotal: o.subtotal,
  shipping: o.shipping,
  total: o.total,
  tracking_number: o.trackingNumber,
  admin_note: o.adminNote,
  paymob_txn_id: o.paymobTxnId,
});

const fromRow = (r: Row): Order => ({
  id: r.id,
  createdAt: r.created_at,
  status: r.status,
  payment: r.payment,
  paymentStatus: r.payment_status,
  customer: r.customer,
  items: r.items,
  subtotal: r.subtotal,
  shipping: r.shipping,
  total: r.total,
  trackingNumber: r.tracking_number,
  adminNote: r.admin_note,
  paymobTxnId: r.paymob_txn_id,
});

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const k = key();
  // New-style secret keys (sb_secret_...) go in `apikey` only; legacy JWT keys also need Bearer.
  const headers: Record<string, string> = {
    apikey: k,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (!k.startsWith("sb_")) headers["Authorization"] = `Bearer ${k}`;
  const res = await fetch(`${url()}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// ---- local-dev fallback (memory) ----
const g = globalThis as unknown as { __gbOrders?: Map<string, Order> };
const mem: Map<string, Order> = (g.__gbOrders ??= new Map());
function useMemory() {
  if (configured()) return false;
  if (process.env["NODE_ENV"] === "production") throw new Error("Supabase is not configured (SUPABASE_URL, SUPABASE_SECRET_KEY)");
  return true;
}

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "GB-" + Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10).toUpperCase();
}

export type NewOrder = {
  customer: Order["customer"];
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

export async function createOrder(input: NewOrder): Promise<Order> {
  const order: Order = {
    id: newId(),
    createdAt: new Date().toISOString(),
    status: "new",
    paymentStatus: "unpaid",
    trackingNumber: "",
    adminNote: "",
    paymobTxnId: "",
    ...input,
  };
  if (useMemory()) {
    mem.set(order.id, order);
    return order;
  }
  await rest<Row[]>("shop_orders", { method: "POST", body: JSON.stringify(toRow(order)) });
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (useMemory()) return mem.get(id) ?? null;
  const rows = await rest<Row[]>(`shop_orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function listOrders(): Promise<Order[]> {
  if (useMemory()) return [...mem.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = await rest<Row[]>("shop_orders?select=*&order=created_at.desc&limit=500");
  return rows.map(fromRow);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
  if (useMemory()) {
    const cur = mem.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch, id: cur.id } as Order;
    mem.set(id, next);
    return next;
  }
  const body: Partial<Row> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.paymentStatus !== undefined) body.payment_status = patch.paymentStatus;
  if (patch.trackingNumber !== undefined) body.tracking_number = patch.trackingNumber;
  if (patch.adminNote !== undefined) body.admin_note = patch.adminNote;
  if (patch.paymobTxnId !== undefined) body.paymob_txn_id = patch.paymobTxnId;
  const rows = await rest<Row[]>(`shop_orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  return rows[0] ? fromRow(rows[0]) : null;
}

export function toPublic(o: Order): PublicOrder {
  return {
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    payment: o.payment,
    paymentStatus: o.paymentStatus,
    items: o.items,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    trackingNumber: o.trackingNumber,
    firstName: o.customer.name.split(" ")[0] ?? "",
    governorate: o.customer.governorate,
  };
}
