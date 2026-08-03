/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — UTILITY FUNCTIONS
   Extracted from EmaarDashboardV2.jsx
   Investment score, handover countdown, link helpers
   ═══════════════════════════════════════════════════════════════════ */

import { GOLDEN_VISA_THRESHOLD, MS_PER_DAY, APPROX_DAYS_PER_MONTH } from './constants';

/* ─── LINK DOMAIN HELPER ─── */
export const getLinkDomain = (url) => {
  if (!url) return "Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder.ae";
  if (url.includes("bayut.com")) return "Bayut.com";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar.com";
  return "Official Listing";
};

/* ─── HANDOVER COUNTDOWN ─── */
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

/* ─── INVESTMENT SCORE (out of 10) ─── */
/* FOUR DEAD SCORERS REMOVED — 2026-08-03.
   ═══════════════════════════════════════════════════════════════════════════
   None of these was imported by anything. They were exported through
   utils/index.js, so any future file could have picked one up by name and
   quietly shipped it. Each carried a fault worth naming so it does not come
   back:

   getInvestmentScore(p)  a 0-10 score from five invented weightings. Two of
                          them gave actively wrong advice. It awarded MORE
                          points the cheaper the price per square foot — telling
                          an investor the cheapest area is the best value,
                          regardless of what that area actually is. And it gave
                          an 80/20 payment plan full marks over a 50/50, when
                          80/20 means MORE cash out before handover; for a
                          cash-constrained buyer that ranking is backwards.
                          Its own comment said the handover sweet spot was
                          12-36 months while the code gave full marks only below
                          30 — the documented rule was not the implemented one.

   calcQuickScore(p)      a sixth scoring formula: base 50, +15 yield, +10
                          metro, +8 developer, +5 construction, clamped 40-99.
                          Nothing in the business chose those numbers, and a
                          floor of 40 means nothing can ever score badly.

   scoreLabel(s)          returned "Strong Buy" / "Buy" / "Hold" / "Caution".
                          NeighbourhoodsTab and ProjectsTab both carry comments
                          recording that these labels were removed from them —
                          but the function itself was left exported, one import
                          away from returning. A property platform telling a
                          customer "Strong Buy" is not a label, it is advice.

   scoreColor(s, T)       the traffic light those labels were painted in.

   The live equivalents in utils/scoring.js are about DATA COMPLETENESS
   ("Complete Data" / "Partial Data"), which is a fact about our records rather
   than a recommendation, and utils/investmentScore.js states its weights on
   screen and declares itself a judgement. Those stay. */

export const cleanPhone = (p) => {
  if (!p) return "";
  let out = "";
  for (let i = 0; i < p.length; i++) {
    const c = p.charCodeAt(i);
    if (c >= 48 && c <= 57) out += p[i];
  }
  return out;
};

/* ─── CSV ESCAPE — safe quoting ─── */
export const csvEsc = (v) => {
  const s = v == null ? "" : String(v);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') out += '"';
    out += s[i];
  }
  return '"' + out + '"';
};
