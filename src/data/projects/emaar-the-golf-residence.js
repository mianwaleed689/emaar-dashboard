/* ═══════════════════════════════════════════════════════════════════════
   THE GOLF RESIDENCE · Emaar Properties · Dubai Hills Estate
   ─────────────────────────────────────────────────────────────────────────
   Last verified: NOT YET AUDITED
   Audit status: MIGRATED FROM data.js — needs research verification
   ═══════════════════════════════════════════════════════════════════════ */

const project = {
  /* ─── IDENTITY ─── */
  id: "emaar-the-golf-residence",
  project: "The Golf Residence",
  name: "The Golf Residence",
  developer: "Emaar Properties",
  developerId: "emaar-properties",
  community: "Dubai Hills Estate",
  district: "DHE",
  emirate: "Dubai",
  type: "Apartment",
  tier: 1,

  /* ─── STATUS ─── */
  status: "Off-Plan",
  lifecycleStage: "under-construction",
  constructionPct: 90,

  /* ─── PRICING ─── */
  priceMin: 1750000,
  price: 1750000,
  ppsf: 2333,
  sizeFrom: 750,
  sizeTo: 2200,

  /* ─── YIELD ─── */
  grossYield: null,
  netYield: null,

  /* ─── BEDS ─── */
  beds: ["1 BR", "2 BR", "3 BR"],

  /* ─── PAYMENT ─── */
  paymentPlan: "20/30/50",
  payment: "20/30/50",

  /* ─── HANDOVER ─── */
  handover: "Q2 2026",
  expectedHandover: "Q2 2026",

  /* ─── PRODUCT ─── */
  goldenVisa: false,
  branded: false,
  brand: "—",
  tierLabel: "Mid-Premium",

  /* ─── LINKS ─── */
  emaarUrl: "https://www.propertyfinder.ae/en/new-projects/emaar-properties/the-golf-residence",

  /* ─── AUDIT METADATA ─── */
  _audit: {
    lastVerified: null,
    dataQuality: "unverified",
    sources: ["Migrated from data.js — needs verification"],
    flags: [
      { field: "reraNo", status: "missing", note: "RERA number not yet sourced" },
      { field: "totalUnits", status: "missing", note: "Unit count not yet sourced" },
      { field: "unitBreakdown", status: "missing", note: "Per-unit pricing not yet sourced" },
      { field: "amenities", status: "missing", note: "Amenity list not yet sourced" },
      { field: "grossYield", status: "missing", note: "Yield benchmark required" },
      { field: "escrowBank", status: "missing", note: "Confirm via DLD Mashrooi" },
      { field: "distMetro", status: "missing", note: "Distance data needed" },
    ],
    corrections: 0,
    needsResearch: true,
  },
};

export default project;
