/* eslint-disable */
/*
  DXB ANALYTICS �€” SMART PHONE INPUT
  Country code selector with flag + dial code + number input
  Used by: Add Lead form, Create Agent form
*/

import React, { useState, useRef, useEffect } from "react";
import { SORTED_COUNTRIES } from "../data/countries";
import { T } from "../data";

export default function PhoneInput({ value, onChange, placeholder = "50 XXX XXXX" }) {
  const [dialCode, setDialCode] = useState("+971");
  const [flag, setFlag] = useState("🇦🇪");
  const [number, setNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // Parse incoming value
  useEffect(() => {
    if (value && !number) {
      const match = SORTED_COUNTRIES.find(c => value.startsWith(c.dial));
      if (match) {
        setDialCode(match.dial);
        setFlag(match.flag);
        setNumber(value.replace(match.dial, "").trim());
      } else {
        setNumber(value);
      }
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (country) => {
    setDialCode(country.dial);
    setFlag(country.flag);
    setSearch("");
    setOpen(false);
    onChange(country.dial + " " + number);
  };

  const handleNumber = (v) => {
    setNumber(v);
    onChange(dialCode + " " + v);
  };

  const filtered = search.trim()
    ? SORTED_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.nationality.toLowerCase().includes(search.toLowerCase())
      )
    : SORTED_COUNTRIES;

  const inp = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid " + T.border,
    color: T.white,
    fontSize: 12,
    outline: "none",
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", gap: 6 }}>

      {/* Dial code selector */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          ...inp,
          padding: "8px 10px",
          borderRadius: 7,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
          minWidth: 90,
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 16 }}>{flag}</span>
        <span style={{ fontSize: 12, color: T.textSecondary }}>{dialCode}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={e => handleNumber(e.target.value)}
        placeholder={placeholder}
        style={{ ...inp, flex: 1, padding: "8px 10px", borderRadius: 7, boxSizing: "border-box" }}
      />

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          width: 280,
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
              placeholder="Search country or code..."
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
                  background: dialCode === c.dial && flag === c.flag ? "rgba(212,168,67,0.08)" : "transparent",
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
                onMouseLeave={e => e.currentTarget.style.background = dialCode === c.dial ? "rgba(212,168,67,0.08)" : "transparent"}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
