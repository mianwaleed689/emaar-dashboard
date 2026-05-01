/* �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
   DXB ANALYTICS �€” DATA COMPLETENESS SCORING
   src/utils/scoring.js
   
   IMPORTANT: This file previously contained investment scoring
   with "Strong Buy/Buy/Hold/Caution" labels. That has been REMOVED
   because unlicensed investment advice violates UAE RERA law.
   
   This version measures DATA QUALITY ONLY �€” what percentage of
   verifiable project fields are filled in from authoritative
   sources (DLD Mashrooi, RERA, developer filings).
   
   A high score means "we have lots of data" �€” NOT "good investment".
   �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€ */

/* Fields we consider for data completeness.
   Weighted by importance to the user's decision-making. */
const DATA_FIELDS = [
  /* CORE IDENTITY (25 points) �€” must-have basics */
  { field: "project",           weight: 3, check: (p) => !!(p.project || p.name || p.projectName) },
  { field: "developer",         weight: 3, check: (p) => !!(p.developer || p.developerName) },
  { field: "community",         weight: 3, check: (p) => !!(p.community || p.area) },
  { field: "type",              weight: 2, check: (p) => !!(p.type || p.propertyType) },
  { field: "status",            weight: 2, check: (p) => !!p.status },
  { field: "handover",          weight: 3, check: (p) => !!(p.handover || p.handoverDate) },
  { field: "totalUnits",        weight: 2, check: (p) => !!p.totalUnits },
  { field: "totalFloors",       weight: 1, check: (p) => !!p.totalFloors },
  { field: "plotSize",          weight: 2, check: (p) => !!(p.plotSize || p.plotSizeSqM) },
  { field: "dldProjectNumber",  weight: 2, check: (p) => !!p.dldProjectNumber },
  { field: "reraNo",            weight: 2, check: (p) => !!(p.reraNo || p.reraProjectNumber) },

  /* PRICING (20 points) */
  { field: "priceMin",          weight: 4, check: (p) => !!p.priceMin },
  { field: "priceMax",          weight: 2, check: (p) => !!p.priceMax },
  { field: "ppsf",              weight: 3, check: (p) => !!p.ppsf },
  { field: "paymentPlan",       weight: 3, check: (p) => !!p.paymentPlan },
  { field: "unitBreakdown",     weight: 4, check: (p) => Array.isArray(p.unitBreakdown) && p.unitBreakdown.length > 0 },
  { field: "priceAvg",          weight: 1, check: (p) => !!p.priceAvg },
  { field: "beds",              weight: 3, check: (p) => Array.isArray(p.beds) && p.beds.length > 0 },

  /* LOCATION (15 points) */
  { field: "distMetro",         weight: 2, check: (p) => p.distMetro != null },
  { field: "distAirport",       weight: 1, check: (p) => p.distAirport != null },
  { field: "distDIFC",          weight: 1, check: (p) => p.distDIFC != null },
  { field: "distMall",          weight: 1, check: (p) => p.distMall != null },
  { field: "distSchool",        weight: 1, check: (p) => p.distSchool != null },
  { field: "distHospital",      weight: 1, check: (p) => p.distHospital != null },
  { field: "distBeach",         weight: 1, check: (p) => p.distBeach != null },
  { field: "coordinates",       weight: 2, check: (p) => !!p.coordinates && !!p.coordinates.lat },
  { field: "nearestMetro",      weight: 1, check: (p) => !!p.nearestMetro },

  /* LEGAL & COMPLIANCE (15 points) */
  { field: "escrowBank",        weight: 3, check: (p) => !!p.escrowBank },
  { field: "escrowActive",      weight: 2, check: (p) => p.escrowActive === true },
  { field: "dldRegistered",     weight: 2, check: (p) => p.dldRegistered === true },
  { field: "freehold",          weight: 1, check: (p) => p.freehold === true },
  { field: "mortgageAvailable", weight: 1, check: (p) => !!p.mortgageAvailable },
  { field: "goldenVisa",        weight: 2, check: (p) => p.goldenVisa === true || p.goldenVisa === false },

  /* YIELD & FINANCIALS (10 points) */
  { field: "grossYield",        weight: 3, check: (p) => !!p.grossYield },
  { field: "netYield",          weight: 2, check: (p) => !!p.netYield },
  { field: "serviceCharge",     weight: 2, check: (p) => !!p.serviceCharge },

  /* CONSTRUCTION DATA (10 points) */
  { field: "constructionPct",   weight: 3, check: (p) => p.constructionPct != null },
  { field: "constructionStart", weight: 1, check: (p) => !!p.constructionStart },
  { field: "registeredDate",    weight: 1, check: (p) => !!p.registeredDate },
  { field: "expectedHandover",  weight: 2, check: (p) => !!(p.expectedHandover || p.handover) },

  /* QUALITATIVE DATA (5 points) �€” nice-to-have */
  { field: "amenities",         weight: 2, check: (p) => Array.isArray(p.amenities) && p.amenities.length >= 3 },
  { field: "view",              weight: 1, check: (p) => Array.isArray(p.view) && p.view.length > 0 },
  { field: "interiorFinish",    weight: 1, check: (p) => !!p.interiorFinish },
  { field: "sources",           weight: 1, check: (p) => Array.isArray(p.sources) && p.sources.length > 0 },
];

/* Total possible = sum of all weights */
const MAX_SCORE = DATA_FIELDS.reduce((s, f) => s + f.weight, 0);

/* �”€�”€ Internal: compute data completeness 0-100 �”€�”€ */
function computeDataCompleteness(p) {
  if (!p) return { score: 0, filled: 0, total: DATA_FIELDS.length, breakdown: [] };

  let earned = 0;
  const breakdown = [];
  let filled = 0;

  DATA_FIELDS.forEach(({ field, weight, check }) => {
    const ok = check(p);
    if (ok) {
      earned += weight;
      filled++;
    }
    breakdown.push({ field, weight, filled: ok });
  });

  const score = Math.round((earned / MAX_SCORE) * 100);
  return { score, filled, total: DATA_FIELDS.length, breakdown };
}

/* �”€�”€ Color ranges �€” based on how complete the data is �”€�”€ */
export const scoreColor = (s) => {
  if (s >= 85) return "#10B981"; // green �€” high-quality data
  if (s >= 65) return "#D4A843"; // gold �€” good coverage
  if (s >= 40) return "#F59E0B"; // amber �€” partial data
  return "#6B7280";              // grey �€” minimal data
};

/* �”€�”€ Data quality labels (NOT investment labels) �”€�”€ */
export const scoreLabel = (s) => {
  if (s >= 85) return "Complete Data";
  if (s >= 65) return "Mostly Complete";
  if (s >= 40) return "Partial Data";
  return "Minimal Data";
};

/* �”€�”€ Public API �”€�”€ */
export function getScore(p) {
  const result = computeDataCompleteness(p);
  return {
    score: result.score,
    color: scoreColor(result.score),
    label: scoreLabel(result.score),
    filled: result.filled,
    total: result.total,
    breakdown: result.breakdown,
  };
}

/* �”€�”€ Convenience: just the number �”€�”€ */
export const calcScore = (p) => getScore(p).score;

/* �”€�”€ DEPRECATED (kept for compatibility but does nothing special) �”€�”€ */
export function getInvestmentScoreInternal() {
  /* Returns empty breakdown. Investment scoring removed for RERA compliance. */
  return { raw: 0, breakdown: [] };
}
