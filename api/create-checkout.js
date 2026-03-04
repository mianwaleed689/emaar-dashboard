// /api/create-checkout.js
// Vercel Serverless Function — Stripe Checkout
//
// SETUP (one-time, takes 10 minutes):
// 1. Go to https://stripe.com → create account → activate UAE payments
// 2. Go to Stripe Dashboard → Products → Create 2 products:
//    - "DXB Analytics Pro"        → Price: AED 99/month  (recurring)
//    - "DXB Analytics Enterprise" → Price: AED 499/month (recurring)
// 3. Copy the Price IDs (start with "price_...") into STRIPE_PRICES below
// 4. In Vercel Dashboard → your project → Settings → Environment Variables → add:
//    STRIPE_SECRET_KEY  = sk_live_xxxxxxxxxxxx   (from Stripe Dashboard → Developers → API Keys)
//    NEXT_PUBLIC_URL    = https://emaar-dashboard.vercel.app  (your Vercel URL)
// 5. Deploy — Stripe will work automatically

import Stripe from "stripe";

// ─── YOUR STRIPE PRICE IDs ─── (replace with real ones from Stripe Dashboard)
const STRIPE_PRICES = {
  Pro: "price_REPLACE_WITH_PRO_PRICE_ID",           // AED 99/month
  Enterprise: "price_REPLACE_WITH_ENTERPRISE_PRICE_ID", // AED 499/month
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { plan, email } = req.body;

  // Validate
  if (!plan || !STRIPE_PRICES[plan]) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  // Check Stripe key is configured
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("REPLACE")) {
    // Stripe not configured yet — return null so frontend falls back to WhatsApp
    return res.status(200).json({ url: null, fallback: "whatsapp" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://emaar-dashboard.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      success_url: `${baseUrl}?payment=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?payment=cancelled`,
      metadata: { plan, email: email || "" },
      subscription_data: {
        metadata: { plan, email: email || "" },
        trial_period_days: 0,
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    // Return null so frontend gracefully falls back to WhatsApp
    return res.status(200).json({ url: null, error: err.message });
  }
}
