/**
 * THE PARTS EVERY REBUILT SCREEN IS MADE FROM.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * system.js holds the decisions; this holds the things built from them. A tab
 * that needs a card asks for <Card>. It does not choose a background, a border,
 * a radius or a padding — that is exactly how ten tabs ended up with nine
 * different corner radii and twelve text colours between them.
 *
 * The important one here is <DataList>. A table is the right shape for a lead
 * list on a desktop and completely wrong on a phone: My Leads overflowed its
 * viewport by 350px at 390px wide, which means an agent standing in an
 * apartment could not read it. DataList takes ONE description of the columns
 * and renders a table where there is room and a stack of cards where there is
 * not — so there is one definition to keep true, not two that drift apart.
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { colour, state as tone, type, space, radius, target, surface, bp, density, SYSTEM_CSS } from "./system";

/* ── THE STYLESHEET, ONCE ─────────────────────────────────────────────────
   Injected on first mount of anything from this file, and only once however
   many screens use it. */
let injected = false;
export function useSystemCSS() {
  useEffect(() => {
    if (injected || typeof document === "undefined") return;
    injected = true;
    const el = document.createElement("style");
    el.id = "ds-system";
    el.textContent = SYSTEM_CSS;
    document.head.appendChild(el);
  }, []);
}

/** Which shape of screen we are on. Answered by the browser, not by guessing. */
export function useViewport() {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 1400 : window.innerWidth));
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return { width: w, phone: w < bp.phone, wide: w >= bp.wide };
}

/* ── PAGE ─────────────────────────────────────────────────────────────────── */

/**
 * The head of a screen: what it is, the question it answers, and — only if
 * there is one — a single primary action.
 *
 * Every tab used to print its own title and then a second title underneath it
 * ("Agency" followed by "Agency Hub"). There is one title.
 */
