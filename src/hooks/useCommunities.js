/**
 * useCommunities — returns sub-communities from Firestore
 * src/hooks/useCommunities.js
 *
 * "Communities" in this codebase is the communityData collection — the
 * sub-community level (e.g. "Fairways East" inside Dubai Hills Estate).
 * Edited in Admin → Data Manager → Communities.
 *
 * Example:
 *   const { data: communities } = useCommunities();
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

export function useCommunities({ onlyPublished = true } = {}) {
  return useFirestoreCollection({
    name: "communityData",
    cacheKey: onlyPublished ? "published" : "all",
    filter: onlyPublished ? (d) => d.visibility === "published" : undefined,
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

export default useCommunities;
