// Paymob (Egypt) hosted checkout via the Intention API.
// Docs: https://developers.paymob.com  (test + live use the same URL; the keys
// and integration IDs decide which mode you are in).
import type { Order } from "./orders";

const BASE = "https://accept.paymob.com";
const env = (k: string) => process.env[k] ?? "";

const integrationIds = () =>
  [env("PAYMOB_CARD_INTEGRATION_ID"), env("PAYMOB_WALLET_INTEGRATION_ID")]
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));

export const paymobConfigured = () =>
  Boolean(env("PAYMOB_SECRET_KEY") && env("PAYMOB_PUBLIC_KEY") && env("PAYMOB_HMAC_SECRET") && integrationIds().length);

/** Returns the Paymob page the customer should be redirected to. */
export async function createCheckoutUrl(order: Order, origin: string): Promise<string> {
  const [first = "Customer", ...rest] = order.customer.name.split(" ");
  const items = order.items.map((i) => ({ name: i.name, amount: i.price * 100, quantity: i.qty }));
  if (order.shipping > 0) items.push({ name: "Shipping", amount: order.shipping * 100, quantity: 1 });

  const res = await fetch(`${BASE}/v1/intention/`, {
    method: "POST",
    headers: { Authorization: `Token ${env("PAYMOB_SECRET_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: order.total * 100, // cents
      currency: "EGP",
      payment_methods: integrationIds(),
      items,
      billing_data: {
        first_name: first,
        last_name: rest.join(" ") || "-",
        email: order.customer.email || "no-email@example.com",
        phone_number: `+2${order.customer.phone}`,
        city: order.customer.governorate,
        country: "EG",
      },
      special_reference: order.id, // comes back as merchant_order_id in the webhook
      notification_url: `${origin}/api/paymob/webhook`,
      redirection_url: `${origin}/order/${order.id}`,
    }),
  });
  if (!res.ok) throw new Error(`Paymob ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { client_secret?: string };
  if (!data.client_secret) throw new Error("Paymob did not return a client_secret");
  return `${BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(env("PAYMOB_PUBLIC_KEY"))}&clientSecret=${encodeURIComponent(data.client_secret)}`;
}

// Fields concatenated (in this order) to build the callback signature.
// CHECK against Paymob's "Transaction Processed Callback" HMAC docs before going live.
const HMAC_FIELDS = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id",
  "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order.id", "owner", "pending", "source_data.pan", "source_data.sub_type",
  "source_data.type", "success",
];

const pick = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), obj);

export async function verifyPaymobHmac(obj: unknown, received: string): Promise<boolean> {
  const secret = env("PAYMOB_HMAC_SECRET");
  if (!secret || !received) return false;
  const text = HMAC_FIELDS.map((f) => String(pick(obj, f))).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  const expected = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.toLowerCase().charCodeAt(i);
  return diff === 0;
}
