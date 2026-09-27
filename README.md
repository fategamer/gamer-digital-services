# Gamer Digital Services

Public deals brand of **Gamer Innovation Network** (Kenya).

Repo: https://github.com/fategamer/gamer-digital-services

## Live

- Vercel project: `gamer-digital-services`
- GitHub Pages (if enabled): https://fategamer.github.io/gamer-digital-services/

## How the order → deliver flow works

1. Customer clicks **Buy** on a deal.
2. Modal asks for the **phone number that will receive** the data/minutes/SMS (required).
3. Site generates an **Order ID** (e.g. `GDS-7K2M`).
4. WhatsApp opens with a structured message: Order ID + deal + price + delivery phone.
5. Customer pays exact amount to till **6872649** (Lipa na M-Pesa → Buy Goods).
6. Customer sends the M-Pesa SMS on WhatsApp.
7. You confirm payment and deliver to the number they gave.

## Edit prices / deals

Change `config.js` only.

Owner reply scripts: `SELLING.md`.

## Tech

Static site (HTML + config.js + app.js). No backend required.
