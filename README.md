# Gamer Digital Services

Public deals brand of **Gamer Innovation Network** (Kenya).

Repo: https://github.com/fategamer/gamer-digital-services

## Payment flows

1. **STK Push (Daraja)** — customer enters phone → M-Pesa PIN prompt on phone → callback confirms payment.
2. **Till + WhatsApp** — pay Buy Goods till **6872649**, send M-Pesa SMS on WhatsApp with Order ID (always available).

Both use an **Order ID** (e.g. `GDS-7K2M`) and a required **delivery phone**.

## Safaricom Daraja setup (required for STK)

1. Create app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Enable **Lipa Na M-Pesa Online** (STK Push)
3. Get Consumer Key, Consumer Secret, Passkey, Shortcode (till or paybill)
4. On **Vercel** → Project `gamer-digital-services` → Settings → Environment Variables, add:

| Variable | Example |
|----------|---------|
| `MPESA_CONSUMER_KEY` | from Daraja |
| `MPESA_CONSUMER_SECRET` | from Daraja |
| `MPESA_SHORTCODE` | `6872649` or sandbox `174379` |
| `MPESA_PASSKEY` | from Daraja |
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_TRANSACTION_TYPE` | `CustomerBuyGoodsOnline` (till) or `CustomerPayBillOnline` (paybill) |
| `MPESA_CALLBACK_URL` | optional; defaults to `https://YOUR_DOMAIN/api/mpesa/callback` |
| `MPESA_NOTIFY_URL` | optional webhook/Telegram/Sheet URL for paid alerts |

5. Redeploy after saving env vars.

### API routes

- `POST /api/mpesa/stk` — start STK Push
- `POST /api/mpesa/callback` — Safaricom result (logs `MPESA_STK_RESULT`)
- `GET /api/mpesa/status` — whether keys are configured

Successful payments log Order ID + M-Pesa receipt in Vercel Function Logs. Match that Order ID to deliver.

## Edit deals

Change `config.js` only.

Owner scripts: `SELLING.md`.

## Notes

- Daraja does **not** auto-deliver Safaricom data bundles. You still deliver after payment is confirmed.
- Start in **sandbox**, then go live when Safaricom approves production.
