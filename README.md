# Gamer Digital Services

Independent Kenya data / minutes / SMS shop — built to outcompete basic "pay exact amount to till" marketplaces.

## Why this is stronger than a basic Bingwa-style shop

| Capability | Typical till shop | Gamer Digital |
|------------|-------------------|---------------|
| Gift any number | Often payer only | Explicit delivery phone |
| Order tracking | None | Order ID on every sale |
| Payment | Till only | STK Push + Till + WhatsApp |
| Categories | Flat list | Data / Minutes / SMS / Tunukiwa tabs |
| Social | Status only | Share deal to WhatsApp |
| Trust UX | Minimal | Badges, Okoa flags, FAQ, trust row |
| Owner ops | Guess from SMS | Order ID + STK callback logs |

## Live flow

1. Customer picks deal → enters **delivery phone** (gift OK)
2. Gets **Order ID** (GDS-XXXX)
3. Pays via **STK** (if Daraja configured) or **Till + WhatsApp**
4. You confirm and deliver to the delivery number

## Edit deals

`config.js` only — prices, badges (`HOT`, `FLASH`, `MONTHLY`…), validity, Okoa flag, FAQ.

## Daraja (optional STK)

Vercel env: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENV`, `MPESA_TRANSACTION_TYPE`.

See previous commit for API routes under `/api/mpesa/`.

## Legal note

Independent reseller. Not affiliated with Safaricom or Bingwa Sokoni. Delivery depends on your stock/process — network rules (once/day, time windows) still apply.
