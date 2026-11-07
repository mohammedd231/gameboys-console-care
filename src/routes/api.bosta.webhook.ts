import { createFileRoute } from "@tanstack/react-router";
import { getOrder, updateOrder } from "@/lib/orders.server";

// Bosta calls this when a delivery changes state. Protected by ?secret=BOSTA_WEBHOOK_SECRET.
// State names are matched loosely so a slightly different wording from Bosta still works.
function mapState(s: unknown): "shipped" | "delivered" | "returned" | "cancelled" | null {
  const t = String(s ?? "").toLowerCase();
  if (/deliver(ed)?$/.test(t) && !/out for|delivering/.test(t)) return "delivered";
  if (/return/.test(t)) return "returned";
  if (/cancel|terminat/.test(t)) return "cancelled";
  if (/pick|transit|out for|delivering|received/.test(t)) return "shipped";
  return null;
}

export const Route = createFileRoute("/api/bosta/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["BOSTA_WEBHOOK_SECRET"];
        if (!secret || new URL(request.url).searchParams.get("secret") !== secret) return new Response("forbidden", { status: 403 });
        const body: any = await request.json().catch(() => ({}));
        const ref = String(body.businessReference ?? body.business_reference ?? "");
        const state = mapState(body.state?.value ?? body.stateValue ?? body.state ?? body.type);
        const order = ref ? await getOrder(ref) : null;
        if (order && state && !["delivered", "cancelled", "returned"].includes(order.status)) {
          await updateOrder(order.id, {
            status: state,
            ...(state === "delivered" && order.payment === "cod" ? { paymentStatus: "paid" as const } : {}),
          });
        }
        return new Response("ok");
      },
    },
  },
});
