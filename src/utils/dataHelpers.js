/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ DXB ANALYTICS ‚‚Ç¨‚Äù DATA HELPERS ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨
   Resolves the 3-source community data conflict and provides
   shared calculation utilities used across the platform.

   Import: import { getMergedCommunity, isGoldenVisaEligible } from './utils/dataHelpers';
   ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */

import { emaarCommunities, communityROI, communityIntel } from "../data";

/**
 * Merge community data from all three static sources.
 * Merge order (later overwrites earlier):
 *   emaarCommunities base ‚Ü‚Äô communityROI ‚Ü‚Äô communityIntel ‚Ü‚Äô firestoreData (wins)
 *
 * @param {string} communityName - e.g. "Dubai Hills Estate"
 * @param {object|null} firestoreData - live data from Firestore admin edits (optional)
 * @returns {object} merged community object
 */
export const getMergedCommunity = (communityName, firestoreData = null) => {
  if (!communityName) return {};

  // 1. Base: emaarCommunities array
  const base = emaarCommunities.find(
    (c) => c.name?.toLowerCase() === communityName.toLowerCase()
  ) || {};

  // 2. ROI data ‚‚Ç¨‚Äù handle edge case where value might be nested object
  const rawRoi = communityROI[communityName];
  const roi = rawRoi
    ? typeof rawRoi === "object" && !Array.isArray(rawRoi)
      ? rawRoi
      : {}
    : {};

  // 3. Intel data
  const intel = communityIntel[communityName] || {};

  // 4. Merge ‚‚Ç¨‚Äù Firestore data always wins
  return {
    ...base,
    ...roi,
    ...intel,
    ...(firestoreData || {}),
    // Preserve the name so it's never lost
    name: communityName,
  };
};

/**
 * Get all communities with merged data.
 * @param {object} firestoreMap - { [communityName]: firestoreData } (optional)
 * @returns {Array} array of merged community objects
 */
export const getAllMergedCommunities = (firestoreMap = {}) => {
  const names = new Set([
    ...emaarCommunities.map((c) => c.name).filter(Boolean),
    ...Object.keys(communityROI),
    ...Object.keys(communityIntel),
  ]);

  return Array.from(names).map((name) =>
    getMergedCommunity(name, firestoreMap[name] || null)
  );
};

/**
 * Check if a project qualifies for the UAE Golden Visa.
 * Threshold: property value >= AED 2,000,000
 * @param {object} project
 * @returns {boolean}
 */
export const isGoldenVisaEligible = (project) => {
  if (!project) return false;
  const price = Number(project.price || project.priceMin || 0);
  return price >= 2_000_000;
};

/**
 * Calculate days remaining until handover.
 * @param {string} handover - quarter string e.g. "Q3 2027" OR ISO date string
 * @returns {number|null} days remaining (negative = already handed over)
 */
export const getDaysToHandover = (handover) => {
  if (!handover) return null;

  // Try quarter format: "Q3 2027"
  const quarterMatch = handover.match(/Q([1-4])\s+(\d{4})/);
  if (quarterMatch) {
    const q = parseInt(quarterMatch[1]);
    const year = parseInt(quarterMatch[2]);
    // End of the quarter month
    const monthEnd = q * 3; // Q1=3, Q2=6, Q3=9, Q4=12
    const target = new Date(year, monthEnd - 1, 28); // last week of quarter
    return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  // Try ISO / any parseable date
  const d = new Date(handover);
  if (!isNaN(d.getTime())) {
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return null;
};

/**
 * Format days to handover as a human-readable string.
 * @param {string} handover
 * @returns {string} e.g. "487 days" | "Handed Over" | "‚‚Ç¨‚Äù"
 */
export const formatHandoverCountdown = (handover) => {
  const days = getDaysToHandover(handover);
  if (days === null) return "‚‚Ç¨‚Äù";
  if (days < 0) return "Handed Over";
  if (days === 0) return "Today";
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
  const years = (days / 365).toFixed(1);
  return `${years} years`;
};

/**
 * Get the gross yield for a community + bed type combo.
 * @param {string} communityName
 * @param {'apt1'|'apt2'|'apt3'|'th'|'villa'} bedKey
 * @returns {number} yield percentage e.g. 6.07
 */
export const getGrossYield = (communityName, bedKey = "apt1") => {
  const roi = communityROI[communityName];
  if (!roi) return 0;
  return roi.grossYield?.[bedKey] || roi.grossYield?.apt1 || 0;
};
