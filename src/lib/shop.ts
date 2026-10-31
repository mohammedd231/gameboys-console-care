import hero from "@/assets/hero.jpg";
import controller from "@/assets/controller.jpg";
import accessories from "@/assets/accessories.jpg";
import repair from "@/assets/repair.jpg";

export const WHATSAPP_NUMBER = "905349169555";
export const CURRENCY = "EGP";

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
  image: string;
  tag?: string;
};

// Sample catalog — replace names/prices with the real stock.
export const PRODUCTS: Product[] = [
  { id: "ps5-disc", name: "PlayStation 5 Console (Disc)", category: "PS5", price: 32000, image: hero, tag: "Hot" },
  { id: "ps5-digital", name: "PlayStation 5 Digital Edition", category: "PS5", price: 28000, image: hero },
  { id: "ps5-pad", name: "DualSense Wireless Controller", category: "PS5", price: 3800, image: controller },
  { id: "ps4-slim", name: "PlayStation 4 Slim 1TB", category: "PS4", price: 14500, image: hero, tag: "Used – checked" },
  { id: "ps4-pad", name: "DualShock 4 Controller", category: "PS4", price: 2200, image: controller },
  { id: "xbox-x", name: "Xbox Series X", category: "Xbox", price: 31000, image: hero },
  { id: "xbox-s", name: "Xbox Series S", category: "Xbox", price: 17500, image: hero },
  { id: "xbox-pad", name: "Xbox Wireless Controller", category: "Xbox", price: 3200, image: controller },
  { id: "headset", name: "Gaming Headset", category: "Accessories", price: 1900, image: accessories },
  { id: "dock", name: "Dual Controller Charging Dock", category: "Accessories", price: 850, image: accessories },
  { id: "hdmi", name: "HDMI 2.1 Cable", category: "Accessories", price: 350, image: accessories },
  { id: "games", name: "Latest Games (ask for titles)", category: "Games", price: 2500, image: controller },
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
