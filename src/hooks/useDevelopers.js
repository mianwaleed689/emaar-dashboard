/**
 * useDevelopers �€” returns all developers from Firestore
 * src/hooks/useDevelopers.js
 *
 * Example:
 *   const { data: developers, isLoading } = useDevelopers();
 *   const { data: allDevs } = useDevelopers({ onlyPublished: false });
 *
 * By default: only PUBLISHED developers, sorted by tier then reliability.
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

const TIER_RANK = { "tier-1": 1, "tier-2": 2, "tier-3": 3 };

export function useDevelopers({ onlyPublished = true } = {}) {
  return useFirestoreCollection({
    name: "developers",
    cacheKey: onlyPublished ? "published" : "all",
    filter: onlyPublished ? (d) => d.visibility === "published" : undefined,
    sort: (a, b) => {
      const ta = TIER_RANK[a.tier] ?? 9;
      const tb = TIER_RANK[b.tier] ?? 9;
      if (ta !== tb) return ta - tb;
      const ra = Number(a.reliability) || 0;
      const rb = Number(b.reliability) || 0;
      if (rb !== ra) return rb - ra;
      const pa = Number(a.totalProjects) || 0;
      const pb = Number(b.totalProjects) || 0;
      if (pb !== pa) return pb - pa;
      return (a.name || "").localeCompare(b.name || "");
    },
  });
}

export default useDevelopers;
