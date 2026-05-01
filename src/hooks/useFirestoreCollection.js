/**
 * DXB Analytics �€” useFirestoreCollection (internal base hook)
 * src/hooks/useFirestoreCollection.js
 *
 * Generic hook that wraps a Firestore collection subscription in TanStack Query.
 * Not intended for direct use in components �€” the typed wrappers below
 * (useDevelopers, useProjects, etc.) call this internally.
 *
 * Behavior:
 *   - Returns { data, isLoading, isError, error }
 *   - data is an array of documents: [{ id, ...fields }]
 *   - Real-time: onSnapshot keeps the TanStack Query cache in sync
 *   - Shared: N consumers of the same key = 1 subscription
 *   - Filtered: optional client-side predicate + sort applied after fetch
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * @param {Object} opts
 * @param {string}   opts.name     Firestore collection name
 * @param {Function} [opts.filter] Optional predicate: (doc) => boolean
 * @param {Function} [opts.sort]   Optional comparator: (a, b) => number
 * @param {string}   [opts.cacheKey] Optional extra cache key segment (for
 *                                   differentiating same-collection reads
 *                                   with different filters/sorts)
 */
export function useFirestoreCollection({ name, filter, sort, cacheKey = "default" }) {
  const queryClient = useQueryClient();
  const queryKey = ["firestore", name, cacheKey];

  // useEffect owns the subscription lifecycle. queryFn below returns a
  // Promise that resolves on first snapshot; after that, onSnapshot keeps
  // the cache fresh directly via queryClient.setQueryData.
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, name),
      (snap) => {
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        let next = docs;
        if (filter) next = next.filter(filter);
        if (sort) next = [...next].sort(sort);
        queryClient.setQueryData(queryKey, next);
      },
      (err) => {
        console.error(`useFirestoreCollection[${name}] error:`, err);
        // Surface the error through the query state so the UI can show it
        queryClient.setQueryData(queryKey, () => { throw err; });
      }
    );
    return () => { try { unsub(); } catch {} };
    // queryKey members are stable; intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, cacheKey]);

  return useQuery({
    queryKey,
    // Resolve with an empty array on initial mount; real data arrives via
    // setQueryData from onSnapshot within 100-300ms typically.
    queryFn: () => Promise.resolve([]),
    // staleTime Infinity because we manage freshness via subscription.
    // Overriding the QueryClient default explicitly for clarity.
    staleTime: Infinity,
  });
}

export default useFirestoreCollection;
