/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — GLOBAL CONTEXT FILTER
   Extracted from EmaarDashboardV2.jsx (lines 246-448)
   Fixed filter bar: developer, property type, beds, status, price
   Shows active filter count, Golden Visa badge, clear all
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { PROPERTY_TYPES, STATUS_OPTIONS, PRICE_PRESETS_APT, PRICE_PRESETS_VILLA, GOLDEN_VISA_THRESHOLD } from "../utils/constants";

const GlobalContextFilter = ({
  gDeveloper, setGDeveloperAndReset,
  gCommunity, setGCommunity,
  gPropertyType, setGPropertyTypeAndReset,
  gSubType, setGSubType,
  gBeds, setGBeds,
  gStatus, setGStatus,
  gPriceMin, setGPriceMin,
  gPriceMax, setGPriceMax,
  allDevelopers, T,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedTypeData = PROPERTY_TYPES.flatMap(g => g.types).find(t => t.value === gPropertyType);
  const bedsOptions = selectedTypeData?.beds || ["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+"];

  const isVilla = ["villa","townhouse","sky_villa","resort_villa"].includes(gPropertyType);
  const pricePresets = isVilla ? PRICE_PRESETS_VILLA : PRICE_PRESETS_APT;

  const activeCount = [
    gDeveloper !== "all", gCommunity !== "all", gPropertyType !== "all",
    gBeds !== "all", gStatus !== "all", gPriceMin > 0 || gPriceMax > 0,
  ].filter(Boolean).length;

  const resetAll = () => {
    setGDeveloperAndReset("all"); setGCommunity("all");
    setGPropertyTypeAndReset("all"); setGSubType("all");
    setGBeds("all"); setGStatus("all"); setGPriceMin(0); setGPriceMax(0);
  };

  const selStyle = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.white, fontFamily: "'Outfit', sans-serif", fontSize: 12,
    padding: "6px 10px", outline: "none", cursor: "pointer",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
    paddingRight: 26, transition: "border-color 0.2s",
  };
  const activeSelStyle = { ...selStyle, borderColor: `rgba(212,168,67,0.5)`, color: T.gold };

  return (
    <div style={{ position: "fixed", top: 60, left: 240, right: 0, zIndex: 45, background: `${T.surface}f8`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", flexWrap: "wrap" }}>

        {activeCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{activeCount} filter{activeCount > 1 ? "s" : ""} active</span>
          </div>
        )}

        <select value={gDeveloper} onChange={e => setGDeveloperAndReset(e.target.value)} style={gDeveloper !== "all" ? activeSelStyle : selStyle}>
          <option value="all">All Developers</option>
          {allDevelopers?.length > 0
            ? allDevelopers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
            : ["Emaar","DAMAC","Sobha","Nakheel","Meraas","Aldar","Binghatti","Ellington","Omniyat","Azizi","Danube","Samana","MAG","Imtiaz"].map(n => (
                <option key={n} value={n.toLowerCase()}>{n}</option>
              ))
          }
        </select>

        <select value={gPropertyType} onChange={e => setGPropertyTypeAndReset(e.target.value)} style={gPropertyType !== "all" ? activeSelStyle : selStyle}>
          <option value="all">All Types</option>
          {PROPERTY_TYPES.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </optgroup>
          ))}
        </select>

        <select value={gBeds} onChange={e => setGBeds(e.target.value)} style={gBeds !== "all" ? activeSelStyle : selStyle}>
          <option value="all">All Configs</option>
          {bedsOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={gStatus} onChange={e => setGStatus(e.target.value)} style={gStatus !== "all" ? activeSelStyle : selStyle}>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={`${gPriceMin}-${gPriceMax}`} onChange={e => { const preset = pricePresets.find(p => `${p.min}-${p.max}` === e.target.value); if (preset) { setGPriceMin(preset.min); setGPriceMax(preset.max); } }} style={(gPriceMin > 0 || gPriceMax > 0) ? activeSelStyle : selStyle}>
          {pricePresets.map(p => (
            <option key={`${p.min}-${p.max}`} value={`${p.min}-${p.max}`}>{p.label === "Any" ? "Any Price" : `AED ${p.label}`}</option>
          ))}
        </select>

        {gPriceMin >= GOLDEN_VISA_THRESHOLD && (
          <div style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: T.green, fontWeight: 600 }}>Golden Visa eligible</div>
        )}

        {activeCount > 0 && (
          <button type="button" onClick={resetAll} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: T.textMuted, fontSize: 11, fontFamily: "'Outfit', sans-serif", transition: "all 0.15s" }}>Clear all</button>
        )}

        <div style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block" }} />
          Live · Firestore
        </div>
      </div>
    </div>
  );
};

export default GlobalContextFilter;
