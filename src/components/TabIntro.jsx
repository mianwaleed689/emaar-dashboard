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
 * ── WHY IT FOLDS ───────────────────────────────────────────────────────────
 *
 * The fix for "nothing explains this" overshot into "eight lines of preamble
 * before any content". On Listings the intro ran to the middle of the screen,
 * and an agent who opens that tab twenty times a day reads none of it. An
 * explanation nobody reads is not an explanation.
 *
 * So the intro states its one orienting sentence and folds the rest. What it
 * does NOT fold:
 *
 *   excludes   the honest disclosure — what this tab does not do. Hiding a
 *              limitation behind a click is how a user discovers it the
 *              expensive way. Listings says there is no portal integration;
 *              that sentence stays on screen.
 *   warning    the thing that must be read before quoting a number.
 *
 * What folds is reference material: the worked example and the coverage list.
 * Both stay one labelled click away, on the same screen.
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
import React, { useState } from "react";
import { T } from "../data";

export default function TabIntro({ title, what, detail, includes, excludes, warning }) {
  const [open, setOpen] = useState(false);
  const foldable = Boolean(detail || includes);

  /* The toggle belongs beside the heading when there is one. Where a tab
     supplies its own heading further down and passes none here, it belongs
     under the sentence instead — on its own it headed an empty row and read
     as an unfinished control. */
  const chip = foldable ? (
    <button type="button" onClick={() => setOpen(o => !o)}
      title="What this tab covers, and a worked example"
      style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid " + T.border,
               background: "transparent", color: T.textMuted, fontSize: 10.5,
               cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
      {open ? "Hide the detail" : "What this covers"}
    </button>
  ) : null;

  return (
    <div style={{ marginBottom: 16 }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.white, margin: 0 }}>{title}</h2>
          {chip}
        </div>
      )}

      {what && (
        <p style={{ fontSize: 13.5, color: T.textSecondary, marginTop: title ? 8 : 0,
                    lineHeight: 1.75, maxWidth: 840 }}>
          {what}
        </p>
      )}

      {!title && chip && <div style={{ marginTop: 8 }}>{chip}</div>}

      {open && detail && (
        <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 6,
                    lineHeight: 1.75, maxWidth: 840 }}>
          {detail}
        </p>
      )}

      {open && includes && (
        <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.6, color: T.textMuted }}>
          <span style={{ color: T.green, fontWeight: 700 }}>Covers</span> — {includes}
        </div>
      )}

      {/* Never folded. A user must not have to go looking for the limits. */}
      {excludes && (
        <div style={{ marginTop: 9, fontSize: 11.5, lineHeight: 1.6, color: T.textMuted }}>
          <span style={{ color: T.textMuted, fontWeight: 700 }}>Not covered</span> — {excludes}
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
