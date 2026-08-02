/**
 * STRIPE WEBHOOK — the missing half of the payment flow.
 *
 * ── THE BUG THIS FIXES ──────────────────────────────────────────────────────
 *
 * `api/create-checkout.js` created a Stripe Checkout session and nothing in
 * this codebase ever recorded the outcome. Searched 2026-08-02: no handler for
 * `checkout.session.completed` anywhere in api/, functions/ or src/, and the
 * only code assigning `tier: "pro"` was mock data in AdminPanel.
 *
 * So the money path ended in a hole. A customer would complete checkout, be
 * charged, and stay on the Free tier forever — a refund and chargeback
 * generator, and a consumer-protection problem in the UAE.
 *
 * This closes it. Stripe tells us what happened; we write it to the user.
 *
 * ── SETUP (all three are required) ──────────────────────────────────────────
 *
 *   1. Stripe Dashboard → Developers → Webhooks → Add endpoint
 *        URL:    https://<your-domain>/api/stripe-webhook
 *        Events: checkout.session.completed
 *                invoice.paid
 *                customer.subscription.deleted
 *                customer.subscription.updated
 *
 *   2. Environment variables (Vercel → Settings → Environment Variables):
 *        STRIPE_SECRET_KEY            the secret key from the Stripe dashboard
 *                                     (use the test-mode one first)
 *        STRIPE_WEBHOOK_SECRET        whsec_…  from the endpoint you just made
 *        FIREBASE_SERVICE_ACCOUNT     the service-account JSON, single line
 *
 *   3. Test before going live:
 *        stripe listen --forward-to localhost:3000/api/stripe-webhook
 *        stripe trigger checkout.session.completed
 *
 * ── WHY THE RAW BODY MATTERS ────────────────────────────────────────────────
 *
 * Signature verification hashes the exact bytes Stripe sent. If a framework
 * parses the JSON first, the signature will never match and every event is
 * rejected — usually silently. `config.api.bodyParser = false` below prevents
 * that, and the raw body is read manually.
 */

const Stripe = require("stripe");

/* Vercel must NOT parse the body — see note above. */
module.exports.config = { api: { bodyParser: false } };

/* Stripe plan → internal tier key. The internal keys are `pro` and
   `enterprise` (see src/config/pricing.js); they appear ~370 times across the
   app and in user records already written, so they are not renamed here.
   Both cases are accepted because create-checkout.js used capitalised keys. */
const PLAN_TO_TIER = {
  pro: "pro",
  Pro: "pro",
  enterprise: "enterprise",
  Enterprise: "enterprise",
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/* Firebase Admin, initialised once per warm lambda. */
let adminDb = null;
function db() {
  if (adminDb) return adminDb;
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  }
  adminDb = admin.firestore();
  return adminDb;
}

/** Find the user this event belongs to. uid in metadata wins; email is the fallback. */
async function findUserRef(firestore, { uid, email }) {
  if (uid) {
    const ref = firestore.collection("users").doc(uid);
    if ((await ref.get()).exists) return ref;
  }
  if (email) {
    const q = await firestore.collection("users")
      .where("email", "==", String(email).toLowerCase()).limit(1).get();
    if (!q.empty) return q.docs[0].ref;
  }
  return null;
}

async function grantAccess(firestore, { uid, email, tier, periodEnd, customerId, subscriptionId }) {
  const ref = await findUserRef(firestore, { uid, email });
  if (!ref) {
    /* Never drop the event. An unmatched payment is money received with no
       account to attach it to, and someone has to see it. */
    await firestore.collection("billingOrphans").add({
      email: email || null, uid: uid || null, tier, customerId, subscriptionId,
      receivedAt: new Date().toISOString(),
      note: "Paid but no matching user record — resolve manually.",
    });
    return { matched: false };
  }
  await ref.set({
    tier,
    subscriptionStatus: "active",
    subscriptionExpiry: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: subscriptionId || null,
    lastPaymentAt: new Date().toISOString(),
  }, { merge: true });
  return { matched: true, id: ref.id };
}

async function revokeAccess(firestore, { customerId, subscriptionId }) {
  const q = await firestore.collection("users")
    .where("stripeSubscriptionId", "==", subscriptionId).limit(1).get();
  if (q.empty) return { matched: false };
  await q.docs[0].ref.set({
    tier: "free",
    subscriptionStatus: "cancelled",
    cancelledAt: new Date().toISOString(),
  }, { merge: true });
  return { matched: true, id: q.docs[0].id };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    /* Loud, not silent. A missing secret here means every payment is being
       dropped, and that must never look like success. */
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY missing — payments are NOT being fulfilled");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  const stripe = new Stripe(key);
  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    const firestore = db();
    const o = event.data.object;

    switch (event.type) {
      case "checkout.session.completed": {
        const plan = o.metadata?.plan;
        const tier = PLAN_TO_TIER[plan];
        if (!tier) {
          console.error("[stripe-webhook] unknown plan in metadata:", plan);
          break;
        }
        let periodEnd = null;
        if (o.subscription) {
          const sub = await stripe.subscriptions.retrieve(o.subscription);
          periodEnd = sub.current_period_end;
        }
        const r = await grantAccess(firestore, {
          uid: o.metadata?.uid,
          email: o.customer_email || o.customer_details?.email || o.metadata?.email,
          tier, periodEnd,
          customerId: o.customer, subscriptionId: o.subscription,
        });
        console.log("[stripe-webhook] checkout completed:", tier, JSON.stringify(r));
        break;
      }

      case "invoice.paid": {
        /* Renewal — push the expiry forward so access does not lapse. */
        if (!o.subscription) break;
        const sub = await stripe.subscriptions.retrieve(o.subscription);
        const tier = PLAN_TO_TIER[sub.metadata?.plan] || null;
        const r = await grantAccess(firestore, {
          uid: sub.metadata?.uid,
          email: o.customer_email || sub.metadata?.email,
          tier: tier || "pro",
          periodEnd: sub.current_period_end,
          customerId: o.customer, subscriptionId: o.subscription,
        });
        console.log("[stripe-webhook] renewal:", JSON.stringify(r));
        break;
      }

      case "customer.subscription.deleted": {
        const r = await revokeAccess(firestore, { customerId: o.customer, subscriptionId: o.id });
        console.log("[stripe-webhook] cancelled:", JSON.stringify(r));
        break;
      }

      case "customer.subscription.updated": {
        /* Covers a failed renewal moving the sub to past_due/unpaid. */
        if (["past_due", "unpaid", "canceled"].includes(o.status)) {
          const q = await firestore.collection("users")
            .where("stripeSubscriptionId", "==", o.id).limit(1).get();
          if (!q.empty) {
            await q.docs[0].ref.set({ subscriptionStatus: o.status }, { merge: true });
          }
        }
        break;
      }

      default:
        /* Unhandled types are fine — acknowledge so Stripe stops retrying. */
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    /* 500 makes Stripe retry with backoff, which is what we want: better a
       retry than a customer who paid and was never upgraded. */
    console.error("[stripe-webhook] handler failed:", err);
    return res.status(500).json({ error: "Handler failed" });
  }
};
