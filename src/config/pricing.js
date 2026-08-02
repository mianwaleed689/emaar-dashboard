/**
 * DXB Analytics — PRICING
 * SINGLE SOURCE OF TRUTH. Change a price HERE and nowhere else.
 *
 * Created Session 9 (2026-04-10) after a pricing bug across 15 hardcoded
 * locations in 4 files.
 *
 * ── 2026-07-31: REPRICED FOR THE AGENT AND AGENCY MODEL ─────────────────────
 *
 *   Individual agent   AED 300/mo   (was 299 as "Pro")
 *   Agency             AED 500/mo   (was 799 as "Enterprise")
 *
 * The internal tier KEYS are unchanged — `free`, `pro_trial`, `pro`,
 * `enterprise` — because they appear roughly 370 times across the app, in user
 * records already written to Firestore, in access checks and in admin filters.
 * Renaming them would be a migration, not a price change. What changed is what
 * each tier costs and what it is called on screen:
 *
 *   pro         -> "Individual agent"
 *   enterprise  -> "Agency"
 *
 * ── ON THE AGENCY PRICE ─────────────────────────────────────────────────────
 *
 * At AED 500 an agency costs less than two individual agents at 300. That only
 * works if the agency plan carries seats, so `seats` below is the commercial
 * shape of the product, not a display detail. The numbers are an assumption made
 * to ship a working signup — confirm them before taking payment.
 */

export const PRICING = {
  free: 0,
  pro_trial: 0,
  pro: 300,          // individual agent, per month
  enterprise: 500,   // agency, per month
};

/** What each tier is called in front of a customer. */
export const PRICING_NAMES = {
  free: "Free",
  pro_trial: "Free trial",
  pro: "Individual agent",
  enterprise: "Agency",
};

export const PRICING_LABELS = {
  free: "Free",
  pro_trial: "Free trial",
  pro: "AED 300/mo",
  enterprise: "AED 500/mo",
};

export const PRICING_DISPLAY = {
  free: "AED 0",
  pro_trial: "Free",
  pro: "AED 300",
  enterprise: "AED 500",
};

/**
 * Seat allowances.
 *
 * CONFIRMED 2026-07-31: the agency plan includes ten agent seats. That is what
 * makes AED 500 coherent next to AED 300 for one person — an agency of three is
 * already better off, and an agency of ten is paying AED 50 a seat.
 *
 * This number is now a commitment rather than a placeholder: it is quoted on the
 * pricing page and enforced at invite time, so changing it changes what existing
 * agencies were sold. Change it here — every screen reads from this file — but
 * treat a reduction as a contract change, not a config tweak.
 *
 * Still open: removing an agent does not yet free their seat. That has to be
 * fixed before billing goes live, or a ten-seat agency hits the limit at nine.
 */
export const SEATS = {
  free: 1,
  pro_trial: 1,
  pro: 1,
  enterprise: 10,
};

/** Extra seats beyond the agency allowance. Null means "not offered yet". */
export const EXTRA_SEAT_PRICE = null;

/** What a customer actually gets. Used by the signup and the landing pitch. */
export const PLAN_FEATURES = {
  pro_trial: [
    "Full access for 7 days",
    "No card required",
    "Everything in the individual agent plan",
  ],
  pro: [
    "One agent",
    /* 29, not 34. Five tabs — Competitors, Developer Health, Financials,
       Dev Portal, Marketing — sit in the sidebar group labelled
       "NOT SHIPPED (ADMIN ONLY)" and are not visible to customers. Verified
       in the running app 2026-08-02. Selling 34 when 29 ship is the same
       defect as advertising a tool that renders nothing. */
    "All 29 research tabs",
    "24 years of market history with clickable sources",
    "Net yields after service charges, vacancy and management",
    "Lead and pipeline tracking",
  ],
  enterprise: [
    `Up to ${SEATS.enterprise} agents under one agency`,
    "Everything in the individual plan, for every seat",
    "Agency dashboard — see your whole team's pipeline",
    "Invite and remove agents yourself",
    "Priority support",
  ],
};

/** Ordered for display: what a visitor chooses between. */
export const PUBLIC_PLANS = ["pro", "enterprise"];

// Convenience getters kept for existing call sites.
export const PRO_PRICE = PRICING.pro;        // 300
export const ENT_PRICE = PRICING.enterprise; // 500

export default PRICING;
