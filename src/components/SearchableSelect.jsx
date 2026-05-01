/* eslint-disable */
/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
   SearchableSelect ‚‚Ç¨‚Äù premium custom dropdown for large option lists
   Replaces native HTML <select> when you have 20+ options.
   
   Features:
   - Type to search (substring match on label)
   - Keyboard nav: ‚Ü‚Äò/‚Ü‚Äú to move, ‚èé to select, ‚êõ to close
   - Optional count badges per option (e.g. "Dubai Marina ¬∑ 68")
   - Dark theme matching the rest of the app
   - Portal rendering so dropdown escapes overflow clipping
   - Click-outside to close
   - Sentence case throughout
   ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export default function SearchableSelect({
  value,
  onChange,
  options = [],         // Array of { value, label, count? }
  placeholder = "All",
  T,                    // Theme object
  width = "100%",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  /* Selected option for display label */
  const selected = options.find(o => o.value === value);
  const selectedLabel = selected ? selected.label : placeholder;

  /* Filtered options based on search */
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(o => String(o.label).toLowerCase().includes(q));
  }, [options, search]);

  /* Position the dropdown panel below the trigger */
  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
      /* Auto-focus search input */
      setTimeout(() => searchRef.current?.focus(), 20);
    }
  }, [open]);

  /* Click-outside to close */
  useEffect(() => {
    if (!open) return;
    function onClick(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
      setSearch("");
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  /* Reset highlight when search changes */
  useEffect(() => { setHighlightIdx(0); }, [search]);

  /* Keyboard navigation */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false); setSearch("");
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlightIdx];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
        setSearch("");
      }
    }
  }

  const isActive = value && value !== "all" && value !== "All";

  /* Trigger button styling ‚‚Ç¨‚Äù premium pill */
  const triggerStyle = {
    width,
    background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
    border: `1px solid ${isActive ? "rgba(212,168,67,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10,
    color: isActive ? T.gold : T.white,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    padding: "10px 36px 10px 14px",
    outline: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    boxShadow: isActive
      ? "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 3px rgba(212,168,67,0.12), 0 1px 2px rgba(0,0,0,0.2)"
      : "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.2)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  /* Highlighted text with search match */
  function highlightMatch(text, q) {
    if (!q || !q.trim()) return text;
    const t = String(text);
    const qLower = q.toLowerCase();
    const tLower = t.toLowerCase();
    const idx = tLower.indexOf(qLower);
    if (idx === -1) return t;
    return (
      <>
        {t.slice(0, idx)}
        <mark style={{ background: "rgba(212,168,67,0.3)", color: T.gold, padding: "0 2px", borderRadius: 3, fontWeight: 600 }}>
          {t.slice(idx, idx + q.length)}
        </mark>
        {t.slice(idx + q.length)}
      </>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        style={triggerStyle}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {selectedLabel}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={isActive ? "#d4a843" : "#a0a0a0"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            position: "absolute", right: 12,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <div
          ref={listRef}
          style={{
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: Math.max(rect.width, 280),
            zIndex: 1000,
            background: "#161a22",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                style={{
                  background: "none",
                  border: "none",
                  color: T.white,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  outline: "none",
                  width: "100%",
                  padding: 0,
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 0, fontSize: 14 }}
                >√‚Äî</button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "20px 14px", fontSize: 13, color: T.textMuted, textAlign: "center" }}>
                No matches for "{search}"
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightIdx;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: isHighlighted ? "rgba(212,168,67,0.12)" : isSelected ? "rgba(212,168,67,0.06)" : "transparent",
                      border: "none",
                      borderLeft: isSelected ? `3px solid ${T.gold}` : "3px solid transparent",
                      color: isSelected ? T.gold : T.white,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {highlightMatch(opt.label, search)}
                    </span>
                    {opt.count != null && (
                      <span style={{
                        fontSize: 11,
                        color: T.textMuted,
                        background: "rgba(255,255,255,0.05)",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}>
                        {opt.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "7px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11,
            color: T.textMuted,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>{filtered.length} {filtered.length === 1 ? "match" : "matches"}</span>
            <span style={{ opacity: 0.6 }}>‚Ü‚Äò‚Ü‚Äú nav ¬∑ ‚èé select ¬∑ ‚êõ close</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
