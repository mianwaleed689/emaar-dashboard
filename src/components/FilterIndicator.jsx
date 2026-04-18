/* eslint-disable */
/**
 * DXB Analytics — Filter Indicator Banner
 * =========================================
 *
 * Shown at the top of every tab when any filter is active. Tells the user:
 *   - What's currently filtered
 *   - How many rows are showing out of the total
 *   - A one-click "Clear all" action
 *
 * Usage:
 *   <FilterIndicator
 *     filters={{ developer: "emaar", community: "Dubai Hills Estate", type: "villa" }}
 *     allDevelopers={allDevelopers}
 *     visibleCount={12}
 *     totalCount={247}
 *     onClear={() => resetAll()}
 *   />
 *
 * Automatically formats dev IDs to names, type values to labels, etc.
 */

import React from "react";
import { useFilterSchema } from "../contexts/FilterSchemaContext";

export default function FilterIndicator({
  filters = {},
  allDevelopers = [],
  visibleCount = null,
  totalCount = null,
  onClear,
  label,
}) {
  const schema = useFilterSchema();

  // Build list of human-readable active filters
  const chips = [];

  if (filters.developer && filters.developer !== "all") {
    const dev = (allDevelopers || []).find(d =>
      String(d.id || "").toLowerCase() === String(filters.developer).toLowerCase() ||
      String(d.name || "").toLowerCase() === String(filters.developer).toLowerCase()
    );
    chips.push({ label: dev?.name || filters.developer, kind: "developer" });
  }

  if (filters.community && filters.community !== "all") {
    chips.push({ label: filters.community, kind: "community" });
  }

  if (filters.type && filters.type !== "all") {
    // Convert value like "hotel_apt" to human label "Hotel Apartment"
    const niceLabel = schema.typeLabelByValue[filters.type] || filters.type;
    chips.push({ label: niceLabel, kind: "type" });
  }

  if (filters.beds && filters.beds !== "all") {
    chips.push({ label: filters.beds, kind: "beds" });
  }

  if (filters.status && filters.status !== "all") {
    const statusObj = (schema.statusOptions || []).find(s => s.value === filters.status);
    chips.push({ label: statusObj?.label || filters.status, kind: "status" });
  }

  if (filters.priceMin > 0 || filters.priceMax > 0) {
    const fmt = n => n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
                   : n >= 1000    ? (n / 1000).toFixed(0) + "K"
                   : String(n || "");
    let priceLabel;
    if (filters.priceMin > 0 && filters.priceMax > 0) priceLabel = `AED ${fmt(filters.priceMin)}–${fmt(filters.priceMax)}`;
    else if (filters.priceMin > 0) priceLabel = `AED ${fmt(filters.priceMin)}+`;
    else                            priceLabel = `up to AED ${fmt(filters.priceMax)}`;
    chips.push({ label: priceLabel, kind: "price" });
  }

  if (chips.length === 0) return null; // nothing filtered, show nothing

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      padding: "8px 14px",
      background: "rgba(212,168,67,0.08)",
      border: "1px solid rgba(212,168,67,0.25)",
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 12,
      fontFamily: "'Outfit',sans-serif",
    }}>
      <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: 0.3 }}>
        {label || "Filtered by:"}
      </span>
      {chips.map((c, i) => (
        <span key={i} style={{
          padding: "3px 10px",
          borderRadius: 14,
          background: "rgba(212,168,67,0.12)",
          border: "1px solid rgba(212,168,67,0.25)",
          color: "#D4A843",
          fontWeight: 600,
          fontSize: 11,
        }}>
          {c.label}
        </span>
      ))}
      {(visibleCount != null && totalCount != null) && (
        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
          Showing <strong style={{ color: "#FFFFFF" }}>{visibleCount}</strong>
          {totalCount !== visibleCount && <> of <strong style={{ color: "#FFFFFF" }}>{totalCount}</strong></>}
          {totalCount !== visibleCount && visibleCount === 0 && (
            <span style={{ color: "#EF4444", marginLeft: 6 }}>· no matches</span>
          )}
        </span>
      )}
      {onClear && (
        <button type="button" onClick={onClear}
          style={{
            marginLeft: (visibleCount != null) ? 12 : "auto",
            padding: "4px 12px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 14,
            color: "rgba(255,255,255,0.75)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Outfit',sans-serif",
          }}>
          Clear all
        </button>
      )}
    </div>
  );
}
