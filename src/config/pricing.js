/**
 * DXB Analytics - Pricing Config
 * SINGLE SOURCE OF TRUTH for all pricing across the app.
 *
 * If you need to change a price, change it HERE ONLY.
 * Every tab imports from this file.
 *
 * Created: Session 9 (2026-04-10)
 * Reason: Fixed pricing bug across 15 hardcoded locations in 4 files.
 */

export const PRICING = {
  pro: 299,
  enterprise: 799,
  pro_trial: 0,
  free: 0,
};

export const PRICING_LABELS = {
  pro: "AED 299/mo",
  enterprise: "AED 799/mo",
  pro_trial: "Free trial",
  free: "Free",
};

export const PRICING_DISPLAY = {
  pro: "AED 299",
  enterprise: "AED 799",
};

// Convenience getters for the most common patterns
export const PRO_PRICE = PRICING.pro;        // 299
export const ENT_PRICE = PRICING.enterprise; // 799

// Default export for legacy patterns
export default PRICING;