export function PageHead({ title, question, count, action, children }) {
  const { phone } = useViewport();
  /* The title, what the screen holds, and the one action — on ONE line.
     The first cut of this stacked a 27px title, then a three-line paragraph
     at 15px, then the controls: two hundred pixels of chrome before a single
     row of data on a screen whose whole job is rows of data. The sentence is
     still here, because a screen that does not say what it is fails the first
     thing this product promises — it is just no longer the loudest thing on
     it. */
  return (
    <header style={{ paddingBottom: space.md, marginBottom: space.base,
                     borderBottom: `1px solid ${colour.line}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: space.md,
                    flexWrap: "wrap", marginBottom: question ? space.xs : 0 }}>
        <h1 style={{ ...type.title, color: colour.text, margin: 0,
                     fontSize: phone ? 19 : type.title.fontSize }}>{title}</h1>
        {count != null && (
          <span style={{ ...type.numeric, fontSize: 14, color: colour.textMuted }}>{count}</span>
        )}
        <span style={{ flex: "1 1 auto" }}/>
        {action}
      </div>
      {question && (
        <p style={{ ...type.small, color: colour.textMuted, margin: 0, maxWidth: "104ch" }}>
          {question}
        </p>
      )}
      {children}
    </header>
  );
}

/** A named region. `action` sits on the right of its head. */
export function Card({ title, note, action, children, pad = true, tone: t }) {
  const st = t ? tone[t] : null;
  return (
    <section style={{ ...surface(), borderColor: st ? st.line : colour.line, overflow: "hidden" }}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", gap: space.md,
                      padding: `${space.md}px ${space.base}px`,
                      borderBottom: `1px solid ${colour.line}` }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ ...type.section, color: st ? st.fg : colour.text }}>{title}</div>
            {note && <div style={{ ...type.small, color: colour.textMuted, marginTop: 2 }}>{note}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={pad ? { padding: space.base } : undefined}>{children}</div>
    </section>
  );
}

/**
 * A number that matters, with the words that make it mean something.
 *
 * `tone` is for STATE only — a count of blocked deals is critical, a count of
 * open deals is not anything. A figure with no state is the plain text colour,
 * which is why the rebuilt screens stop looking like a bag of sweets.
 */
export function Figure({ value, label, note, tone: t, small }) {
  const st = t ? tone[t] : null;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...(small ? type.figureSm : type.figure),
                    color: st ? st.fg : colour.text }}>{value}</div>
      <div style={{ ...type.label, color: colour.textMuted, marginTop: 6 }}>{label}</div>
      {note && <div style={{ ...type.small, color: colour.textFaint, marginTop: 4, lineHeight: 1.5 }}>{note}</div>}
    </div>
  );
}

/** A row of figures that wraps instead of overflowing. */
export function FigureRow({ children, min = 150 }) {
  return (
    <div style={{ display: "grid", gap: space.base,
                  gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

/* ── CONTROLS ─────────────────────────────────────────────────────────────── */

/**
 * variant: primary — the one action the screen is for. One per screen.
 *          quiet   — everything else.
 *          ghost   — a control that must not compete at all.
 */
export function Btn({ variant = "quiet", children, onClick, disabled, title, type: htmlType = "button", full }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: space.sm,
    minHeight: target.desktop, padding: `0 ${space.base}px`, borderRadius: radius.control,
    fontFamily: type.bodyStrong.fontFamily, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : undefined,
    whiteSpace: "nowrap",
  };
  const look = variant === "primary"
    ? { background: colour.accent, border: `1px solid ${colour.accent}`, color: colour.textOn }
    : variant === "ghost"
      ? { background: "transparent", border: "1px solid transparent", color: colour.textMuted }
      : { background: "transparent", border: `1px solid ${colour.line}`, color: colour.text };
  return (
    <button type={htmlType} onClick={onClick} disabled={disabled} title={title}
      className={`ds-btn ds-focus${variant === "primary" ? " ds-btn-primary" : ""}`}
      style={{ ...base, ...look }}>{children}</button>
  );
}

/** A state, said in one word. Never used for decoration. */
export function Chip({ tone: t = "neutral", children, title }) {
  const st = tone[t] || tone.neutral;
  return (
    <span title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: radius.pill,
      background: st.bg, border: `1px solid ${st.line}`, color: st.fg,
      fontFamily: type.small.fontFamily, fontSize: 12.5, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

/** A small round dot carrying the same meaning as a chip, where a chip is too much. */
export const Dot = ({ tone: t = "neutral" }) => (
  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                 background: (tone[t] || tone.neutral).fg, display: "inline-block" }}/>
);

export function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ ...type.label, color: colour.textMuted, display: "block", marginBottom: 6 }}>{label}</span>
      {children}
      {hint && <span style={{ ...type.small, color: colour.textFaint, display: "block", marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

const controlStyle = {
  width: "100%", minHeight: target.desktop, padding: `0 ${space.md}px`,
  background: colour.panelSunk, border: `1px solid ${colour.line}`,
  borderRadius: radius.control, color: colour.text,
  fontFamily: type.body.fontFamily, fontSize: 14.5, outline: "none",
};

export const Input = ({ value, onChange, placeholder, type: t = "text", disabled, onKeyDown }) => (
  <input className="ds-input ds-focus" type={t} value={value ?? ""} disabled={disabled}
    placeholder={placeholder} onKeyDown={onKeyDown}
    onChange={e => onChange?.(e.target.value)} style={controlStyle}/>
);

export const Select = ({ value, onChange, children, disabled }) => (
  <select className="ds-input ds-focus" value={value} disabled={disabled}
    onChange={e => onChange?.(e.target.value)}
    style={{ ...controlStyle, cursor: "pointer", appearance: "none",
             paddingRight: space.xxl,
             backgroundImage: `linear-gradient(45deg, transparent 50%, ${colour.textMuted} 50%),
                               linear-gradient(135deg, ${colour.textMuted} 50%, transparent 50%)`,
             backgroundPosition: "right 16px center, right 11px center",
             backgroundSize: "5px 5px, 5px 5px", backgroundRepeat: "no-repeat" }}>
    {children}
  </select>
);

/** Controls above a list. Wraps; never pushes the page sideways. */
export function Toolbar({ children }) {
  return (
    <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "center",
                  marginBottom: space.base }}>{children}</div>
  );
}

/* ── THE LIST ─────────────────────────────────────────────────────────────── */

/**
 * ONE description of the data, TWO shapes on screen.
 *
 * columns: [{ key, head, cell(row), width, align, phone }]
 *   `phone` decides what a card shows:
 *     "title"    the headline of the card
 *     "sub"      the line under it
 *     "meta"     a labelled pair in the card's body
 *     "trail"    pinned to the right of the title row
 *     omitted    desktop only — a phone does not get a column it cannot use
 *
 * A table gets a horizontal scroller of its own so a wide table never takes
 * the page sideways with it.
 */
export function DataList({ columns, rows, rowKey, onRowClick, empty, dense, stack,
                           maxHeightOffset = 300 }) {
  const { phone } = useViewport();
  const cols = useMemo(() => columns.filter(Boolean), [columns]);

  if (!rows.length) return empty || null;

  /* `stack` is for a caller that knows it has no room even on a desktop — a
     master–detail rail beside an open panel is a phone's width, whatever the
     window is doing. */
  if (phone || stack) {
    const title = cols.find(c => c.phone === "title") || cols[0];
    const sub   = cols.find(c => c.phone === "sub");
    const trail = cols.find(c => c.phone === "trail");
    const metas = cols.filter(c => c.phone === "meta");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
        {rows.map((r, i) => (
          <div key={rowKey ? rowKey(r, i) : i}
            className={onRowClick ? "ds-row ds-focus ds-tap" : undefined}
            role={onRowClick ? "button" : undefined} tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            onKeyDown={onRowClick ? e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(r); } } : undefined}
            style={{ ...surface(), padding: space.md, cursor: onRowClick ? "pointer" : "default" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: space.sm }}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ ...type.bodyStrong, color: colour.text }}>{title.cell(r)}</div>
                {sub && <div style={{ ...type.small, color: colour.textMuted, marginTop: 3 }}>{sub.cell(r)}</div>}
              </div>
              {trail && <div style={{ flexShrink: 0 }}>{trail.cell(r)}</div>}
            </div>
            {metas.length > 0 && (
              <div style={{ display: "grid", gap: space.sm, marginTop: space.md,
                            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
                {metas.map(c => (
                  <div key={c.key} style={{ minWidth: 0 }}>
                    <div style={{ ...type.label, color: colour.textFaint, marginBottom: 3 }}>{c.head}</div>
                    <div style={{ ...type.small, color: colour.text }}>{c.cell(r)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  /* THE GRID TIER. Rows at 36px and figures at 13px, because the job here is
     scanning four hundred leads for one, not reading a paragraph. See
     system.js#density for why this is a separate tier rather than the same
     numbers used everywhere. */
  const D = density.grid;
  /* Past this many rows the grid gets its own scroller, so the column names
     and the controls above them stay on screen rather than disappearing at
     row forty. Below it, the page scrolls normally and a second scrollbar
     would be an irritation with nothing to show for it. */
  const scrolls = rows.length > 14;
  return (
    <div className="ds-scroll-x ds-grid"
      style={{ ...surface(), background: colour.ground,
               maxHeight: scrolls ? `calc(100vh - ${maxHeightOffset}px)` : undefined,
               overflowY: scrolls ? "auto" : "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760,
                      fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ ...type.label, color: colour.textMuted, textAlign: c.align || "left",
                                       padding: `${D.padY}px ${D.padX}px`, whiteSpace: "nowrap",
                                       height: 32, width: c.width }}>
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r, i) : i}
              className={onRowClick ? "ds-focus" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onKeyDown={onRowClick ? e => { if (e.key === "Enter") onRowClick(r); } : undefined}
              style={{ cursor: onRowClick ? "pointer" : "default",
                       height: dense ? D.rowH - 2 : D.rowH,
                       borderBottom: `1px solid ${colour.line}` }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: `0 ${D.padX}px`,
                                         textAlign: c.align || "left", verticalAlign: "middle",
                                         fontFamily: type.small.fontFamily, fontSize: D.font,
                                         lineHeight: 1.3, color: colour.text,
                                         maxWidth: c.width || 340 }}>
                  {c.nowrap === false ? c.cell(r) : <span className="ds-cell">{c.cell(r)}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Nothing here — said in a way that distinguishes "you have none" from
 * "something is broken". A screen that shows a blank panel makes every reader
 * assume the second.
 */
export function Empty({ title, what, action }) {
  return (
    <div style={{ ...surface(), padding: `${space.huge}px ${space.xl}px`, textAlign: "center" }}>
      <div style={{ ...type.section, color: colour.text, marginBottom: space.sm }}>{title}</div>
      {what && <p style={{ ...type.small, color: colour.textMuted, margin: "0 auto",
                           maxWidth: "46ch", lineHeight: 1.65 }}>{what}</p>}
      {action && <div style={{ marginTop: space.base }}>{action}</div>}
    </div>
  );
}

/** What just happened. Sits above everything, clears itself. */
export function Toast({ message, tone: t = "positive", onDone, ms = 3200 }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onDone?.(), ms);
    return () => clearTimeout(id);
  }, [message, ms, onDone]);
  if (!message) return null;
  const st = tone[t] || tone.positive;
  return (
    <div role="status" style={{
      position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 4000,
      background: colour.panelHover, border: `1px solid ${st.line}`, borderRadius: radius.control,
      padding: `${space.md}px ${space.lg}px`, color: st.fg, maxWidth: "min(92vw, 460px)",
      ...type.smallStrong, boxShadow: "0 10px 30px rgba(0,0,0,.45)",
    }}>{message}</div>
  );
}

/** A dialog that behaves: escape closes it, the backdrop closes it, it scrolls. */
export function Sheet({ open, title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  const { phone } = useViewport();
  useEffect(() => {
    if (!open) return;
    const on = e => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onMouseDown={e => { if (e.target === ref.current) onClose?.(); }} ref={ref}
      style={{ position: "fixed", inset: 0, background: "rgba(3,7,13,0.82)", zIndex: 3000,
               display: "flex", alignItems: phone ? "flex-end" : "center", justifyContent: "center",
               padding: phone ? 0 : space.xl }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        style={{ ...surface(true), width: phone ? "100%" : `min(${wide ? 900 : 620}px, 100%)`,
                 maxHeight: phone ? "92vh" : "88vh", display: "flex", flexDirection: "column",
                 borderRadius: phone ? `${radius.card}px ${radius.card}px 0 0` : radius.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: space.md,
                      padding: `${space.base}px ${space.lg}px`, borderBottom: `1px solid ${colour.line}` }}>
          <div style={{ ...type.title, color: colour.text, flex: "1 1 auto", fontSize: 19 }}>{title}</div>
          <Btn variant="ghost" onClick={onClose} title="Close">✕</Btn>
        </div>
        <div style={{ padding: space.lg, overflowY: "auto", flex: "1 1 auto" }}>{children}</div>
        {footer && (
          <div style={{ display: "flex", gap: space.sm, justifyContent: "flex-end",
                        padding: `${space.md}px ${space.lg}px`, borderTop: `1px solid ${colour.line}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
