# Gamer Digital Services

**Live:** https://gamer-digital-services.vercel.app/

## Interactive features (all working in UI)

| Feature | How to use |
|---------|------------|
| **Okoa filter** | Hero “Okoa-friendly” or **Okoa only** chip → filters data deals |
| **Gift a friend** | **Gift** on a deal, or Myself/Gift toggle in modal |
| **Referral** | Type code → Apply, or open `?ref=CODE` |
| **Tabs** | Data / Minutes / SMS / Tunukiwa / Airtel / FAQ |
| **Share** | Opens WhatsApp with deal + till + ref link |
| **Buy** | Creates **server order**, then Till+WhatsApp or STK |
| **Agent** | `/agent.html` PIN `6872` → list / mark paid / delivered |

## Make orders persist (pick one)

### Option A — GitHub file store (simple)
Vercel → Environment Variables:
```
GITHUB_TOKEN=ghp_xxxx   # classic token with repo contents:write on this repo
AGENT_PIN=6872
```
Orders saved to `data/orders.json` in this repo.

### Option B — Upstash Redis
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Telegram alerts
```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### STK (Daraja)
```
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=6872649
MPESA_PASSKEY=
MPESA_ENV=sandbox
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
```

Redeploy after setting env vars.

## API

- `GET /api/health`
- `POST /api/orders/create`
- `GET /api/orders/list?pin=`
- `POST /api/orders/update`
- `POST /api/mpesa/stk`
- `POST /api/mpesa/callback`
