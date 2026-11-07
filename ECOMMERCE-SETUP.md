# GameBoys e-commerce: setup notes

## What was added
- `/checkout`: guest checkout (name, Egyptian mobile, governorate, address, notes). Cash on delivery always; card/wallet appears automatically once Paymob env vars are set.
- `/order/:id`: public tracking page (status bar, courier tracking number, "Pay now" for unpaid card orders). The link is unguessable; it shows only first name + governorate.
- `/admin`: password-protected dashboard (filters, search, status/payment/tracking/internal note, "Copy details for Bosta", CSV export).
- `/api/paymob/webhook`: verifies Paymob's HMAC, checks the amount, marks the order paid.
- Cart page now has a Checkout button (WhatsApp ordering kept as a second option).

## Run it
1. Copy `.env.example` to `.env` and set `ADMIN_PASSWORD`, `ADMIN_SECRET`, `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (without the Supabase vars, dev falls back to in-memory orders).
2. `bun install` (or `npm i`), then `bun dev`. The dev server regenerates `src/routeTree.gen.ts` for the new routes; commit that file.
3. Place a test COD order at `/checkout`, then open `/admin`.

## Paymob
1. Complete business verification, then take the secret key, public key, HMAC secret and integration IDs from the Paymob dashboard (test ones first).
2. Put them in the env vars above and set `SITE_URL` to your public https URL.
3. In the Paymob dashboard, set each integration's transaction processed callback to `https://YOUR-SITE/api/paymob/webhook` (wallets need this even though card orders also send it per payment).
4. Webhooks cannot reach localhost: use a tunnel (ngrok / Cloudflare Tunnel) or a preview deploy.
5. Check `HMAC_FIELDS` in `src/lib/paymob.server.ts` against Paymob's current callback docs before going live.

## Still to do (on purpose left for later)
- **Supabase**: orders are stored in the `public.shop_orders` table (row-level security on, no policies, so only the server's secret key can touch it). Admin login is still a single password (`ADMIN_PASSWORD`); move it to Supabase Auth when you want per-person logins.
- **Shipping fee**: `SHIPPING_FEE` in `src/lib/shop.ts` is 0.
- **Bosta API**: for now use "Copy details for Bosta" in the dashboard, then paste the tracking number back.
- **Product catalog**: still sample data in `src/lib/shop.ts`.
- Ads: add Meta/TikTok pixel and an order-placed event on `/order/:id` later.
