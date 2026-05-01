/**
 * DXB Analytics �€” TanStack Query client (singleton)
 * src/lib/queryClient.js
 *
 * The single QueryClient instance used throughout the app. Imported by App.jsx
 * and by every custom hook that calls useQuery / useMutation / useQueryClient.
 *
 * Defaults are tuned for Firestore real-time subscriptions: we don't poll,
 * we don't refetch on focus, we rely on onSnapshot to keep data fresh and
 * just let React Query handle caching + deduplication.
 *
 * If you need different defaults for a specific query, pass them as options
 * to useQuery directly �€” they override the defaults below.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Firestore subscriptions keep data fresh; no need to poll or refetch
      staleTime: Infinity,
      // Keep unused queries in cache for 5 minutes, then evict
      gcTime: 5 * 60 * 1000,
      // onSnapshot subscriptions already react to focus changes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Retry transient failures twice before surfacing an error
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: {
      // Mutations (writes) �€” retry once, fail fast if still broken
      retry: 1,
    },
  },
});

export default queryClient;
