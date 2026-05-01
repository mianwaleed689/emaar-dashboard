/**
 * useDevelopments ââ‚¬â€ returns master communities/developments from Firestore
 * src/hooks/useDevelopments.js
 *
 * "Developments" in this codebase means master communities like Dubai Hills
 * Estate, DAMAC Hills, Emaar Beachfront ââ‚¬â€ the level ABOVE individual project
 * variants. Edited in Admin â†â€™ Data Manager â†â€™ Developments.
 *
 * Example:
 *   const { data: developments } = useDevelopments();
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

export function useDevelopments({ onlyPublished = true } = {}) {
  return useFirestoreCollection({
    name: "developments",
    cacheKey: onlyPublished ? "published" : "all",
    filter: onlyPublished ? (d) => d.visibility === "published" : undefined,
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

export default useDevelopments;
