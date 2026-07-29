import React from "react";
import { classifyProvenance } from "../utils/provenance";

/**
 * A small pill showing where a figure came from.
 *
 * The point is that a hand-researched estimate and a DLD-derived figure must
 * never render identically. Hovering shows the underlying source string and,
 * where available, the as-of date.
 *
 * Usage:  <SourceBadge row={community} />
 *         <SourceBadge row={community} compact />   // dot only, for dense tables
 */
export default function SourceBadge({ row, compact = false, style }) {
  const { label, color, detail, asOf } = classifyProvenance(row);
  const title = asOf ? `${detail} — as of ${asOf}` : detail;

  if (compact) {
    return (
      <span
        title={title}
        aria-label={`Data source: ${title}`}
        style={{
          display: "inline-block", width: 7, height: 7, borderRadius: "50%",
          background: color, flexShrink: 0, verticalAlign: "middle", ...style,
        }}
      />
    );
  }

  return (
    <span
      title={title}
      aria-label={`Data source: ${title}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 7px", borderRadius: 999,
        background: `${color}14`, border: `1px solid ${color}40`,
        color, fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
        fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap",
        textTransform: "uppercase", ...style,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}
