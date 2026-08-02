/* eslint-disable */
/**
 * TabIntro — the paragraph every tab must open with.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * The clarity check run across all 29 shipped tabs on 2026-08-02 found the same
 * blocking failure on 14 of them: "no plain-English explanation before the
 * controls". Users were dropped straight into filters with nothing telling them
 * what they were looking at.
 *
 * Rather than write 14 different intros that drift apart, every tab renders
 * this one component and supplies its copy from src/data/tabCopy.js.
 *
 * ── WHAT IT ENFORCES ───────────────────────────────────────────────────────
 *
 *   what       one sentence in plain words. What IS this number/screen.
 *   detail     optional second sentence — a worked example or the nuance.
 *   includes   what is covered, so coverage is never a surprise
 *   excludes   what is NOT covered, stated up front rather than discovered
 *
 * TAB_CLARITY.md checks 1, 3 and the coverage rule.
 */
import React from "react";
import { T } from "../data";

export default function TabIntro({ title, what, detail, includes, excludes, warning }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {title && (
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.white, margin: 0 }}>{title}</h2>
      )}

      {what && (
        <p style={{ fontSize: 13.5, color: T.textSecondary, marginTop: 8,
                    lineHeight: 1.75, maxWidth: 840 }}>
          {what}
          {detail && <> {detail}</>}
        </p>
      )}

      {(includes || excludes) && (
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 10,
                      fontSize: 11.5, lineHeight: 1.6 }}>
          {includes && (
            <div style={{ color: T.textMuted }}>
              <span style={{ color: T.green, fontWeight: 700 }}>Covers</span> — {includes}
            </div>
          )}
          {excludes && (
            <div style={{ color: T.textMuted }}>
              <span style={{ color: T.textMuted, fontWeight: 700 }}>Not covered</span> — {excludes}
            </div>
          )}
        </div>
      )}

      {/* Reserved for the thing a user must read before quoting anything —
          gross vs net, a staleness warning, a known gap. */}
      {warning && (
        <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10,
                      border: "1px solid rgba(239,68,68,0.25)",
                      background: "rgba(239,68,68,0.03)" }}>
          <div style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.75 }}>
            {warning}
          </div>
        </div>
      )}
    </div>
  );
}
