// Temporary admin login: one password (ADMIN_PASSWORD) + a signed, HttpOnly cookie.
// When Supabase is connected, replace this with Supabase Auth restricted to
// your and your dad's emails.
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE = "gb_admin";
const WEEK = 7 * 24 * 60 * 60;
const enc = new TextEncoder();

async function sign(payload: string) {
  const secret = process.env["ADMIN_SECRET"];
  if (!secret || secret.length < 16) throw new Error("ADMIN_SECRET must be set (16+ characters)");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function adminLogin(password: string): Promise<boolean> {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) throw new Error("ADMIN_PASSWORD is not set");
  // Compare HMACs of both values so the check does not leak the password length/prefix.
  if ((await sign(`pw:${password}`)) !== (await sign(`pw:${expected}`))) return false;
  const exp = Date.now() + WEEK * 1000;
  setCookie(COOKIE, `${exp}.${await sign(String(exp))}`, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
  return true;
}

export function adminLogout() {
  deleteCookie(COOKIE, { path: "/" });
}

export async function isAdmin(): Promise<boolean> {
  const raw = getCookie(COOKIE);
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return (await sign(exp)) === sig;
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorized");
}
