/**
 * src/lib/communities.js
 *
 * THE single source of truth for reading communities from Firestore.
 * Every component, tab, and page that needs community data imports from here.
 * Never read from `communityData` (legacy, empty) or derive from projects.
 *
 * Schema (per Sessions 2-4.5):
 *   - displayCategory: "consumer-community" | "master-community" | "sub-community" |
 *                      "cadastral-district" | "duplicate-merge"
 *   - parentCommunity: id of parent (only for sub-community)
 *   - cadastralCode:  DLD admin code reference (optional)
 *   - aliases:        searchable alternative names (e.g., ["JLT", "TECOM"])
 *   - area:           Dubai sector (e.g., "New Dubai", "Bur Dubai")
 *
 * Tier classification:
 *   Tier A (consumer):    99 user-searchable communities
 *   Tier B (master):      7  district parents containing sub-communities
 *   Tier C (sub):         46 branded sub-developments with parentCommunity
 *   Tier D (cadastral):   60 DLD codes (HIDDEN from users by default)
 *   Total:                212 docs in `communities` collection
 */

import { useFirestoreCollection } from "../hooks/useFirestoreCollection";

// User-facing tiers �€” what end users should see
export const USER_FACING_CATEGORIES = new Set([
  "consumer-community",
  "master-community",
  "sub-community",
]);

// Hidden tiers �€” admin only
export const HIDDEN_CATEGORIES = new Set([
  "cadastral-district",
  "duplicate-merge",
]);

/**
 * Filter predicate for user-facing communities.
 * Hides: cadastral districts, duplicates, archived docs.
 */
export function isUserFacing(doc) {
  if (!doc) return false;
  if (!USER_FACING_CATEGORIES.has(doc.displayCategory)) return false;
  if (doc.visibility === "archived") return false;
  if (!doc.name && !doc.community) return false;
  return true;
}

/**
 * Hook: returns user-facing communities (Tier A/B/C).
 * Use this in 90% of cases �€” anywhere users see a list of communities.
 *
 * @returns {{ data: Array, isLoading: boolean }}
 */
export function useUserFacingCommunities() {
  return useFirestoreCollection({
    name: "communities",
    cacheKey: "user-facing",
    filter: isUserFacing,
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

/**
 * Hook: returns ALL communities including cadastral and duplicates.
 * Only for admin/data-management views.
 */
export function useAllCommunities() {
  return useFirestoreCollection({
    name: "communities",
    cacheKey: "all",
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

/**
 * Hook: returns only consumer communities (Tier A).
 * Use when you specifically want the 99 main user-searchable communities.
 */
export function useConsumerCommunities() {
  return useFirestoreCollection({
    name: "communities",
    cacheKey: "consumer-only",
    filter: (d) => d.displayCategory === "consumer-community" && d.visibility !== "archived",
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

/**
 * Helper: find a community by name (case-insensitive, checks aliases too).
 */
export function findCommunityByName(communities, name) {
  if (!communities || !name) return null;
  const target = String(name).toLowerCase().trim();
  // First exact match on name
  let match = communities.find(c => (c.name || "").toLowerCase() === target);
  if (match) return match;
  // Then alias match
  match = communities.find(c => Array.isArray(c.aliases) && c.aliases.some(a => String(a).toLowerCase() === target));
  if (match) return match;
  // Then partial name match
  match = communities.find(c => (c.name || "").toLowerCase().includes(target));
  return match || null;
}

/**
 * Helper: get a flat list of {value, label, count} for dropdown rendering.
 * Optionally filter to only communities with projects.
 */
export function toDropdownOptions(communities, { onlyWithProjects = false } = {}) {
  if (!communities) return [];
  let list = communities;
  if (onlyWithProjects) {
    list = list.filter(c => (c.totalProjects || 0) > 0);
  }
  return list.map(c => ({
    value: c.name,
    label: c.name,
    count: c.totalProjects || 0,
    displayCategory: c.displayCategory,
    parentCommunity: c.parentCommunity || null,
  }));
}

/**
 * Helper: enrich a project doc with its full community record (lookup).
 * Returns { project, community } or { project, community: null } if not found.
 */
export function enrichProjectWithCommunity(project, communities) {
  if (!project || !communities) return { project, community: null };
  const name = project.community || project.area;
  return {
    project,
    community: findCommunityByName(communities, name),
  };
}