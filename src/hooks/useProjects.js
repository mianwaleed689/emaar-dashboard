/**
 * useProjects — returns individual project variants from Firestore
 * src/hooks/useProjects.js
 *
 * "Projects" = individual buildings/tower/villa clusters within a development.
 * Edited in Admin → Data Manager → Projects.
 *
 * Example:
 *   const { data: projects } = useProjects();
 *
 * Note: if you need projects filtered by developer/community/type/price, use
 * the useFilteredProjects hook (Phase 2.2) which reads from URL filter state.
 * This hook returns the full list — slice it locally if needed.
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

export function useProjects({ onlyPublished = true } = {}) {
  return useFirestoreCollection({
    name: "projects",
    cacheKey: onlyPublished ? "published" : "all",
    filter: onlyPublished ? (d) => d.visibility === "published" : undefined,
    sort: (a, b) => (a.name || "").localeCompare(b.name || ""),
  });
}

export default useProjects;
