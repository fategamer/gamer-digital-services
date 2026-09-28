# Gamer Digital Services

Live: https://gamer-digital-services.vercel.app/

## Features

- Safaricom data / minutes / SMS / Tunukiwa
- **Airtel** deals tab
- Gift any number + Order ID
- STK Push + Till + WhatsApp
- **Referral codes** (`?ref=CODE`)
- **Agent dashboard** at `/agent.html` (PIN in `config.js` → `agentPin`)
- **Telegram** alerts on paid STK (env vars)

## Env vars (Vercel)

### Daraja STK
```
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=6872649
MPESA_PASSKEY=
MPESA_ENV=sandbox
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
```

### Telegram paid alerts
1. Message @BotFather → create bot → copy token
2. Message your bot, then get chat id (e.g. via @userinfobot or getUpdates)
3. Add on Vercel:
```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Redeploy after saving.

## Agent referrals

Share: `https://gamer-digital-services.vercel.app/?ref=JANE01`

Orders include `Ref: JANE01` in WhatsApp message. Generate links in `/agent.html`.

## Edit deals

`config.js` only. Change `agentPin` from default `6872`.
