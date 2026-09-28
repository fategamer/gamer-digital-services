# Gamer Digital Services — make everything work

## 1. Vercel Environment Variables (required)

Project → **Settings → Environment Variables** → add for **Production** (and Preview if you want):

### A) Gift SMS to friend's phone (Africa's Talking)

| Name | Value |
|------|--------|
| `AT_USERNAME` | `sandbox` (test) **or** your live username |
| `AT_API_KEY` | API key from https://account.africastalking.com |
| `AT_FROM` | Optional live sender ID / shortcode |
| `AT_SANDBOX` | `1` only if forcing sandbox endpoint |

- Sandbox: SMS only goes to numbers you whitelist in AT sandbox.
- Live: buy SMS credits, set `AT_USERNAME` + live `AT_API_KEY`.

### B) Orders must persist (Accept/Decline + Agent)

Without this, gifts disappear and friend sees "not found".

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | Personal access token with `repo` scope for `fategamer/gamer-digital-services` |

Optional instead of / in addition to GitHub:

| Name | Value |
|------|--------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token |

### C) Optional alerts

| Name | Value |
|------|--------|
| `TELEGRAM_BOT_TOKEN` | Bot token |
| `TELEGRAM_CHAT_ID` | Your chat id |

### D) Optional M-Pesa STK

| Name | Value |
|------|--------|
| `MPESA_CONSUMER_KEY` | Daraja |
| `MPESA_CONSUMER_SECRET` | Daraja |
| `MPESA_PASSKEY` | Daraja |
| `MPESA_SHORTCODE` | Till/Paybill |
| `MPESA_ENV` | `sandbox` or `production` |
| `PUBLIC_TILL` | `6872649` |

## 2. Redeploy

After saving env vars: **Deployments → Redeploy** (or push any commit).

## 3. Verify

Open: https://gamer-digital-services.vercel.app/api/health

You want:

```json
{
  "ok": true,
  "sms": true,
  "githubStore": true,
  "storage": "github"
}
```

## 4. Test gift SMS

1. Site → **Gift** → enter a number allowed by AT (sandbox whitelist or live).
2. **Send prompt to this number**.
3. Friend gets SMS → opens link → **Accept** or **Decline**.
4. You pay till after Accept.

## Flows

| Action | What happens |
|--------|----------------|
| Buy | Order ID on site → pay till → deliver |
| Gift | SMS to number + gift link → Accept/Decline → pay till → deliver |
| Agent | PIN dashboard lists orders when store is durable |
