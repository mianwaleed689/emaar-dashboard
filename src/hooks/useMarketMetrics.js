/**
 * useMarketMetrics - returns market metrics from Firestore
 * src/hooks/useMarketMetrics.js
 *
 * Reads from the "marketMetrics" collection (seeded in Session 7).
 * Categories: "market" | "marketChart" | "overviewKpi"
 *
 * Example:
 *   const { data: metrics } = useMarketMetrics("market");
 *   // -> [{ id, metric, value, change, source, ... }, ...]
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

export function useMarketMetrics(category = null) {
  return useFirestoreCollection({
    name: "marketMetrics",
    cacheKey: "marketMetrics:" + (category || "all"),
    filter: (d) => category ? d.category === category : true,
    sort: (a, b) => {
      // For chart data, sort by year
      if (a.year && b.year) return String(a.year).localeCompare(String(b.year));
      return 0;
    },
  });
}

export function useMarketKpis() {
  return useMarketMetrics("market");
}

export function useMarketChart() {
  return useMarketMetrics("marketChart");
}

export function useOverviewKpis() {
  return useMarketMetrics("overviewKpi");
}

export default useMarketMetrics;
