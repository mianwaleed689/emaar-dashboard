/**
 * BRINGING OLD DEALS ONTO THE NEW MODEL — WITHOUT GUESSING.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Deals already in Firestore were written against one five-stage pipeline:
 *
 *     EOI → Booking → SPA → DLD → Completed
 *
 * with a `type` of "Off-Plan" or "Secondary". Off-plan deals map across cleanly,
 * because those five stages ARE the off-plan journey.
 *
 * Secondary deals do not, and this is the part worth being careful about. A
 * resale has no EOI and no SPA, so a resale sitting on stage "SPA" is not
 * telling us where that deal actually is — it is telling us that the only
 * pipeline available did not fit and somebody picked the nearest label.
 * Translating "SPA" into "Form F signed" would be a guess, and a guess written
 * into a deal record looks exactly like a fact a week later.
 *
 * So: what maps, maps. What does not is marked `needsReview` and the tab asks
 * the person who owns the deal where it really is. One question to a human
 * beats a silent invention.
 */
import { JOURNEYS } from "./journeys.js";

/** Old `type` values, and anything close to them. */
export function journeyFromLegacy(deal) {
  const t = String(deal?.type || "").toLowerCase();
  if (t.includes("off")) return "offplan";
  if (t.includes("rent") || t.includes("lease") || t.includes("tenan")) return "rental";
  if (t.includes("second") || t.includes("resale")) return "secondary";
  return "secondary";                       // the commonest deal, and the safest default
}

/* The five old stages were an off-plan pipeline, so off-plan maps exactly.
   "DLD" meant registered with the Land Department, which is Oqood. */
const OFFPLAN_MAP = {
  EOI: "eoi", Booking: "booking", SPA: "spa", DLD: "oqood", Completed: "handover",
};

/* For a resale, only the endpoints carry real meaning. "Completed" genuinely
   means the transfer happened. The three middle stages do not exist in a resale
   and cannot be translated honestly. */
const SECONDARY_MAP = { Completed: "transferred" };

const RENTAL_MAP = { Completed: "keys" };

export function migrateDeal(deal) {
  const journey = deal?.journey && JOURNEYS[deal.journey]
    ? deal.journey
    : journeyFromLegacy(deal);

  /* Already on a valid new stage — nothing to do. */
  if (deal?.stage && JOURNEYS[journey].stages.some(s => s.key === deal.stage)) {
    return { ...deal, journey, needsReview: false };
  }

  const map = journey === "offplan" ? OFFPLAN_MAP
            : journey === "rental"  ? RENTAL_MAP
            : SECONDARY_MAP;
  const mapped = map[deal?.stage];

  if (mapped) return { ...deal, journey, stage: mapped, needsReview: false };

  return {
    ...deal,
    journey,
    stage: JOURNEYS[journey].stages[0].key,
    needsReview: true,
    reviewReason:
      `This deal was recorded as "${deal?.stage || "no stage"}" on the old pipeline, ` +
      `which had one set of stages for every kind of deal. A ${JOURNEYS[journey].label.toLowerCase()} ` +
      `has no such stage, so rather than guess, please set where this deal actually is.`,
  };
}

export const migrateDeals = (deals = []) => (deals || []).map(migrateDeal);

/**
 * The old `commission` was one typed number with no rate, side, VAT or split
 * behind it. It is kept as a single line at face value and flagged, so the
 * figure an agency already relied on does not vanish, and nobody is told a
 * split was agreed when it was not.
 */
export function migrateCommission(deal) {
  if (Array.isArray(deal?.commissionLines)) return deal.commissionLines;
  const amount = parseFloat(deal?.commission) || 0;
  if (!amount) return [];
  return [{
    legacy: true,
    base: parseFloat(deal?.price) || 0,
    ratePct: parseFloat(deal?.price) ? (amount / parseFloat(deal.price)) * 100 : 0,
    grossOverride: amount,
    agentId: deal?.agentId || "",
    state: deal?.stage === "Completed" ? "received" : "due",
    note: "Carried over from the old single commission field. The rate shown is " +
          "worked back from the amount; the side, VAT treatment and agent split " +
          "were never recorded, so confirm them before paying anything out.",
  }];
}
