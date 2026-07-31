import React from "react";
import { T } from "../../data";

/**
 * DXB ANALYTICS — SHARED DATA DISPLAY PRIMITIVES
 *
 * ── WHY THESE EXIST ─────────────────────────────────────────────────────────
 *
 * Every tab defined its own card, its own section heading, its own KPI tile.
 * MarketTab had `KpiCard` and `SH`; OverviewTab had `Card`, `SectionTitle` and
 * `Kpi`; other tabs inline their own. Same idea, different padding, different
 * type scale, different border colour — so moving between tabs felt like moving
 * between products.
 *
 * More importantly, each private version made its own decision about whether a
 * number needs a source. Some showed a figure with no provenance at all. When
 * the primitive does not ask for it, the caller forgets.
 *
 * These are the shared versions. `Kpi` takes a `context` prop and renders a
 * visible warning in development when it is missing, because on this product a
 * number without a sample size, a source or a date is a defect — that is what
 * produced "87% cash" surviving in six places and "Market Health 72/100" with
 * no formula behind it.
 *
 * Used by Overview and Market. The remaining tabs should adopt them as they are
 * touched, rather than in one sweep that cannot be reviewed.
 */

const c = {
  card: () => T?.card || "rgba(255,255,255,0.03)",
  border: () => T?.border || "rgba(255,255,255,0.08)",
  muted: () => T?.textMuted || "#8A94A6",
  text: () => T?.textSecondary || "#C9D1D9",
  white: () => T?.white || "#fff",
  gold: () => T?.gold || "#D4A843",
};

const SANS = "'Outfit',sans-serif";
const SERIF = "Fraunces,serif";

/** Surface container. One border radius, one padding scale, everywhere. */
export function Card({ children, style, onClick, interactive }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: c.card(),
        border: `1px solid ${c.border()}`,
        borderRadius: 12,
        padding: "16px 18px",
        cursor: onClick || interactive ? "pointer" : undefined,
        transition: "border-color 0.2s",
        ...style,
      }}
      onMouseEnter={e => { if (onClick || interactive) e.currentTarget.style.borderColor = c.gold(); }}
      onMouseLeave={e => { if (onClick || interactive) e.currentTarget.style.borderColor = c.border(); }}
    >
      {children}
    </div>
  );
}

/**
 * Section heading. `hint` is where the scope and date belong — "May 2026",
 * "computed from live data", "share of sales value" — so a reader never has to
 * guess what period a block covers.
 */
export function SectionTitle({ children, hint, right, variant = "label", style }) {
  /* Two weights, deliberately:
       "label"   — uppercase micro-heading for a group of KPIs inside a section
       "heading" — serif headline that opens a major section of a page
     Both live here so the type scale is decided once. A tab that invents a third
     is the thing this component exists to prevent. */
  const isHeading = variant === "heading";

  return (
    <div style={{
      display: "flex", alignItems: isHeading ? "flex-end" : "baseline",
      gap: 10, marginBottom: isHeading ? 14 : 10,
      marginTop: isHeading ? 32 : 0, flexWrap: "wrap", ...style,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", flex: 1, minWidth: 200 }}>
        <h3 style={isHeading ? {
          margin: 0, fontSize: 16, fontWeight: 700, color: c.white(), fontFamily: SERIF,
        } : {
          margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0.8,
          textTransform: "uppercase", color: c.text(), fontFamily: SANS,
        }}>{children}</h3>
        {hint && (
          <span style={{ fontSize: isHeading ? 11 : 10, color: c.muted(), lineHeight: 1.5 }}>{hint}</span>
        )}
      </div>
      {right && <span>{right}</span>}
    </div>
  );
}

/**
 * A headline figure.
 *
 * `context` is required by convention: a sample size, a source, or a date. In
 * development a missing one renders visibly rather than failing silently — the
 * whole class of bug this product has been fixing is numbers that arrived on
 * screen with nothing attached.
 */
export function Kpi({ label, value, context, accent, large, onClick, style }) {
  const missingContext = !context;
  return (
    <Card onClick={onClick} style={{ flex: "1 1 170px", minWidth: 160, ...style }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
        color: c.muted(), marginBottom: 8, fontFamily: SANS,
      }}>{label}</div>
      <div style={{
        fontSize: large ? 30 : 24, fontWeight: 800, lineHeight: 1.05,
        color: accent || c.white(), fontFamily: SERIF,
      }}>{value ?? "—"}</div>
      {context ? (
        <div style={{ fontSize: 10, color: c.muted(), marginTop: 7, lineHeight: 1.45 }}>{context}</div>
      ) : (
        import.meta.env?.DEV && (
          <div style={{ fontSize: 9, color: "#FC8181", marginTop: 7 }}>
            no context — add a sample size, source or date
          </div>
        )
      )}
      {missingContext && !import.meta.env?.DEV ? null : null}
    </Card>
  );
}

/**
 * Proportional bar for share-of-total figures.
 * `note` carries the detail; `pct` drives the fill so the bar cannot disagree
 * with the label.
 */
export function StatBar({ label, value, pct, color, note }) {
  const width = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: 11.5, color: c.text(), fontFamily: SANS }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: color || c.gold(), fontFamily: SERIF }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: color || c.gold(), borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
      {note && <div style={{ fontSize: 9.5, color: c.muted(), marginTop: 5, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

/**
 * The provenance line that belongs under any sourced figure.
 * Renders nothing when there is no source — an empty line is better than the
 * word "source" followed by nothing.
 */
export function SourceLine({ source, asOf, note }) {
  if (!source && !asOf) return null;
  return (
    <div style={{ fontSize: 9, color: c.muted(), marginTop: 8, lineHeight: 1.5 }}>
      {source}{asOf ? ` · as of ${asOf}` : ""}{note ? ` · ${note}` : ""}
    </div>
  );
}

/** Amber callout for anything provisional, disputed, or not yet settled. */
export function Caveat({ title, children, style }) {
  return (
    <Card style={{ borderColor: "rgba(245,158,11,0.28)", background: "rgba(245,158,11,0.04)", ...style }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 6, fontFamily: SANS }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 11, color: c.text(), lineHeight: 1.6 }}>{children}</div>
    </Card>
  );
}
