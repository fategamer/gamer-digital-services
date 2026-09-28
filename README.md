# Gamer Digital Services — real backend

**Live:** https://gamer-digital-services.vercel.app/

## How it works (production flow)

1. Customer clicks **Buy** → enters delivery phone  
2. Frontend calls **`POST /api/orders/create`** → server order + **Telegram** alert  
3. Customer pays via **Till + WhatsApp** or **STK** (if Daraja configured)  
4. STK success → **`/api/mpesa/callback`** marks order **paid** + Telegram  
5. You open **`/agent.html`** → mark **delivered** after you send the bundle  

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | mpesa / telegram / redis status |
| `POST /api/orders/create` | create order |
| `GET /api/orders/list?pin=` | agent list |
| `POST /api/orders/update` | paid / delivered / cancelled |
| `POST /api/mpesa/stk` | STK Push |
| `POST /api/mpesa/callback` | Safaricom callback |

## Vercel environment variables

### Required for “live ops” (recommended)
```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
AGENT_PIN=6872
```

### STK Push (optional but powerful)
```
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=6872649
MPESA_PASSKEY=
MPESA_ENV=sandbox
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
```

### Permanent order history (recommended)
Create free Upstash Redis → Vercel storage integration, or set:
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Without Redis, orders live in server memory (work while the function is warm; Telegram is still the source of truth).

## Agent

https://gamer-digital-services.vercel.app/agent.html  
Default PIN: `6872` (override with `AGENT_PIN` or `config.js` agentPin for UI only — API uses env).

## Honest limit

Backend confirms **orders + payments**.  
**Delivering** Safaricom/Airtel bundles still requires your float / manual USSD / aggregator API.  
When you connect a top-up API later, hook it into `status: paid` → auto-deliver.
