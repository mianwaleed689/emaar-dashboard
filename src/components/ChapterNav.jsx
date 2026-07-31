import React from "react";
import { T } from "../data";

/**
 * Chapter navigation for a long analytical page.
 *
 * ── THE PROBLEM IT SOLVES ───────────────────────────────────────────────────
 *
 * The Market tab had ten sections in an order nobody chose: the 24-year history,
 * then the almanac, then this year's scorecard, then a global comparison, then a
 * tax calculator, then market composition, then supply, then forecasts. Each
 * section was fine. The sequence taught nothing, because there was no argument
 * running through it — a reader arriving at the middle had no idea whether they
 * had missed something that would make it make sense.
 *
 * Naming the chapters turns a pile into a path: where the market is, how it got
 * here, how it compares, what is coming, what it means for you. Each entry says
 * what a reader will learn, so clicking it is a decision rather than a guess.
 *
 * Anchors rather than tabs, deliberately: the whole page stays scrollable and
 * printable, and a reader who wants the argument in order simply keeps reading.
 */
export default function ChapterNav({ chapters = [], style }) {
  const muted = T?.textMuted || "#8A94A6";
  const border = T?.border || "rgba(255,255,255,0.08)";
  const white = T?.white || "#fff";
  const gold = T?.gold || "#D4A843";

  const go = id => e => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!chapters.length) return null;

  return (
    <nav
      aria-label="Sections of this page"
      style={{
        border: `1px solid ${border}`, borderRadius: 12,
        padding: "14px 16px", marginBottom: 26,
        background: "rgba(255,255,255,0.02)", ...style,
      }}
    >
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
        color: muted, marginBottom: 11, fontFamily: "'Outfit',sans-serif",
      }}>
        What this page covers
      </div>

      <ol style={{
        margin: 0, padding: 0, listStyle: "none",
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 9,
      }}>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              onClick={go(c.id)}
              style={{
                display: "block", textDecoration: "none",
                padding: "10px 12px", borderRadius: 9,
                border: `1px solid ${border}`, background: "rgba(255,255,255,0.02)",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: gold, fontFamily: "Fraunces,serif" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: white, fontFamily: "'Outfit',sans-serif" }}>
                  {c.title}
                </span>
              </div>
              {/* What a reader gets from it — so the click is informed. */}
              <div style={{ fontSize: 10, color: muted, marginTop: 4, lineHeight: 1.5 }}>
                {c.learn}
              </div>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Anchor target and visual divider between chapters.
 * `scrollMarginTop` keeps a sticky header from covering the heading when a
 * reader jumps to it.
 */
export function Chapter({ id, index, title, learn, children }) {
  const muted = T?.textMuted || "#8A94A6";
  const border = T?.border || "rgba(255,255,255,0.08)";
  const white = T?.white || "#fff";
  const gold = T?.gold || "#D4A843";

  return (
    <section id={id} style={{ scrollMarginTop: 80, marginTop: 38 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 10,
        paddingBottom: 9, borderBottom: `1px solid ${border}`, marginBottom: 16, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: gold, fontFamily: "Fraunces,serif" }}>
          {String(index).padStart(2, "0")}
        </span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: white, fontFamily: "Fraunces,serif" }}>
          {title}
        </h2>
        {learn && (
          <span style={{ fontSize: 11, color: muted, lineHeight: 1.5, flex: "1 1 240px" }}>
            {learn}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
