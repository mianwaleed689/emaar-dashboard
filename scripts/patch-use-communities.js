const fs = require('fs');
const path = 'src/hooks/useCommunities.js';

const newContent = `/**
 * useCommunities — returns user-facing communities from Firestore
 * src/hooks/useCommunities.js
 *
 * Reads from the unified "communities" collection (post Phase A1 / Sessions 2-4.5).
 * Returns Tier A (consumer), Tier B (master), and Tier C (sub-community) docs.
 * Hides Tier D cadastral districts (DLD admin codes — not user-facing) and any
 * duplicate-merge docs by default.
 *
 * Schema source of truth: COMMUNITIES_TAXONOMY_RESEARCH.md
 *
 * Example:
 *   const { data: communities } = useCommunities();
 *   // -> [{ id, name, displayCategory: "consumer-community", ... }, ...]
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

const USER_FACING_CATEGORIES = new Set([
  "consumer-community",
  "master-community",
  "sub-community",
]);

export function useCommunities({ onlyPublished = true, includeAllTiers = false } = {}) {
  return useFirestoreCollection({
    name: "communities",
    cacheKey: (onlyPublished ? "pub" : "all") + ":" + (includeAllTiers ? "all-tiers" : "user-facing"),
    filter: (d) => {
      // Hide cadastral and duplicates from user-facing reads
      if (!includeAllTiers) {
        if (!USER_FACING_CATEGORIES.has(d.displayCategory)) return false;
      }
      // Visibility check (preserved from old behavior)
      if (onlyPublished && d.visibility && d.visibility !== "published") return false;
      // Hide archived always
      if (d.visibility === "archived") return false;
      return true;
    },
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

export default useCommunities;
`;

fs.writeFileSync(path, newContent, 'utf8');
console.log('Updated: ' + path);
console.log('Length: ' + newContent.length + ' chars');