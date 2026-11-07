import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Copy, Download, LogOut, MessageCircle, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PAYMENT_STATUSES,
  STATUSES,
  STATUS_LABEL,
  bostaText,
  codAmount,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";
import { formatPrice } from "@/lib/shop";
import { adminListOrders, adminLogin, adminLogout, adminSession, adminUpdateOrder } from "@/lib/shop-api";

export const Route = createFileRoute("/admin")({
  loader: () => adminSession(),
  head: () => ({ meta: [{ title: "Admin — GameBoys" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Admin,
});

const field = "w-full rounded-lg border bg-background px-3 py-2 outline-none focus:border-ring";
const BADGE: Record<OrderStatus, string> = {
  new: "bg-primary text-primary-foreground",
  confirmed: "bg-accent text-accent-foreground",
  shipped: "bg-secondary text-secondary-foreground",
  delivered: "bg-whatsapp text-background",
  cancelled: "bg-muted text-muted-foreground",
  returned: "bg-muted text-muted-foreground",
};
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function Admin() {
  const { ok } = Route.useLoaderData();
  return ok ? <Dashboard /> : <Login />;
}

function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await adminLogin({ data: { password } });
      if (res.ok) await router.invalidate();
      else setError("Wrong password.");
    } catch {
      setError("Admin login isn't set up yet. Set ADMIN_PASSWORD and ADMIN_SECRET on the server.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-3xl uppercase">Admin</h1>
      <input
        className={`${field} mt-6`}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        autoComplete="current-password"
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button onClick={submit} disabled={busy || !password} className="btn mt-4 w-full bg-primary text-primary-foreground disabled:opacity-60">
        Sign in
      </button>
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => adminListOrders(),
    refetchInterval: 30_000,
  });
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (!s || [o.id, o.customer.name, o.customer.phone].some((v) => v.toLowerCase().includes(s))),
    );
  }, [orders, filter, q]);

  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const open = orders.find((o) => o.id === openId) ?? null;

  async function logout() {
    await adminLogout();
    await router.invalidate();
  }

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Order", "Date", "Status", "Payment", "Paid", "Name", "Phone", "Governorate", "Address", "Items", "Total", "COD amount", "Tracking"],
      ...shown.map((o) => [
        o.id, o.createdAt, o.status, o.payment, o.paymentStatus, o.customer.name, o.customer.phone,
        o.customer.governorate, o.customer.address, o.items.map((i) => `${i.qty} x ${i.name}`).join("; "),
        o.total, codAmount(o), o.trackingNumber,
      ]),
    ];
    const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gameboys-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl uppercase">Orders</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn border bg-secondary px-4 py-2 text-xs text-secondary-foreground"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={logout} className="btn border bg-secondary px-4 py-2 text-xs text-secondary-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {([["New", count("new")], ["To ship", count("confirmed")], ["On the way", count("shipped")]] as const).map(([label, n]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="font-display text-3xl">{n}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-sm ${filter === s ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
        <input className={`${field} ml-auto max-w-xs`} placeholder="Search name, phone or order ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-4 divide-y rounded-xl border bg-card">
        {isLoading && <p className="p-6 text-muted-foreground">Loading orders…</p>}
        {error && <p className="p-6 text-destructive">Couldn't load orders. Refresh the page and sign in again.</p>}
        {!isLoading && !error && !shown.length && <p className="p-6 text-muted-foreground">No orders yet. New orders appear here automatically.</p>}
        {shown.map((o) => (
          <button key={o.id} onClick={() => setOpenId(o.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left hover:bg-muted/40 sm:grid-cols-[8rem_1fr_9rem_7rem]">
            <span className="font-display text-sm">{o.id}</span>
            <span className="col-span-2 order-last text-sm text-muted-foreground sm:order-none sm:col-span-1">
              {o.customer.name} · {o.customer.governorate} · {o.items.reduce((s, i) => s + i.qty, 0)} item(s)
            </span>
            <span className="hidden text-sm sm:block">{formatPrice(o.total)}<br /><span className="text-xs text-muted-foreground">{o.payment === "cod" ? "Cash on delivery" : o.paymentStatus === "paid" ? "Card, paid" : "Card, unpaid"} · {when(o.createdAt)}</span></span>
            <span className={`justify-self-end rounded-full px-3 py-1 text-xs font-bold ${BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {open && (
            <OrderDetail
              key={open.id + open.status + open.paymentStatus}
              order={open}
              onSaved={async () => {
                await qc.invalidateQueries({ queryKey: ["admin-orders"] });
                setOpenId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({ order, onSaved }: { order: Order; onSaved: () => Promise<void> }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [trackingNumber, setTracking] = useState(order.trackingNumber);
  const [adminNote, setNote] = useState(order.adminNote);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const c = order.customer;
  const cod = codAmount(order);

  async function copyBosta() {
    await navigator.clipboard.writeText(bostaText(order));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await adminUpdateOrder({ data: { id: order.id, status, paymentStatus, trackingNumber, adminNote } });
      await onSaved();
    } catch {
      setError("Couldn't save. Refresh the page and sign in again.");
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">{order.id}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">{when(order.createdAt)}</p>

      <div className="rounded-xl border p-4 text-sm">
        <p className="font-display text-base">{c.name}</p>
        <p className="mt-1">{c.phone}</p>
        <p className="mt-1">{c.governorate} — {c.address}</p>
        {c.email && <p className="mt-1 text-muted-foreground">{c.email}</p>}
        {c.notes && <p className="mt-2 text-muted-foreground">Customer note: {c.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${c.phone}`} className="btn border bg-secondary px-3 py-2 text-xs text-secondary-foreground"><Phone className="h-4 w-4" /> Call</a>
          <a href={`https://wa.me/2${c.phone}`} target="_blank" rel="noreferrer" className="btn bg-whatsapp px-3 py-2 text-xs text-background"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        </div>
      </div>

      <div className="rounded-xl border p-4 text-sm">
        <ul className="space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3"><span>{i.qty} × {i.name}</span><span>{formatPrice(i.qty * i.price)}</span></li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t pt-3 font-display"><span>Total</span><span>{formatPrice(order.total)}</span></p>
        <p className="mt-1 text-muted-foreground">
          {order.payment === "cod" ? "Cash on delivery" : "Card / wallet"} · Collect from customer: <span className="text-foreground">{formatPrice(cod)}</span>
        </p>
      </div>

      <button onClick={copyBosta} className="btn border bg-secondary text-secondary-foreground">
        <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy details for Bosta"}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Order status
          <select className={`${field} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="text-sm">Payment
          <select className={`${field} mt-1`} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
      </div>
      <label className="text-sm">Courier tracking number
        <input className={`${field} mt-1`} value={trackingNumber} onChange={(e) => setTracking(e.target.value)} />
      </label>
      <label className="text-sm">Internal note (customers can't see this)
        <textarea className={`${field} mt-1`} rows={2} value={adminNote} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={save} disabled={busy} className="btn bg-primary text-primary-foreground disabled:opacity-60">
        {busy ? "Saving…" : "Save changes"}
      </button>
    </>
  );
}
