/* eslint-disable */
/**
 * TabProvenance — where the numbers on this tab came from.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * The clarity check on 2026-08-02 found seven shipped tabs stating NO source at
 * all: Pipeline, Listings, Map, Launch Calendar, Handover, Golden Visa, Agency.
 *
 * Handover was the clearest case — it displays "1,193 projects, 355,408 units,
 * 29% average construction" and never says where a single figure came from.
 * That is a truth problem, not a presentation one.
 *
 * ── THE RULE ───────────────────────────────────────────────────────────────
 *
 * A tab that shows a number states its source, its method and when it was last
 * refreshed. If a figure is an estimate it says so here. If data is stale, the
 * `asOf` date makes that visible rather than leaving a customer to assume it is
 * current.
 *
 * `kind` distinguishes market data from the customer's own records — a leads
 * table should not carry a Land Department footer.
 *
 * TAB_CLARITY.md checks 3 and 9.
 */
import React from "react";
import { T } from "../data";
import { state as ST } from "../design/system";

const TONE = {
  market:   { c: "#D4A843", bg: "rgba(212,168,67,0.03)", b: "rgba(212,168,67,0.14)",
              label: "Where these numbers come from" },
  own:      { c: "#14B8A6", bg: "rgba(20,184,166,0.03)", b: "rgba(20,184,166,0.18)",
              label: "This is your own data" },
  estimate: { c: ST.warning.fg, bg: "rgba(245,158,11,0.03)", b: "rgba(245,158,11,0.20)",
              label: "This is an estimate, not a recorded figure" },
};

/** Flags data older than the given number of days, so staleness is on screen. */
function ageNote(asOf, staleAfterDays) {
  if (!asOf || !staleAfterDays) return null;
  const days = Math.floor((Date.now() - new Date(asOf).getTime()) / 86400000);
  if (!Number.isFinite(days) || days < staleAfterDays) return null;
  return `Last updated ${days} days ago — confirm before quoting a client.`;
}

export default function TabProvenance({
  kind = "market", sources = [], method, asOf, staleAfterDays, caveat, coverage,
}) {
  const tone = TONE[kind] || TONE.market;
  const stale = ageNote(asOf, staleAfterDays);

  return (
    <div style={{ background: tone.bg, border: `1px solid ${tone.b}`,
                  borderRadius: 14, padding: "14px 18px", marginTop: 14 }}>
      <div style={{ fontSize:13, fontWeight: 700, color: tone.c, letterSpacing: .7,
                    textTransform: "uppercase", marginBottom: 8 }}>
        {tone.label}
      </div>

      {sources.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 9 }}>
          {sources.map(s => (
            <span key={typeof s === "string" ? s : s.name}
              style={{ fontSize:13, color: T.textSecondary, padding: "3px 9px",
                       borderRadius: 6, border: `1px solid ${T.border}`,
                       background: "rgba(255,255,255,0.02)" }}>
              {typeof s === "string" ? s : s.name}
              {typeof s !== "string" && s.detail && (
                <span style={{ color: T.textMuted }}> · {s.detail}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.8 }}>
        {method}
        {coverage && <><br/><span style={{ color: T.textMuted }}>{coverage}</span></>}
        {caveat && <><br/><span style={{ color: T.textMuted }}>{caveat}</span></>}
        {asOf && (
          <><br/><span style={{ color: stale ? ST.warning.fg : T.textMuted }}>
            Last updated {asOf}.{stale ? ` ${stale}` : ""}
          </span></>
        )}
      </div>
    </div>
  );
}
