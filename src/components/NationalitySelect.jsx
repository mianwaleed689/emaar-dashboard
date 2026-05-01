/* eslint-disable */
/*
  DXB ANALYTICS �€” NATIONALITY SELECT
  Searchable dropdown with flag + nationality
  Used by: Add Lead form
*/

import React, { useState, useRef, useEffect } from "react";
import { SORTED_COUNTRIES } from "../data/countries";
import { T } from "../data";

export default function NationalitySelect({ value, onChange, placeholder = "Select nationality" }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = SORTED_COUNTRIES.find(c => c.nationality === value || c.name === value);

  const filtered = search.trim()
    ? SORTED_COUNTRIES.filter(c =>
        c.nationality.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : SORTED_COUNTRIES;

  const select = (country) => {
    onChange(country.nationality);
    setSearch("");
    setOpen(false);
  };

  const inp = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid " + T.border,
    color: T.white,
    fontSize: 12,
    outline: "none",
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          ...inp,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 7,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxSizing: "border-box",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          {selected
            ? <><span style={{ fontSize: 16 }}>{selected.flag}</span><span style={{ color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.nationality}</span></>
            : <span style={{ color: T.textMuted }}>{placeholder}</span>
          }
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#0D1117",
          border: "1px solid " + T.border,
          borderRadius: 10,
          zIndex: 9999,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid " + T.border }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search nationality or country..."
              style={{ ...inp, width: "100%", padding: "6px 10px", borderRadius: 6, boxSizing: "border-box" }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: T.textMuted }}>No results</div>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => select(c)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: value === c.nationality ? "rgba(212,168,67,0.08)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid " + T.border + "30",
                  color: T.white,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  fontFamily: "'Outfit', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = value === c.nationality ? "rgba(212,168,67,0.08)" : "transparent"}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.white }}>{c.nationality}</span>
                <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{c.name}</span>
              </button>
            ))}
          </div>
          {/* Clear */}
          {value && (
            <div style={{ padding: "8px 10px", borderTop: "1px solid " + T.border }}>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid " + T.border, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
