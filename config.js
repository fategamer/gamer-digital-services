/* Gamer Digital Services — edit deals here only */
window.BINGWA = {
  brand: "Gamer Digital Services",
  company: "Gamer Innovation Network",
  till: "6872649",
  whatsapp: "254701186627",
  tagline: "Pata Data Hata Ukiwa na Okoa",
  subtitle: "Okoa-friendly · Gift any number · Airtel + Safaricom · Refer & earn",
  features: [
    "Gift to any number (Safaricom / Airtel)",
    "Order ID for every purchase",
    "Pay via STK Push or Till",
    "Referral codes for agents",
    "WhatsApp + Telegram paid alerts"
  ],
  // Your public site URL (used in referral links)
  siteUrl: "https://gamer-digital-services.vercel.app",
  // Default agent referral code shown on site (change anytime)
  defaultRef: "GDS",
  // Agent dashboard PIN (change this!)
  agentPin: "6872",
  dataDeals: [
    { id: "d1", title: "1GB · Valid Midnight", price: 55, validity: "Midnight", note: "Once per day", badge: "HOT", okOa: true },
    { id: "d2", title: "250MB · 24hrs", price: 20, validity: "24 hrs", note: "Once per day", badge: "POPULAR", okOa: true },
    { id: "d3", title: "1GB · 1hr", price: 19, validity: "1 hour", note: "Unavailable 4PM–12AM", badge: "FLASH", okOa: true },
    { id: "d4", title: "400MB · 7 days", price: 49, validity: "7 days", okOa: true },
    { id: "d5", title: "750MB + 50 SMS · 24hrs", price: 50, validity: "24 hrs", badge: "COMBO", okOa: true },
    { id: "d6", title: "1.5GB · 24 Hours", price: 99, validity: "24 hrs", badge: "VALUE", okOa: true },
    { id: "d7", title: "2.5GB · 30 Days", price: 250, validity: "30 days", badge: "MONTHLY", okOa: false },
    { id: "d8", title: "7GB · 30 Days", price: 500, validity: "30 days", badge: "MONTHLY", okOa: false },
    { id: "d9", title: "21GB · 30 Days", price: 1000, validity: "30 days", badge: "MONTHLY", okOa: false }
  ],
  minuteDeals: [
    { id: "m1", title: "350 FLEX / 45MINS · 3HRS", price: 22, validity: "3 hrs", note: "Buy many times daily", badge: "HOT" },
    { id: "m2", title: "50 mins till Midnight", price: 51, validity: "Midnight", badge: "POPULAR" },
    { id: "m3", title: "250 MINS · 7 Days", price: 220, validity: "7 days" }
  ],
  smsDeals: [
    { id: "s1", title: "20 SMS · 24 hours", price: 5, validity: "24 hrs" },
    { id: "s2", title: "200 SMS · 24 hrs", price: 10, validity: "24 hrs", badge: "VALUE" },
    { id: "s3", title: "100 SMS · 7 days", price: 21, validity: "7 days" },
    { id: "s4", title: "1000 SMS · 7 days", price: 30, validity: "7 days", badge: "HOT" }
  ],
  tunuDeals: [
    { id: "t1", title: "1GB · 1HR", price: 23, validity: "1 hour", note: "Unavailable 4PM–11PM", badge: "FLASH" },
    { id: "t2", title: "250MB + 50 SMS · 24hrs", price: 25, validity: "24 hrs", badge: "COMBO" },
    { id: "t3", title: "750MB · 24HRS", price: 52, validity: "24 hrs" },
    { id: "t4", title: "2GB · 24 Hours", price: 110, validity: "24 hrs", badge: "VALUE" }
  ],
  airtelDeals: [
    { id: "a1", title: "Airtel 1GB · Midnight", price: 45, validity: "Midnight", badge: "HOT", network: "Airtel" },
    { id: "a2", title: "Airtel 2GB · 24hrs", price: 80, validity: "24 hrs", badge: "VALUE", network: "Airtel" },
    { id: "a3", title: "Airtel 500MB · 24hrs", price: 25, validity: "24 hrs", network: "Airtel" },
    { id: "a4", title: "Airtel 5GB · 7 days", price: 250, validity: "7 days", badge: "WEEKLY", network: "Airtel" },
    { id: "a5", title: "Airtel 10GB · 30 days", price: 500, validity: "30 days", badge: "MONTHLY", network: "Airtel" }
  ],
  faq: [
    {
      q: "How do I receive the bundle?",
      a: "Enter the phone that should receive the deal. Pay via STK or till, then we confirm and deliver to that number. Keep your Order ID."
    },
    {
      q: "Can I gift data to someone else?",
      a: "Yes. Put their number as the delivery phone. Payment can be from your line; delivery goes to theirs."
    },
    {
      q: "Do you sell Airtel?",
      a: "Yes — open the Airtel tab. Delivery phone must be an Airtel line for those deals."
    },
    {
      q: "What is a referral code?",
      a: "Agents share links like ?ref=THEIRCODE. When you order, the code is attached so they can be credited."
    },
    {
      q: "Does it work with Okoa?",
      a: "Many short-term Safaricom deals are Okoa-friendly where the underlying offer allows."
    },
    {
      q: "What if payment succeeds but I get nothing?",
      a: "Message us on WhatsApp with your Order ID and M-Pesa receipt."
    }
  ]
};
