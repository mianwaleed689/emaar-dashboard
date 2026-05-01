/* eslint-disable */
/**
 * DXB Analytics — SmartEmptyState
 * ==================================
 *
 * A smart "no results" component that understands WHY the data is empty
 * and shows the appropriate message + action.
 *
 * Four scenarios handled:
 *
 *   1. LOADING — data is still being fetched
 *        Shows: loading spinner
 *
 *   2. ERROR — data fetch failed
 *        Shows: error message + Retry button
 *
 *   3. NO_DATA_YET — no filters active, but underlying dataset is empty
 *        Shows: "Market data for this view is still being compiled —
 *                check back soon" + optional "Request this data" action
 *
 *   4. FILTER_MISMATCH — filters active, no matches
 *        Shows: active filter chips + suggestions to remove one filter
 *                at a time + "Clear all filters" escape
 *
 * Usage:
 *   <SmartEmptyState
 *     state="loading" | "error" | "no_data_yet" | "filter_mismatch" | "auto"
 *     rowsAll={allRawData}                // unfiltered data (used for counting)
 *     filters={{ developer, community, type, beds, status }}
 *     allDevelopers={allDevelopers}
 *     entityLabel="projects"
 *     onRemoveFilter={(key) => setFilter(key, "all")}
 *     onClearAll={() => resetAllFilters()}
 *     onRetry={() => refetch()}            // for error state
 *     matchFn={(row, filters) => boolean}
 *     errorMessage="Failed to reach Firestore"  // optional
 *   />
 *
 * If state="auto" (default), the component infers the state from props:
 *   - If rowsAll is null/undefined → loading
 *   - If rowsAll is [] and no filters active → no_data_yet
 *   - If rowsAll has items but filter combo returns 0 → filter_mismatch
 */

import React, { useMemo } from "react";
import { useFilterSchema } from "../contexts/FilterSchemaContext";

