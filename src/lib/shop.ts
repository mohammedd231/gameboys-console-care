import hero from "@/assets/hero.jpg";
import controller from "@/assets/controller.jpg";
import accessories from "@/assets/accessories.jpg";
import repair from "@/assets/repair.jpg";

export const WHATSAPP_NUMBER = "905349169555";
export const CURRENCY = "EGP";

// Flat shipping fee in EGP. Set to the real courier price (0 = free shipping).
export const SHIPPING_FEE = 0;

export const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Sharqia", "Dakahlia", "Gharbia", "Monufia",
  "Beheira", "Kafr El Sheikh", "Damietta", "Port Said", "Ismailia", "Suez", "North Sinai",
  "South Sinai", "Fayoum", "Beni Suef", "Minya", "Assiut", "Sohag", "Qena", "Luxor",
  "Aswan", "Red Sea", "New Valley", "Matrouh",
] as const;

export const formatPrice = (n: number) => `${n.toLocaleString("en-US")} ${CURRENCY}`;

export const whatsappLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export type Category = "PS5" | "PS4" | "Xbox" | "Accessories" | "Games";
export const CATEGORIES: Category[] = ["PS5", "PS4", "Xbox", "Accessories", "Games"];

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  /** Public image URL, or "asset:hero|controller|accessories" for the built-in photos, or "". */
  image: string;
  tag?: string;
  active?: boolean;
  sort?: number;
};

const BUILT_IN: Record<string, string> = { hero, controller, accessories };
const CATEGORY_FALLBACK: Record<Category, string> = { PS5: hero, PS4: hero, Xbox: hero, Accessories: accessories, Games: controller };

/** The picture to show for a product (own upload > built-in photo > category default). */
export const productImage = (p: Pick<Product, "image" | "category">) =>
  p.image.startsWith("asset:") ? (BUILT_IN[p.image.slice(6)] ?? CATEGORY_FALLBACK[p.category]) : p.image || CATEGORY_FALLBACK[p.category];

// Starter catalog. Used to seed the database and as the local-dev fallback; the live shop reads products from Supabase.
export const SAMPLE_PRODUCTS: Product[] = [
  { id: "ps5-disc", name: "PlayStation 5 Console (Disc)", category: "PS5", price: 32000, image: "asset:hero", tag: "Hot" },
  { id: "ps5-digital", name: "PlayStation 5 Digital Edition", category: "PS5", price: 28000, image: "asset:hero" },
  { id: "ps5-pad", name: "DualSense Wireless Controller", category: "PS5", price: 3800, image: "asset:controller" },
  { id: "ps4-slim", name: "PlayStation 4 Slim 1TB", category: "PS4", price: 14500, image: "asset:hero", tag: "Used – checked" },
  { id: "ps4-pad", name: "DualShock 4 Controller", category: "PS4", price: 2200, image: "asset:controller" },
  { id: "xbox-x", name: "Xbox Series X", category: "Xbox", price: 31000, image: "asset:hero" },
  { id: "xbox-s", name: "Xbox Series S", category: "Xbox", price: 17500, image: "asset:hero" },
  { id: "xbox-pad", name: "Xbox Wireless Controller", category: "Xbox", price: 3200, image: "asset:controller" },
  { id: "headset", name: "Gaming Headset", category: "Accessories", price: 1900, image: "asset:accessories" },
  { id: "dock", name: "Dual Controller Charging Dock", category: "Accessories", price: 850, image: "asset:accessories" },
  { id: "hdmi", name: "HDMI 2.1 Cable", category: "Accessories", price: 350, image: "asset:accessories" },
  { id: "games", name: "Latest Games (ask for titles)", category: "Games", price: 2500, image: "asset:controller" },
];

export const SERVICES = [
  { name: "Cleaning & thermal paste", from: 500, desc: "Deep dust cleaning, new thermal paste, quieter fans." },
  { name: "HDMI port replacement", from: 900, desc: "No picture? We replace damaged HDMI ports." },
  { name: "Controller repair", from: 300, desc: "Stick drift, buttons, charging port, battery." },
  { name: "Disc drive repair", from: 800, desc: "Discs not reading or ejecting." },
  { name: "Software & updates", from: 250, desc: "System errors, safe mode, storage upgrades." },
  { name: "Power & overheating", from: 700, desc: "Won't turn on, shuts down, blue light of death." },
];

export const repairImage = repair;
export const heroImage = hero;
