import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { checkoutSchema } from "@/lib/orders";
import { GOVERNORATES, SHIPPING_FEE, formatPrice } from "@/lib/shop";
import { getPaymentOptions, placeOrder } from "@/lib/shop-api";

export const Route = createFileRoute("/checkout")({
  loader: () => getPaymentOptions(),
  head: () => ({
    meta: [
      { title: "Checkout — GameBoys" },
      { name: "description", content: "Complete your GameBoys order. Pay cash on delivery or by card." },
    ],
  }),
  component: Checkout,
});

type Form = { name: string; phone: string; email: string; governorate: string; address: string; notes: string };
const EMPTY: Form = { name: "", phone: "", email: "", governorate: "", address: "", notes: "" };
const input = "mt-1 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-ring";

function Field({ label, error, children }: { label: string; error: string | undefined; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-destructive">{error}</span>}
    </label>
  );
}

function Checkout() {
  const { card } = Route.useLoaderData();
  const { lines, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  if (!lines.length)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl uppercase">Your cart is empty</h1>
        <Link to="/shop" className="btn mt-6 bg-primary text-primary-foreground">Go shopping</Link>
      </div>
    );

  async function submit() {
    setFailure("");
    const parsed = checkoutSchema.safeParse({
      ...form,
      payment,
      items: lines.map((l) => ({ id: l.id, qty: l.qty })),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = String(i.path[0]);
        if (!errs[k]) errs[k] = i.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await placeOrder({ data: { ...form, payment, items: lines.map((l) => ({ id: l.id, qty: l.qty })) } });
      clear();
      if (res.checkoutUrl) window.location.assign(res.checkoutUrl);
      else await navigate({ to: "/order/$id", params: { id: res.id } });
    } catch (e) {
      console.error(e);
      setFailure("We couldn't place your order. Check your connection and try again, or order on WhatsApp.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl uppercase">Checkout</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Field label="Full name" error={errors["name"]}>
            <input className={input} value={form.name} onChange={set("name")} autoComplete="name" />
          </Field>
          <Field label="Mobile number (we confirm your order on this number)" error={errors["phone"]}>
            <input className={input} value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="01012345678" />
          </Field>
          <Field label="Email (optional)" error={errors["email"]}>
            <input className={input} value={form.email} onChange={set("email")} type="email" autoComplete="email" />
          </Field>
          <Field label="Governorate" error={errors["governorate"]}>
            <select className={input} value={form.governorate} onChange={set("governorate")}>
              <option value="">Choose…</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Full address (street, building, floor, landmark)" error={errors["address"]}>
            <textarea className={input} rows={3} value={form.address} onChange={set("address")} autoComplete="street-address" />
          </Field>
          <Field label="Notes (optional)" error={errors["notes"]}>
            <input className={input} value={form.notes} onChange={set("notes")} />
          </Field>

          <fieldset className="pt-2">
            <legend className="text-sm text-muted-foreground">Payment</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-xl border p-4 ${payment === "cod" ? "border-primary bg-card" : ""}`}>
                <input type="radio" name="payment" className="sr-only" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                <span className="font-display">Cash on delivery</span>
                <span className="mt-1 block text-sm text-muted-foreground">Pay the courier. We call or message you to confirm first.</span>
              </label>
              {card && (
                <label className={`cursor-pointer rounded-xl border p-4 ${payment === "card" ? "border-primary bg-card" : ""}`}>
                  <input type="radio" name="payment" className="sr-only" checked={payment === "card"} onChange={() => setPayment("card")} />
                  <span className="font-display">Card or mobile wallet</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Pay now on Paymob's secure page.</span>
                </label>
              )}
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-xl border bg-card p-5">
          <h2 className="text-lg uppercase">Your order</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>{l.qty} × {l.product.name}</span>
                <span className="shrink-0">{formatPrice(l.qty * l.product.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Subtotal</span>{formatPrice(total)}</p>
            <p className="flex justify-between"><span className="text-muted-foreground">Shipping</span>{SHIPPING_FEE ? formatPrice(SHIPPING_FEE) : "Free"}</p>
            <p className="flex justify-between pt-2 font-display text-lg"><span>Total</span><span className="text-primary">{formatPrice(total + SHIPPING_FEE)}</span></p>
          </div>
          {failure && <p className="mt-4 text-sm text-destructive">{failure}</p>}
          <button onClick={submit} disabled={busy} className="btn mt-5 w-full bg-primary py-4 text-primary-foreground disabled:opacity-60">
            {busy ? "Placing order…" : payment === "card" ? "Continue to payment" : "Place order"}
          </button>
        </aside>
      </div>
    </div>
  );
}
