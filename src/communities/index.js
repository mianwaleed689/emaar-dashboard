/**
 * DXB ANALYTICS �€” UNIFIED COMMUNITIES INDEX
 * 46 communities across 7 developers
 * Deep Audit verified: March 31, 2026
 * Sources: Property Finder UAE, Bayut, Official Developer IRs
 *
 * FIXES APPLIED:
 * FIX 1: DAMAC Bay removed �€” DAMAC Riverside + DAMAC Sun City added
 * FIX 2: emirate field on all communities
 * FIX 3: Dubai Hills Estate codev: "meraas" (JV attribution)
 * FIX 4: Nakheel + Meraas parentGroup: "Dubai Holding"
 * FIX 5: Jumeira Bay distance corrected
 * FIX 6: Binghatti communityType: "portfolio"
 * FIX 7: index.js updated with correct counts and new helpers
 */

import { emaarCommunities }     from "./emaar.communities";
import { damacCommunities }     from "./damac.communities";
import { sobhaCommunities }     from "./sobha.communities";
// Note: sobhaCommunities now includes Sobha Hartland, Sobha Hartland 2, 
//       Sobha Seahaven, Sobha One, Sobha Elwood (Dubai), Sobha Siniya Island (UAQ)
import { nakheelCommunities }   from "./nakheel.communities";
import { meraasCommunitites }   from "./meraas.communities";
import { aldarCommunities }     from "./aldar.communities";
import { binghattiCommunities } from "./binghatti.communities";

// UNIFIED ALL COMMUNITIES
export const allCommunities = [
  ...emaarCommunities,
  ...damacCommunities,
  ...sobhaCommunities,
  ...nakheelCommunities,
  ...meraasCommunitites,
  ...aldarCommunities,
  ...binghattiCommunities,
];

// DUBAI ONLY
export const dubaiCommunities = allCommunities.filter(c => c.emirate === "Dubai");

// ABU DHABI ONLY
export const abuDhabiCommunities = allCommunities.filter(c => c.emirate === "Abu Dhabi");

// MASTER COMMUNITIES ONLY (excludes Binghatti portfolio)
export const masterCommunities = allCommunities.filter(c => c.communityType !== "portfolio");

// HELPER FUNCTIONS

export const getCommunityById = (id) =>
  allCommunities.find(c => c.id === id) || null;

export const getCommunitiesByDeveloper = (developerId) =>
  allCommunities.filter(c => c.developer === developerId);

export const getCommunityByCode = (districtCode) =>
  allCommunities.find(c => c.districtCode === districtCode) || null;

export const getTopYieldCommunities = (limit = 10) =>
  [...allCommunities]
    .sort((a, b) => (b.investment.avgYield || 0) - (a.investment.avgYield || 0))
    .slice(0, limit);

export const getCommunitiesByRating = (rating) =>
  allCommunities.filter(c => c.investment.investmentRating === rating);

export const getGoldenVisaCommunities = () =>
  allCommunities.filter(c => c.investment.goldenVisa === true);

export const getCommunitiesByEmirate = (emirate) =>
  allCommunities.filter(c => c.emirate === emirate);

export const getCommunitiesByGroup = (group) =>
  allCommunities.filter(c => c.parentGroup === group);

export const searchCommunities = (query) => {
  const q = query.toLowerCase();
  return allCommunities.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.location?.area?.toLowerCase().includes(q) ||
    c.developer.includes(q) ||
    c.districtCode.toLowerCase().includes(q)
  );
};

// PLATFORM STATS
export const communityStats = {
  total:          allCommunities.length,
  dubaiCount:     dubaiCommunities.length,
  abuDhabiCount:  abuDhabiCommunities.length,
  masterCount:    masterCommunities.length,
  byDeveloper: {
    emaar:        emaarCommunities.length,
    damac:        damacCommunities.length,
    sobha:        sobhaCommunities.length,
    nakheel:      nakheelCommunities.length,
    meraas:       meraasCommunitites.length,
    aldar:        aldarCommunities.length,
    binghatti:    binghattiCommunities.length,
  },
  byGroup: {
    dubaiHolding: allCommunities.filter(c => c.parentGroup === "Dubai Holding").length,
  },
  goldenVisa:     allCommunities.filter(c => c.investment.goldenVisa).length,
  aPlus:          allCommunities.filter(c => c.investment.investmentRating === "A+").length,
  aRated:         allCommunities.filter(c => c.investment.investmentRating?.startsWith("A")).length,
  jointVentures:  allCommunities.filter(c => c.codev).length,
  lastAudit:      "2026-03-31",
};

export default allCommunities;
