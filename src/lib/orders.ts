import { z } from "zod";
import { GOVERNORATES, SHIPPING_FEE, formatPrice, type Product } from "./shop";

export const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled", "returned"] as const;
export type OrderStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const PAYMENT_STATUSES = ["unpaid", "paid", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = "cod" | "card";

export type OrderItem = { id: string; name: string; price: number; qty: number };

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  customer: {
    name: string;
    phone: string;
    email: string;
    governorate: string;
    address: string;
    notes: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  trackingNumber: string;
  adminNote: string;
  paymobTxnId: string;
};

// What a customer may see on the public tracking page (no phone / full address).
export type PublicOrder = Pick<
  Order,
  "id" | "createdAt" | "status" | "payment" | "paymentStatus" | "items" | "subtotal" | "shipping" | "total" | "trackingNumber"
> & { firstName: string; governorate: string };

/** 201012345678, +201012345678, 1012345678 -> 01012345678 */
export function normalizePhone(raw: string) {
  const d = raw.replace(/[\s\-()]/g, "").replace(/^\+?20/, "");
  return d.startsWith("0") ? d : `0${d}`;
}

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((p) => /^01[0125]\d{8}$/.test(p), "Enter a valid Egyptian mobile number"),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email")
    .default(""),
  governorate: z.enum(GOVERNORATES, { errorMap: () => ({ message: "Choose your governorate" }) }),
  address: z.string().trim().min(8, "Enter your full address").max(300),
  notes: z.string().trim().max(300).default(""),
  payment: z.enum(["cod", "card"]),
  items: z
    .array(z.object({ id: z.string().max(60), qty: z.number().int().min(1).max(10) }))
    .min(1, "Your cart is empty")
    .max(20),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

/** Prices always come from the server-side catalog, never from the browser. */
export function priceItems(items: { id: string; qty: number }[], catalog: Pick<Product, "id" | "name" | "price" | "active">[]) {
  const lines: OrderItem[] = items.map((i) => {
    const p = catalog.find((x) => x.id === i.id && x.active !== false);
    if (!p) throw new Error(`Unknown product: ${i.id}`);
    return { id: p.id, name: p.name, price: p.price, qty: i.qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  return { lines, subtotal, shipping: SHIPPING_FEE, total: subtotal + SHIPPING_FEE };
}

/** Cash the courier must collect: full total for unpaid COD, otherwise 0. */
export const codAmount = (o: Pick<Order, "payment" | "paymentStatus" | "total">) =>
  o.payment === "cod" && o.paymentStatus !== "paid" ? o.total : 0;

/** Text to paste into a Bosta delivery form. */
export function bostaText(o: Order) {
  return [
    `Reference: ${o.id}`,
    `Name: ${o.customer.name}`,
    `Phone: ${o.customer.phone}`,
    `City: ${o.customer.governorate}`,
    `Address: ${o.customer.address}`,
    `COD amount: ${codAmount(o)} EGP`,
    `Package: ${o.items.map((i) => `${i.qty} x ${i.name}`).join(", ")}`,
    o.customer.notes ? `Notes: ${o.customer.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const orderWhatsappText = (o: Pick<PublicOrder, "id" | "items" | "total">) =>
  `Hello GameBoys! About order ${o.id}:\n` +
  o.items.map((i) => `• ${i.qty} x ${i.name}`).join("\n") +
  `\nTotal: ${formatPrice(o.total)}`;
