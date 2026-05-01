/**
 * DXB ANALYTICS �€” UNIFIED COMMUNITIES INDEX
 * All 40 communities across 7 developers
 * Single source of truth for all community data
 * 
 * Usage:
 *   import { allCommunities, getCommunityById, getCommunitiesByDeveloper } from "./communities/index"
 * 
 * Last updated: March 2026
 */

import { emaarCommunities }     from "./emaar.communities";
import { damacCommunities }     from "./damac.communities";
import { sobhaCommunities }     from "./sobha.communities";
import { nakheelCommunities }   from "./nakheel.communities";
import { meraasCommunitites }   from "./meraas.communities";
import { aldarCommunities }     from "./aldar.communities";
import { binghattiCommunities } from "./binghatti.communities";

// �”€�”€�”€ UNIFIED ALL COMMUNITIES �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
export const allCommunities = [
  ...emaarCommunities,
  ...damacCommunities,
  ...sobhaCommunities,
  ...nakheelCommunities,
  ...meraasCommunitites,
  ...aldarCommunities,
  ...binghattiCommunities,
];

// �”€�”€�”€ HELPER FUNCTIONS �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€

/** Get a single community by ID */
export const getCommunityById = (id) =>
  allCommunities.find(c => c.id === id) || null;

/** Get all communities for a developer */
export const getCommunitiesByDeveloper = (developerId) =>
  allCommunities.filter(c => c.developer === developerId);

/** Get community by district code */
export const getCommunityByCode = (districtCode) =>
  allCommunities.find(c => c.districtCode === districtCode) || null;

/** Get top communities by yield */
export const getTopYieldCommunities = (limit = 10) =>
  [...allCommunities]
    .sort((a, b) => (b.investment.avgYield || 0) - (a.investment.avgYield || 0))
    .slice(0, limit);

/** Get communities by investment rating */
export const getCommunitiesByRating = (rating) =>
  allCommunities.filter(c => c.investment.investmentRating === rating);

/** Get Golden Visa eligible communities */
export const getGoldenVisaCommunities = () =>
  allCommunities.filter(c => c.investment.goldenVisa === true);

/** Platform stats derived from community data */
export const communityStats = {
  total:            allCommunities.length,
  byDeveloper: {
    emaar:          emaarCommunities.length,
    damac:          damacCommunities.length,
    sobha:          sobhaCommunities.length,
    nakheel:        nakheelCommunities.length,
    meraas:         meraasCommunitites.length,
    aldar:          aldarCommunities.length,
    binghatti:      binghattiCommunities.length,
  },
  goldenVisa:       allCommunities.filter(c => c.investment.goldenVisa).length,
  aPlus:            allCommunities.filter(c => c.investment.investmentRating === "A+").length,
  aRated:           allCommunities.filter(c => c.investment.investmentRating?.startsWith("A")).length,
};

export default allCommunities;
