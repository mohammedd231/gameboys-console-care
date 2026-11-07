import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { PAYMENT_STATUSES, STATUSES, checkoutSchema, priceItems } from "./orders";
import { adminLogin as doLogin, adminLogout as doLogout, isAdmin, requireAdmin } from "./admin-auth.server";
import { createOrder, getOrder, listOrders, toPublic, updateOrder } from "./orders.server";
import { createCheckoutUrl, paymobConfigured } from "./paymob.server";

const origin = () => process.env["SITE_URL"] || getRequestUrl().origin;
const idSchema = z.object({ id: z.string().min(6).max(40) });

// ---------- Customer ----------

export const getPaymentOptions = createServerFn({ method: "GET" }).handler(async () => ({
  card: paymobConfigured(),
}));

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.payment === "card" && !paymobConfigured()) throw new Error("Card payment is not available yet");
    const { lines, subtotal, shipping, total } = priceItems(data.items);
    const order = await createOrder({
      customer: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        governorate: data.governorate,
        address: data.address,
        notes: data.notes,
      },
      payment: data.payment,
      items: lines,
      subtotal,
      shipping,
      total,
    });
    if (data.payment === "card") {
      try {
        return { id: order.id, checkoutUrl: await createCheckoutUrl(order, origin()) };
      } catch (e) {
        console.error("Paymob intention failed", e);
        await updateOrder(order.id, { paymentStatus: "failed" });
      }
    }
    return { id: order.id, checkoutUrl: null as string | null };
  });

export const trackOrder = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const o = await getOrder(data.id);
    return o ? toPublic(o) : null;
  });

export const retryPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const o = await getOrder(data.id);
    if (!o || o.payment !== "card" || o.paymentStatus === "paid") throw new Error("Nothing to pay");
    return { checkoutUrl: await createCheckoutUrl(o, origin()) };
  });

// ---------- Admin ----------

export const adminSession = createServerFn({ method: "GET" }).handler(async () => ({ ok: await isAdmin() }));

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => ({ ok: await doLogin(data.password) }));

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  doLogout();
  return { ok: true };
});

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return listOrders();
});

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(6).max(40),
        status: z.enum(STATUSES),
        paymentStatus: z.enum(PAYMENT_STATUSES),
        trackingNumber: z.string().trim().max(60),
        adminNote: z.string().trim().max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...patch } = data;
    return updateOrder(id, patch);
  });
