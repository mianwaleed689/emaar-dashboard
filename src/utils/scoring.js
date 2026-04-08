/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — INVESTMENT SCORING (single source of truth)
   src/utils/scoring.js

   This is the ONE place scoring logic lives. Every tab that
   displays an investment score imports from here. Do not
   duplicate this logic in tab files.

   Internal math uses a 0–10 scale for precision. The public
   getScore(p) wraps it to 0–100 which is what the UI displays.
   ───────────────────────────────────────────────────────────── */

// Handover countdown helper — kept internal to scoring because
// timing is a scoring factor. If other files need handover math,
// extract it to its own utility in a later session.
function getHandoverCountdown(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const passed = ms < 0;
  let label;
  if (passed) label = "Ready";
  else if (months < 1) label = days + " days";
  else if (months < 12) label = months + " months";
  else label = Math.floor(months / 12) + "y " + (months % 12) + "m";
  return { passed, days, months, label };
}

// ── Internal scorer — returns 0–10 with breakdown ─────────────
function getInvestmentScoreInternal(p) {
  let score = 0;
  const breakdown = [];

  // 1. Yield (0–3 pts)
  const gross = p.gross || p.yield || p.grossYield || 0;
  if (gross >= 8)      { score += 3; breakdown.push({ label: "Yield", pts: 3, max: 3, note: gross + "% gross" }); }
  else if (gross >= 6) { score += 2; breakdown.push({ label: "Yield", pts: 2, max: 3, note: gross + "% gross" }); }
  else if (gross >= 4) { score += 1; breakdown.push({ label: "Yield", pts: 1, max: 3, note: gross + "% gross" }); }
  else                 { breakdown.push({ label: "Yield", pts: 0, max: 3, note: gross ? gross + "%" : "No data" }); }

  // 2. Value (PPSF) (0–2 pts)
  const ppsf = p.ppsf || 0;
  if (ppsf > 0 && ppsf <= 1500)      { score += 2; breakdown.push({ label: "Value", pts: 2, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0 && ppsf <= 2200) { score += 1; breakdown.push({ label: "Value", pts: 1, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0)                 { breakdown.push({ label: "Value", pts: 0, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else                               { breakdown.push({ label: "Value", pts: 0, max: 2, note: "No PPSF" }); }

  // 3. Handover timing (0–2 pts) — sweet spot is 12–30 months
  const cd = getHandoverCountdown(p.handover);
  if (cd) {
    if (cd.passed)            { score += 1.5; breakdown.push({ label: "Handover", pts: 1.5, max: 2, note: "Ready now" }); }
    else if (cd.months <= 12) { score += 1;   breakdown.push({ label: "Handover", pts: 1,   max: 2, note: cd.label }); }
    else if (cd.months <= 30) { score += 2;   breakdown.push({ label: "Handover", pts: 2,   max: 2, note: cd.label }); }
    else if (cd.months <= 48) { score += 1;   breakdown.push({ label: "Handover", pts: 1,   max: 2, note: cd.label }); }
    else                      { score += 0.5; breakdown.push({ label: "Handover", pts: 0.5, max: 2, note: cd.label }); }
  } else {
    breakdown.push({ label: "Handover", pts: 0, max: 2, note: "No date" });
  }

  // 4. Payment plan (0–2 pts)
  const pp = (p.paymentPlan || p.payment || "").toLowerCase();
  if (pp.includes("80/20") || pp.includes("80:20"))       { score += 2;   breakdown.push({ label: "Payment", pts: 2,   max: 2, note: "80/20 plan" }); }
  else if (pp.includes("70/30") || pp.includes("60/40"))  { score += 1.5; breakdown.push({ label: "Payment", pts: 1.5, max: 2, note: pp }); }
  else if (pp.includes("50/50") || pp.includes("40/60"))  { score += 1;   breakdown.push({ label: "Payment", pts: 1,   max: 2, note: pp }); }
  else if (pp.length > 0)                                 { score += 0.5; breakdown.push({ label: "Payment", pts: 0.5, max: 2, note: pp }); }
  else                                                    { breakdown.push({ label: "Payment", pts: 0, max: 2, note: "Unknown" }); }

  // 5. Golden Visa eligible (0–1 pt)
  if (p.price && p.price >= 2000000) {
    score += 1; breakdown.push({ label: "Golden Visa", pts: 1, max: 1, note: "Eligible" });
  } else {
    breakdown.push({ label: "Golden Visa", pts: 0, max: 1, note: p.price ? "Below 2M" : "No price" });
  }

  return { raw: Math.min(10, Math.round(score * 10) / 10), breakdown };
}

// ── Canonical color function (used by every tab) ──────────────
export const scoreColor = (s) => {
  if (s >= 80) return "#10B981"; // green — Strong Buy
  if (s >= 65) return "#D4A843"; // gold — Buy
  if (s >= 50) return "#F59E0B"; // amber — Hold
  return "#EF4444";              // red — Caution
};

// ── Canonical label function ──────────────────────────────────
export const scoreLabel = (s) => {
  if (s >= 80) return "Strong Buy";
  if (s >= 65) return "Buy";
  if (s >= 50) return "Hold";
  return "Caution";
};

// ── Public API ────────────────────────────────────────────────
// Returns { score: 0–100, color, label, breakdown }
// Every tab uses this. Do not write your own scorer.
export function getScore(p) {
  // If a pre-computed score is on the project (e.g. from Firestore), honor it.
  // This lets an admin override the calculated score without code changes.
  if (p && typeof p.investmentScore === "number") {
    const s = p.investmentScore;
    return { score: s, color: scoreColor(s), label: scoreLabel(s), breakdown: [] };
  }
  if (!p) return { score: 0, color: scoreColor(0), label: scoreLabel(0), breakdown: [] };

  const internal = getInvestmentScoreInternal(p);
  const final = Math.round(internal.raw * 10); // 0–10 → 0–100
  return {
    score: final,
    color: scoreColor(final),
    label: scoreLabel(final),
    breakdown: internal.breakdown,
  };
}

// Convenience: just the number, for places that only need the score value
export const calcScore = (p) => getScore(p).score;