export default function SmartEmptyState({
  state = "auto",
  rowsAll = [],
  filters = {},
  allDevelopers = [],
  entityLabel = "results",
  onRemoveFilter,
  onClearAll,
  onRetry,
  matchFn,
  errorMessage,
  T,
}) {
  const schema = useFilterSchema();

  // Default colors if T not provided
  const colors = T || {
    surface: "#0A1119",
    surfaceAlt: "#111823",
    border: "rgba(255,255,255,0.08)",
    textMuted: "rgba(255,255,255,0.45)",
    textSecondary: "rgba(255,255,255,0.65)",
    white: "#FFFFFF",
    gold: "#D4A843",
    green: "#10B981",
    red: "#EF4444",
  };

  // Compute active filters first (used in multiple states)
  const activeFilters = useMemo(() => {
    const list = [];
    if (filters.developer && filters.developer !== "all") {
      const dev = (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === String(filters.developer).toLowerCase() ||
        String(d.name || "").toLowerCase() === String(filters.developer).toLowerCase()
      );
      list.push({ key: "developer", label: dev?.name || filters.developer });
    }
    if (filters.community && filters.community !== "all") {
      list.push({ key: "community", label: filters.community });
    }
    if (filters.type && filters.type !== "all") {
      const niceLabel = schema.typeLabelByValue[filters.type] || filters.type;
      list.push({ key: "type", label: niceLabel });
    }
    if (filters.beds && filters.beds !== "all") {
      list.push({ key: "beds", label: filters.beds });
    }
    if (filters.status && filters.status !== "all") {
      const statusObj = (schema.statusOptions || []).find(s => s.value === filters.status);
      list.push({ key: "status", label: statusObj?.label || filters.status });
    }
    if ((filters.priceMin > 0) || (filters.priceMax > 0)) {
      list.push({ key: "price", label: "Price range" });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allDevelopers, schema]);

  // ─── Infer state if auto ─────────────────────────────────────────────
  let resolvedState = state;
  if (state === "auto") {
    if (rowsAll === null || rowsAll === undefined) {
      resolvedState = "loading";
    } else if (errorMessage) {
      resolvedState = "error";
    } else if (Array.isArray(rowsAll) && rowsAll.length === 0 && activeFilters.length === 0) {
      resolvedState = "no_data_yet";
    } else {
      resolvedState = "filter_mismatch";
    }
  }

  // ─── Shared card wrapper ─────────────────────────────────────────────
  const cardStyle = {
    padding: "32px 24px",
    background: "rgba(212,168,67,0.03)",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    fontFamily: "'Outfit',sans-serif",
    textAlign: "center",
  };

  // ─── STATE: loading ──────────────────────────────────────────────────
  if (resolvedState === "loading") {
    return (
      <div style={cardStyle}>
        <div style={{
          width: 28, height: 28, border: `3px solid ${colors.border}`,
          borderTopColor: colors.gold, borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
          display: "inline-block", marginBottom: 14,
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.white, marginBottom: 4 }}>
          Loading {entityLabel}…
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted }}>
          Fetching latest data from Firestore
        </div>
      </div>
    );
  }

  // ─── STATE: error ────────────────────────────────────────────────────
  if (resolvedState === "error") {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.white, marginBottom: 6 }}>
          Couldn't load {entityLabel}
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16, maxWidth: 440, margin: "0 auto 16px" }}>
          {errorMessage || "There was a problem reaching our data backend. This is usually temporary."}
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry}
            style={{
              padding: "8px 22px",
              background: colors.gold,
              border: "none",
              borderRadius: 8,
              color: "#000",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
            }}>
            Retry
          </button>
        )}
      </div>
    );
  }

  // ─── STATE: no_data_yet (no filters, dataset is empty) ───────────────
  if (resolvedState === "no_data_yet") {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.white, marginBottom: 6 }}>
          Market data for this view is being compiled
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, maxWidth: 480, margin: "0 auto 8px" }}>
          We're actively adding {entityLabel} data from DLD, Bayut, Knight Frank, and developer reports.
          Check back in a few days — you can also set up an alert.
        </div>
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 12 }}>
          Covered communities grow weekly as we parse new data sources.
        </div>
      </div>
    );
  }

  // ─── STATE: filter_mismatch (active filters + zero matches) ──────────
  // Compute suggestions: for each active filter, how many rows match WITHOUT it
  const suggestions = (!matchFn || activeFilters.length === 0 || !rowsAll || rowsAll.length === 0)
    ? []
    : activeFilters.map(af => {
        const alternativeFilters = { ...filters };
        if (af.key === "price") {
          alternativeFilters.priceMin = 0;
          alternativeFilters.priceMax = 0;
        } else {
          alternativeFilters[af.key] = "all";
        }
        const count = rowsAll.filter(row => {
          try { return matchFn(row, alternativeFilters); }
          catch { return false; }
        }).length;
        return { ...af, count };
      }).filter(s => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div style={{ ...cardStyle, textAlign: "left", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.white, marginBottom: 6 }}>
          No {entityLabel} match your current filters
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {activeFilters.map((f, i) => (
            <span key={i} style={{
              padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.25)", color: colors.gold,
            }}>
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" }}>
            Try removing one filter
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggestions.map((s, i) => (
              <button key={i} type="button"
                onClick={() => onRemoveFilter && onRemoveFilter(s.key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  background: colors.surfaceAlt,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: colors.white,
                  textAlign: "left",
                  fontFamily: "'Outfit',sans-serif",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = colors.gold; e.currentTarget.style.background = "rgba(212,168,67,0.05)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.surfaceAlt; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: colors.textMuted, fontSize: 14 }}>×</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Remove {s.label}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: colors.green,
                  padding: "2px 10px",
                  borderRadius: 10,
                  background: "rgba(16,185,129,0.1)",
                }}>
                  {s.count} {entityLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear all fallback */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        {onClearAll && (
          <button type="button" onClick={onClearAll}
            style={{
              padding: "8px 22px",
              background: "transparent",
              border: `1px solid ${colors.gold}`,
              borderRadius: 20,
              color: colors.gold,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
            }}>
            Or clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
