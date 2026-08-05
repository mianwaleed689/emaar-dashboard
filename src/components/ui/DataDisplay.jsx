import React from "react";
import { colour as C, type as TY, space as S, radius as R, state as ST, surface } from "../../design/system";
import { useSystemCSS } from "../../design/ui";

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
 * ── WHY THEY NOW READ FROM design/system.js ─────────────────────────────────
 *
 * These were the right idea implemented one level too low: they still chose
 * their own hexes and their own font sizes — 9px uppercase labels, 9.5px notes,
 * an `accent` prop that took any colour a caller fancied. So the primitive that
 * existed to stop tabs inventing a type scale had invented one of its own, and
 * a "shared" card did not match the cards on the rebuilt CRM screens.
 *
 * The API is unchanged, deliberately: every existing caller keeps working, and
 * four screens — Overview, Market, the Almanac and both desks — pick up the
 * system in one edit rather than four.
 *
 * `accent` is the one change worth knowing about. It used to take a colour;
 * it now takes a TONE ("critical" | "warning" | "positive" | "info"), because
 * a figure should be coloured for what it MEANS. A hex is still accepted so
 * nothing breaks, but it is the old way and should go as each caller is
 * touched.
 */

const TONES = { critical: 1, warning: 1, positive: 1, info: 1, neutral: 1 };
/** A tone name if we were given one; a hex passes through for now. */
const accentColour = a => (a && TONES[a] ? ST[a].fg : a) || undefined;

/** Surface container. One border radius, one padding scale, everywhere. */
export function Card({ children, style, onClick, interactive }) {
  useSystemCSS();
  const clickable = Boolean(onClick || interactive);
  return (
    <div
      onClick={onClick}
      className={clickable ? "ds-btn ds-focus" : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(e); } } : undefined}
      style={{
        ...surface(),
        padding: `${S.base}px ${S.lg}px`,
        cursor: clickable ? "pointer" : undefined,
        ...style,
      }}
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
     Both come from the system's type scale now, so a tab that invents a third
     is visibly different rather than subtly different. */
  const isHeading = variant === "heading";

  return (
    <div style={{
      display: "flex", alignItems: isHeading ? "flex-end" : "baseline",
      gap: S.md, marginBottom: isHeading ? S.base : S.md,
      marginTop: isHeading ? S.xxl : 0, flexWrap: "wrap", ...style,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: S.md, flexWrap: "wrap", flex: 1, minWidth: 200 }}>
        <h3 style={isHeading
          ? { ...TY.title, margin: 0, color: C.text }
          : { ...TY.label, margin: 0, color: C.textMuted }}>{children}</h3>
        {hint && <span style={{ ...TY.small, color: C.textMuted }}>{hint}</span>}
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
  return (
    <Card onClick={onClick} style={{ flex: "1 1 180px", minWidth: 168, ...style }}>
      <div style={{ ...TY.label, color: C.textMuted, marginBottom: S.sm }}>{label}</div>
      <div style={{
        ...(large ? TY.figure : TY.figureSm),
        color: accentColour(accent) || C.text,
      }}>{value ?? "—"}</div>
      {context ? (
        <div style={{ ...TY.small, color: C.textFaint, marginTop: S.sm }}>{context}</div>
      ) : (
        import.meta.env?.DEV && (
          <div style={{ ...TY.small, color: ST.critical.fg, marginTop: S.sm }}>
            no context — add a sample size, source or date
          </div>
        )
      )}
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
  const fill = accentColour(color) || C.accent;
  return (
    <div style={{ marginBottom: S.base }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ ...TY.small, color: C.text }}>{label}</span>
        <span style={{ ...TY.numeric, fontSize: 14, color: C.text }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: C.panelSunk, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: fill, borderRadius: 3,
                      transition: "width 0.6s ease" }}/>
      </div>
      {note && <div style={{ ...TY.small, color: C.textFaint, marginTop: 6 }}>{note}</div>}
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
    <div style={{ ...TY.small, color: C.textFaint, marginTop: S.sm }}>
      {source}{asOf ? ` · as of ${asOf}` : ""}{note ? ` · ${note}` : ""}
    </div>
  );
}

/** Amber callout for anything provisional, disputed, or not yet settled. */
export function Caveat({ title, children, style }) {
  return (
    <Card style={{ borderColor: ST.warning.line, background: ST.warning.bg, ...style }}>
      {title && (
        <div style={{ ...TY.smallStrong, color: ST.warning.fg, marginBottom: 6 }}>{title}</div>
      )}
      <div style={{ ...TY.small, color: C.text }}>{children}</div>
    </Card>
  );
}
