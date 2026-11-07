import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { STATUS_LABEL, orderWhatsappText, type OrderStatus } from "@/lib/orders";
import { formatPrice, whatsappLink } from "@/lib/shop";
import { retryPayment, trackOrder } from "@/lib/shop-api";

export const Route = createFileRoute("/order/$id")({
  loader: ({ params }) => trackOrder({ data: { id: params.id } }),
  head: () => ({
    meta: [{ title: "Your order — GameBoys" }, { name: "robots", content: "noindex" }],
  }),
  component: OrderPage,
});

const STEPS: OrderStatus[] = ["new", "confirmed", "shipped", "delivered"];

function OrderPage() {
  const order = Route.useLoaderData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!order)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl uppercase">Order not found</h1>
        <p className="mt-3 text-muted-foreground">Check the link, or message us on WhatsApp with your phone number.</p>
        <a href={whatsappLink("Hello GameBoys! I can't find my order.")} target="_blank" rel="noreferrer" className="btn mt-6 bg-whatsapp text-background">
          <MessageCircle className="h-5 w-5" /> WhatsApp us
        </a>
      </div>
    );

  const off = order.status === "cancelled" || order.status === "returned";
  const at = STEPS.indexOf(order.status);
  const needsPayment = order.payment === "card" && order.paymentStatus !== "paid" && !off;

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const { checkoutUrl } = await retryPayment({ data: { id: order!.id } });
      window.location.assign(checkoutUrl);
    } catch {
      setError("Couldn't open the payment page. Try again in a moment or message us on WhatsApp.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl uppercase">Thanks{order.firstName ? `, ${order.firstName}` : ""}</h1>
      <p className="mt-2 text-muted-foreground">
        Order <span className="font-display text-foreground">{order.id}</span> — keep this page to check your order.
      </p>

      {off ? (
        <p className="mt-6 rounded-xl border bg-card p-4">This order is {STATUS_LABEL[order.status].toLowerCase()}.</p>
      ) : (
        <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
          {STEPS.map((s, i) => (
            <li key={s}>
              <div className={`h-2 rounded-full ${i <= at ? "bg-primary" : "bg-secondary"}`} />
              <p className={`mt-2 ${i <= at ? "text-foreground" : "text-muted-foreground"}`}>{STATUS_LABEL[s]}</p>
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber && (
        <p className="mt-6 rounded-xl border bg-card p-4 text-sm">
          Courier tracking number: <span className="font-display">{order.trackingNumber}</span>
        </p>
      )}

      {needsPayment && (
        <div className="mt-6 rounded-xl border border-primary bg-card p-4">
          <p>Your card payment isn't complete yet.</p>
          <button onClick={pay} disabled={busy} className="btn mt-3 bg-primary text-primary-foreground disabled:opacity-60">
            {busy ? "Opening…" : "Pay now"}
          </button>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-card p-5">
        <ul className="space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>{i.qty} × {i.name}</span>
              <span className="shrink-0">{formatPrice(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          <p className="flex justify-between"><span className="text-muted-foreground">Shipping</span>{order.shipping ? formatPrice(order.shipping) : "Free"}</p>
          <p className="flex justify-between font-display text-lg"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></p>
          <p className="text-muted-foreground">
            {order.payment === "cod" ? "Pay the courier on delivery." : order.paymentStatus === "paid" ? "Paid by card." : "Card payment pending."}
            {" "}Delivery to {order.governorate}.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={whatsappLink(orderWhatsappText(order))} target="_blank" rel="noreferrer" className="btn bg-whatsapp text-background">
          <MessageCircle className="h-5 w-5" /> Message us about this order
        </a>
        <Link to="/shop" className="btn border bg-secondary text-secondary-foreground">Keep shopping</Link>
      </div>
    </div>
  );
}
