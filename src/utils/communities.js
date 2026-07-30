/**
 * One definition of "a community", shared by every tab.
 *
 * ── THE PROBLEM THIS SOLVES ─────────────────────────────────────────────────
 *
 * The same question — "how many communities do we cover?" — had two answers
 * depending on which tab you were looking at:
 *
 *     community dropdowns and pickers ....... 193
 *     yields, scores and the map ............ 281
 *
 * Both were reading real data, just filtered differently. The dropdown applied
 * a `displayCategory` filter; the yield and map tabs applied none.
 *
 * Measured on 2026-07-30 across all 281 neighbourhoodScores rows, joined
 * against the 253 documents in `communities`:
 *
 *     consumer-community ......... 140     marketed communities
 *     sub-community ............... 46     e.g. Dubai Hills Sidra 1
 *     master-community ............. 7     e.g. Dubai Hills Estate
 *                                  ───
 *     user-facing total ........... 193
 *
 *     cadastral-district ........... 60     DLD administrative zones
 *     absent from `communities` .... 28     also DLD cadastral names
 *                                  ───
 *     administrative total ......... 88
 *
 * The 88 are genuine DLD records, not junk — but they are administrative and
 * industrial zones, not places anyone buys a home to let. Al Goze Fourth reports
 * AED 386/sqft, Al Barsha Third 602, Al Quoz 1,000. Listed beside Dubai Hills
 * and Palm Jumeirah with no distinction, they read as bargain investment
 * communities, and a client who then searched for one found nothing, because the
 * dropdowns excluded them.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────
 *
 * Nothing is deleted or hidden. Every row keeps its data and gains a `kind`, so
 * a tab can choose deliberately — investor-facing lists show communities,
 * research and education views can show administrative districts too, clearly
 * labelled as such. What no tab does any more is mix the two silently.
 */

export const COMMUNITY_KIND = {
  MASTER: "master-community",
  SUB: "sub-community",
  CONSUMER: "consumer-community",
  CADASTRAL: "cadastral-district",
  UNCLASSIFIED: "unclassified",
};

/** Kinds a buyer or investor would recognise as a place to own property. */
const USER_FACING_KINDS = new Set([
  COMMUNITY_KIND.MASTER,
  COMMUNITY_KIND.SUB,
  COMMUNITY_KIND.CONSUMER,
]);

/** Shown to users beside an administrative row, so the difference is explicit. */
export const COMMUNITY_KIND_LABEL = {
  [COMMUNITY_KIND.MASTER]: "Master community",
  [COMMUNITY_KIND.SUB]: "Sub-community",
  [COMMUNITY_KIND.CONSUMER]: "Community",
  [COMMUNITY_KIND.CADASTRAL]: "DLD administrative district",
  [COMMUNITY_KIND.UNCLASSIFIED]: "DLD administrative district",
};

/**
 * Explains, in a sentence a non-specialist can act on, why an administrative
 * row is not directly comparable to a community. Shown in the UI rather than
 * kept as a code comment — the client is the one who needs to know.
 */
export const CADASTRAL_EXPLAINER =
  "A Dubai Land Department administrative zone rather than a marketed residential " +
  "community. Prices here cover every registered transaction in the zone, including " +
  "industrial, commercial and land sales, so they are not comparable to community " +
  "prices and should not be read as an investment yield.";

/** Normalise a name for matching between the two collections. */
export function normaliseCommunityName(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Build a name -> displayCategory lookup from the `communities` collection.
 * @param {Array<object>} communityDocs
 * @returns {Map<string,string>}
 */
export function buildCategoryLookup(communityDocs) {
  const map = new Map();
  (Array.isArray(communityDocs) ? communityDocs : []).forEach(d => {
    const key = normaliseCommunityName(d.name || d.community || d.id);
    if (key && d.displayCategory) map.set(key, d.displayCategory);
  });
  return map;
}

/**
 * Stamp `kind`, `kindLabel` and `isUserFacing` onto each scored community.
 *
 * Rows absent from `communities` are treated as UNCLASSIFIED, which is NOT
 * user-facing. All 28 such rows measured were DLD cadastral names (Al Jadaf,
 * Al Quoz, Al Hebiah First…), so defaulting them to administrative is the
 * accurate reading — and the conservative one, since it keeps an unverified row
 * out of investor-facing lists rather than quietly into them.
 *
 * Returns new objects; the input is not mutated.
 *
 * @param {Array<object>} rows  neighbourhoodScores records
 * @param {Array<object>} communityDocs  `communities` records
 */
export function annotateCommunities(rows, communityDocs) {
  if (!Array.isArray(rows)) return [];
  const lookup = buildCategoryLookup(communityDocs);

  return rows.map(r => {
    const key = normaliseCommunityName(r.name || r.community || r.id);
    const raw = lookup.get(key);
    const kind = raw && Object.values(COMMUNITY_KIND).includes(raw)
      ? raw
      : COMMUNITY_KIND.UNCLASSIFIED;
    return {
      ...r,
      kind,
      kindLabel: COMMUNITY_KIND_LABEL[kind],
      isUserFacing: USER_FACING_KINDS.has(kind),
    };
  });
}

/** True when this row belongs in an investor-facing list. */
export function isUserFacingCommunity(row) {
  if (!row) return false;
  if (typeof row.isUserFacing === "boolean") return row.isUserFacing;
  return USER_FACING_KINDS.has(row.kind || row.displayCategory);
}

/**
 * The investor-facing set — what every community list, dropdown, yield table and
 * map layer should show by default, so the count is the same everywhere.
 */
export function userFacingCommunities(rows) {
  return (Array.isArray(rows) ? rows : []).filter(isUserFacingCommunity);
}

/** The administrative remainder, for research and education views. */
export function administrativeCommunities(rows) {
  return (Array.isArray(rows) ? rows : []).filter(r => !isUserFacingCommunity(r));
}
