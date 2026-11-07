import { createFileRoute } from "@tanstack/react-router";
import { getOrder, updateOrder } from "@/lib/orders.server";
import { verifyPaymobHmac } from "@/lib/paymob.server";

type Txn = {
  id?: number;
  success?: boolean;
  pending?: boolean;
  amount_cents?: number;
  merchant_order_id?: string;
  order?: { merchant_order_id?: string };
};

// Paymob POSTs the payment result here. Nothing is trusted until the HMAC checks out.
export const Route = createFileRoute("/api/paymob/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const hmac = new URL(request.url).searchParams.get("hmac") ?? "";
        const body = (await request.json().catch(() => null)) as { obj?: Txn } | null;
        const obj = body?.obj;
        if (!obj || !(await verifyPaymobHmac(obj, hmac))) return new Response("invalid signature", { status: 401 });

        const orderId = obj.order?.merchant_order_id ?? obj.merchant_order_id;
        const order = orderId ? await getOrder(orderId) : null;
        if (!order) return new Response("unknown order", { status: 404 });
        if (order.paymentStatus === "paid") return new Response("ok"); // retried webhook

        if (obj.pending) return new Response("ok");
        if (obj.success && obj.amount_cents === order.total * 100) {
          await updateOrder(order.id, { paymentStatus: "paid", paymobTxnId: String(obj.id ?? "") });
        } else {
          await updateOrder(order.id, { paymentStatus: "failed" });
        }
        return new Response("ok");
      },
    },
  },
});
