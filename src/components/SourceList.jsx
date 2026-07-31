import React from "react";
import { T } from "../data";
import { normaliseSources, sourceHost } from "../utils/sources";

/**
 * Renders citations as links a reader can actually open.
 *
 * Sources with a URL become anchors showing the publisher and hostname, so a
 * reader can see where a claim comes from before clicking. Sources without one —
 * a paywalled report, a printed release — render as plain text with "no public
 * link", which is more honest than a dead anchor or a silent omission.
 *
 * External links carry rel="noopener noreferrer": without noopener the opened
 * page gets a handle back to this one via window.opener.
 */
export default function SourceList({ sources, compact = false, style }) {
  const list = normaliseSources(sources);
  if (!list.length) return null;

  const muted = T?.textMuted || "#8A94A6";
  const link = T?.gold || "#D4A843";
  const border = T?.border || "rgba(255,255,255,0.08)";

  return (
    <div style={style}>
      {!compact && (
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
          color: muted, marginBottom: 6,
        }}>
          Sources — {list.filter(s => s.url).length} of {list.length} open the original
        </div>
      )}

      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
        {list.map((s, i) => {
          const host = sourceHost(s.url);
          return (
            <li key={`${s.title}-${i}`} style={{ fontSize: 10.5, lineHeight: 1.55, color: muted }}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: link, textDecoration: "none",
                    borderBottom: `1px solid ${link}44`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderBottomColor = link)}
                  onMouseLeave={e => (e.currentTarget.style.borderBottomColor = link + "44")}
                >
                  {s.title}
                </a>
              ) : (
                <span style={{ color: muted }}>{s.title}</span>
              )}

              {(s.publisher || s.date || host) && (
                <span style={{ color: muted, opacity: 0.8 }}>
                  {" — "}
                  {[s.publisher, s.date, host].filter(Boolean).join(" · ")}
                </span>
              )}

              {!s.url && (
                <span style={{
                  marginLeft: 6, padding: "1px 5px", borderRadius: 4,
                  border: `1px solid ${border}`, fontSize: 8.5, color: muted, opacity: 0.85,
                }}>
                  {s.paywalled ? "paywalled" : "no public link"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
