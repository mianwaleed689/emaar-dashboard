import React, { useState } from "react";
import { administrativeCommunities, CADASTRAL_EXPLAINER } from "../utils/communities";

/**
 * Explains, in the interface rather than in a code comment, why the community
 * count is what it is.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * The Dubai Land Department publishes prices for administrative and cadastral
 * zones as well as for marketed residential communities. Both are real DLD data
 * and they used to be listed together with nothing to tell them apart — so
 * Al Goze Fourth (AED 386/sqft), Al Barsha Third (602) and Al Quoz (1,000) sat
 * beside Dubai Hills and Palm Jumeirah looking like extraordinary bargains.
 *
 * They are not bargains. Those figures cover every registered transaction in a
 * zone, including industrial units, commercial premises and bare land. A client
 * comparing them to a community price is comparing two different things.
 *
 * Those 88 rows are now held out of the investor-facing lists — but hiding them
 * with no explanation would trade one confusion for another ("why is Al Quoz
 * missing?"). This component states the count, names the reason, and lets
 * anyone who wants to see the excluded zones look at them with the caveat
 * attached.
 *
 * Usage:  <CommunityCoverageNote rows={annotatedNeighbourhoods} shown={193} T={T} />
 */
export default function CommunityCoverageNote({ rows, shown, T = {}, style }) {
  const [open, setOpen] = useState(false);

  const excluded = administrativeCommunities(rows);
  if (!excluded.length) return null;

  const muted = T.textMuted || "#8A94A6";
  const border = T.border || "rgba(255,255,255,0.08)";
  const accent = T.gold || "#D4A843";
  const text = T.textSecondary || "#C9D1D9";

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        fontFamily: "'Outfit',sans-serif",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: muted }}>
          Showing <strong style={{ color: text }}>{shown ?? "—"}</strong> residential communities.
          {" "}
          <strong style={{ color: text }}>{excluded.length}</strong> Dubai Land Department
          administrative districts are listed separately.
        </span>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            marginLeft: "auto", padding: "3px 10px", borderRadius: 999,
            border: `1px solid ${accent}55`, background: "transparent",
            color: accent, fontSize: 10, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap",
          }}
        >
          {open ? "Hide" : "Why?"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${border}`, paddingTop: 10 }}>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: text }}>
            {CADASTRAL_EXPLAINER}
          </p>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: muted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>
              Excluded districts
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {excluded
                .slice()
                .sort((a, b) => (a.name || a.id || "").localeCompare(b.name || b.id || ""))
                .map(r => {
                  const ppsf = r.medianPPSF ?? r.avgPpsf ?? r.ppsf;
                  return (
                    <span
                      key={r.id}
                      title={ppsf > 0 ? `DLD zone average: AED ${Number(ppsf).toLocaleString()}/sqft — all property types` : "No price recorded"}
                      style={{
                        padding: "3px 8px", borderRadius: 6,
                        background: "rgba(255,255,255,0.04)", border: `1px solid ${border}`,
                        fontSize: 10, color: muted, whiteSpace: "nowrap",
                      }}
                    >
                      {r.name || r.id}
                      {ppsf > 0 && (
                        <span style={{ marginLeft: 5, color: text, opacity: 0.75 }}>
                          {Number(ppsf).toLocaleString()}
                        </span>
                      )}
                    </span>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
