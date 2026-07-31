import React, { useState } from "react";
import { T } from "../data";
import {
  MARKET_ERAS,
  MAJOR_DRAWDOWNS,
  PHASE_COLOR,
  PHASE_LABEL,
  MARKET_HISTORY_AS_OF,
  historySpanYears,
} from "../data/marketHistory";

/**
 * Dubai's full property cycle, 2002 to today.
 *
 * ── WHY THIS IS THE DIFFERENTIATOR ──────────────────────────────────────────
 *
 * Portals show the last twelve months. Agencies show the last five years,
 * usually starting in 2021 where the line only goes up. Almost nobody shows a
 * prospective buyer that this market fell 50–60% in 2008, or that it then spent
 * five years falling again between 2014 and 2019 — because that story does not
 * help close a sale this week.
 *
 * It is also the single most useful thing an investor can be told. A platform
 * that shows both crashes, names what caused them, and says what ended them is
 * doing something the sales-led sites structurally cannot.
 *
 * The design follows from that. Each era is a card the reader can open: what
 * drove it, how far prices moved, and what it means for a decision being made
 * now. Falls are coloured as prominently as rises, and the two drawdowns are
 * pulled out at the top rather than buried in sequence.
 */
export default function MarketCycleHistory({ style }) {
  const [openId, setOpenId] = useState("crash");   // opens on the 2008 crash by design

  const muted = T?.textMuted || "#8A94A6";
  const text = T?.textSecondary || "#C9D1D9";
  const border = T?.border || "rgba(255,255,255,0.08)";
  const white = T?.white || "#fff";

  /* Bar width is proportional to the size of the move, so a 60% fall reads as
     three times a 20% rise rather than being flattened to the same pill. */
  const widthFor = era => {
    if (!era.priceMove) return 8;
    const mid = (era.priceMove.low + era.priceMove.high) / 2;
    return Math.max(8, Math.min(100, mid * 0.28));
  };

  return (
    <div style={style}>
      {/* ── Framing ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{
          margin: 0, fontSize: 15, fontWeight: 800, color: white,
          fontFamily: "Fraunces,serif",
        }}>
          {historySpanYears()} years of Dubai property — the whole cycle
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: 11, color: muted, lineHeight: 1.6, maxWidth: 720 }}>
          Most Dubai property sites begin their charts in 2021, where the line only rises.
          This one starts in 2002, when foreigners were first allowed to own here, and
          includes both times the market fell. Open any era to see what caused it and what
          it means for a decision you are making now.
        </p>
      </div>

      {/* ── The two falls, stated up front ──────────────────────────────── */}
      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16,
        padding: "12px 14px", borderRadius: 10,
        border: "1px solid rgba(252,129,129,0.25)", background: "rgba(252,129,129,0.05)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#FC8181", width: "100%" }}>
          This market has fallen twice
        </div>
        {MAJOR_DRAWDOWNS.map(d => (
          <div key={d.id} style={{ flex: "1 1 200px", minWidth: 190 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FC8181", fontFamily: "Fraunces,serif" }}>
              {d.priceLabel}
            </div>
            <div style={{ fontSize: 11, color: text, marginTop: 3 }}>
              {d.title} · {d.from}–{d.to}
            </div>
          </div>
        ))}
        <div style={{ flex: "1 1 100%", fontSize: 10, color: muted, lineHeight: 1.55, marginTop: 4 }}>
          Neither is a reason to avoid the market. Both are reasons to know which
          communities carry the most supply before committing to one.
        </div>
      </div>

      {/* ── The eras ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {MARKET_ERAS.map(era => {
          const isOpen = openId === era.id;
          const color = PHASE_COLOR[era.phase];
          const isDown = era.priceMove?.direction === "down";

          return (
            <div
              key={era.id}
              style={{
                border: `1px solid ${isOpen ? color + "55" : border}`,
                borderRadius: 10,
                background: isOpen ? color + "0A" : "rgba(255,255,255,0.02)",
                overflow: "hidden",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : era.id)}
                aria-expanded={isOpen}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", cursor: "pointer", textAlign: "left",
                  background: "transparent", border: "none", fontFamily: "'Outfit',sans-serif",
                }}
              >
                {/* Years */}
                <span style={{ fontSize: 11, color: muted, width: 74, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {era.from}{era.to !== era.from ? `–${era.to}` : ""}
                </span>

                {/* Phase pill */}
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 999, flexShrink: 0,
                  background: color + "1A", color, border: `1px solid ${color}40`,
                }}>
                  {PHASE_LABEL[era.phase]}
                </span>

                {/* Title */}
                <span style={{ fontSize: 12.5, fontWeight: 600, color: white, flex: 1, minWidth: 100 }}>
                  {era.title}
                </span>

                {/* Proportional move bar */}
                <span style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                  <span style={{
                    height: 6, width: widthFor(era), borderRadius: 3,
                    background: color, opacity: 0.75, display: "inline-block",
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: 800, color, width: 108, textAlign: "right",
                    fontFamily: "Fraunces,serif",
                  }}>
                    {era.priceLabel}
                  </span>
                </span>

                <span style={{ fontSize: 13, color: muted, width: 12, textAlign: "center", flexShrink: 0 }}>
                  {isOpen ? "–" : "+"}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px 14px", borderTop: `1px solid ${border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: muted, margin: "12px 0 5px" }}>
                    What drove it
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: text, lineHeight: 1.65 }}>{era.driver}</p>

                  <p style={{ margin: "10px 0 0", fontSize: 12, color: text, lineHeight: 1.7 }}>{era.detail}</p>

                  <div style={{
                    marginTop: 12, padding: "10px 12px", borderRadius: 8,
                    background: isDown ? "rgba(252,129,129,0.07)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isDown ? "rgba(252,129,129,0.2)" : border}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: isDown ? "#FC8181" : color, marginBottom: 5 }}>
                      What it teaches
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: text, lineHeight: 1.65 }}>{era.lesson}</p>
                  </div>

                  <div style={{ fontSize: 9.5, color: muted, marginTop: 9 }}>
                    Source: {era.source}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Honesty about precision ─────────────────────────────────────── */}
      <p style={{ fontSize: 10, color: muted, lineHeight: 1.6, marginTop: 12, maxWidth: 760 }}>
        Figures before 2020 are shown as ranges because that is how they are published.
        Dubai had no single authoritative residential price index in its early years, so
        "prices fell 50–60% between 2008 and 2011" is an honest statement where a single
        decimal would not be. Reviewed {MARKET_HISTORY_AS_OF}.
      </p>
    </div>
  );
}
