/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
   DXB ANALYTICS ‚‚Ç¨‚Äù UTILITY FUNCTIONS
   Extracted from EmaarDashboardV2.jsx
   Investment score, handover countdown, link helpers
   ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */

import { GOLDEN_VISA_THRESHOLD, MS_PER_DAY, APPROX_DAYS_PER_MONTH } from './constants';

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ LINK DOMAIN HELPER ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const getLinkDomain = (url) => {
  if (!url) return "Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder.ae";
  if (url.includes("bayut.com")) return "Bayut.com";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar.com";
  return "Official Listing";
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ HANDOVER COUNTDOWN ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const getHandoverCountdown = (handover) => {
  if (!handover) return null;
  const match = handover.match(/Q([1-4])\s+(\d{4})/);
  if (!match) return null;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const qEndMonth = [2, 5, 8, 11];
  const qEndDay   = [31, 30, 30, 31];
  const target = new Date(year, qEndMonth[q - 1], qEndDay[q - 1]);
  const now = new Date();
  const diffMs = target - now;
  if (diffMs <= 0) return { label: "Handover due", color: "#10B981", urgent: false, passed: true };
  const diffDays = Math.ceil(diffMs / MS_PER_DAY);
  const diffMonths = Math.round(diffMs / (MS_PER_DAY * APPROX_DAYS_PER_MONTH));
  let label, color;
  if (diffDays <= 90) { label = diffDays + "d left"; color = "#EF4444"; }
  else if (diffMonths <= 6) { label = diffMonths + "mo left"; color = "#F59E0B"; }
  else if (diffMonths <= 18) { label = diffMonths + "mo left"; color = "#D4A843"; }
  else { label = (diffMonths / 12).toFixed(1) + "yr left"; color = "#94A3B8"; }
  return { label, color, urgent: diffDays <= 90, months: diffMonths, days: diffDays };
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ INVESTMENT SCORE (out of 10) ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const getInvestmentScore = (p) => {
  let score = 0;
  const breakdown = [];

  // 1. Yield (0‚‚Ç¨‚Äú3 pts)
  const gross = p.gross || p.yield || 0;
  if (gross >= 8)      { score += 3; breakdown.push({ label: "Yield", pts: 3, max: 3, note: gross + "% gross" }); }
  else if (gross >= 6) { score += 2; breakdown.push({ label: "Yield", pts: 2, max: 3, note: gross + "% gross" }); }
  else if (gross >= 4) { score += 1; breakdown.push({ label: "Yield", pts: 1, max: 3, note: gross + "% gross" }); }
  else                 { breakdown.push({ label: "Yield", pts: 0, max: 3, note: gross ? gross + "%" : "No data" }); }

  // 2. Value (PPSF) (0‚‚Ç¨‚Äú2 pts)
  const ppsf = p.ppsf || 0;
  if (ppsf > 0 && ppsf <= 1500)       { score += 2; breakdown.push({ label: "Value", pts: 2, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0 && ppsf <= 2200)  { score += 1; breakdown.push({ label: "Value", pts: 1, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0)                  { breakdown.push({ label: "Value", pts: 0, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else                                { breakdown.push({ label: "Value", pts: 0, max: 2, note: "No PPSF" }); }

  // 3. Handover timing (0‚‚Ç¨‚Äú2 pts) ‚‚Ç¨‚Äù sweet spot is 12‚‚Ç¨‚Äú36 months
  const cd = getHandoverCountdown(p.handover);
  if (cd) {
    if (cd.passed)              { score += 1.5; breakdown.push({ label: "Handover", pts: 1.5, max: 2, note: "Ready now" }); }
    else if (cd.months <= 12)   { score += 1;   breakdown.push({ label: "Handover", pts: 1,   max: 2, note: cd.label }); }
    else if (cd.months <= 30)   { score += 2;   breakdown.push({ label: "Handover", pts: 2,   max: 2, note: cd.label }); }
    else if (cd.months <= 48)   { score += 1;   breakdown.push({ label: "Handover", pts: 1,   max: 2, note: cd.label }); }
    else                        { score += 0.5; breakdown.push({ label: "Handover", pts: 0.5, max: 2, note: cd.label }); }
  } else {
    breakdown.push({ label: "Handover", pts: 0, max: 2, note: "No date" });
  }

  // 4. Payment plan (0‚‚Ç¨‚Äú2 pts)
  const pp = (p.paymentPlan || p.payment || "").toLowerCase();
  if (pp.includes("80/20") || pp.includes("80:20"))       { score += 2;   breakdown.push({ label: "Payment", pts: 2,   max: 2, note: "80/20 plan" }); }
  else if (pp.includes("70/30") || pp.includes("60/40"))  { score += 1.5; breakdown.push({ label: "Payment", pts: 1.5, max: 2, note: pp }); }
  else if (pp.includes("50/50") || pp.includes("40/60"))  { score += 1;   breakdown.push({ label: "Payment", pts: 1,   max: 2, note: pp }); }
  else if (pp.length > 0)                                 { score += 0.5; breakdown.push({ label: "Payment", pts: 0.5, max: 2, note: pp }); }
  else                                                    { breakdown.push({ label: "Payment", pts: 0, max: 2, note: "Unknown" }); }

  // 5. Golden Visa eligible (0‚‚Ç¨‚Äú1 pt)
  if (p.price && p.price >= GOLDEN_VISA_THRESHOLD) {
    score += 1; breakdown.push({ label: "Golden Visa", pts: 1, max: 1, note: "Eligible" });
  } else {
    breakdown.push({ label: "Golden Visa", pts: 0, max: 1, note: p.price ? "Below 2M" : "No price" });
  }

  const final = Math.min(10, Math.round(score * 10) / 10);
  const color = final >= 8 ? "#10B981" : final >= 6 ? "#D4A843" : final >= 4 ? "#F59E0B" : "#EF4444";
  const label = final >= 8 ? "Excellent" : final >= 6 ? "Strong" : final >= 4 ? "Good" : "Weak";
  return { score: final, color, label, breakdown };
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ QUICK INVESTMENT SCORE (used by Projects tab) ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const calcQuickScore = (p) => {
  if (p && p.investmentScore) return p.investmentScore;
  if (!p) return 50;
  let s = 50;
  if (p.grossYield >= 8) s += 15; else if (p.grossYield >= 6) s += 10; else if (p.grossYield >= 4) s += 5;
  if (p.distMetro <= 0.8) s += 10; else if (p.distMetro <= 2) s += 6; else if (p.distMetro <= 5) s += 3;
  if ((p.developerScore || 70) >= 90) s += 8; else if ((p.developerScore || 70) >= 80) s += 5;
  if ((p.constructionPct || 0) >= 50) s += 5;
  return Math.min(99, Math.max(40, s));
};

export const scoreColor = (s, T) => s >= 80 ? T.green : s >= 65 ? T.gold : T.red;
export const scoreLabel = (s) => s >= 80 ? "Strong Buy" : s >= 65 ? "Buy" : s >= 50 ? "Hold" : "Caution";

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ PHONE CLEANER ‚‚Ç¨‚Äù strips non-digits ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const cleanPhone = (p) => {
  if (!p) return "";
  let out = "";
  for (let i = 0; i < p.length; i++) {
    const c = p.charCodeAt(i);
    if (c >= 48 && c <= 57) out += p[i];
  }
  return out;
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ CSV ESCAPE ‚‚Ç¨‚Äù safe quoting ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const csvEsc = (v) => {
  const s = v == null ? "" : String(v);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') out += '"';
    out += s[i];
  }
  return '"' + out + '"';
};
