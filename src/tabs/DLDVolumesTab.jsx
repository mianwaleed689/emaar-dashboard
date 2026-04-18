/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — DLD VOLUMES TAB
   Extracted from EmaarDashboardV2.jsx
   DLD transaction volumes by community, type, developer
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { Section, Chart, CustomTooltip, DataBadge, TabSources } from "../components/SharedUI";
import SEED_DATA from "../utils/seedData";

function DLDVolumesTab({ dldFilter, setDldFilter, dldSearch, setDldSearch, dldSort, setDldSort, dldView, setDldView, liveDLDVolumes, globalFilters = {}, allDevelopers = [], handleTabChange }) {

  /* Phase 2.4 Batch 5: derive matching communities from global filter */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;
  const gfType = globalFilters?.type && globalFilters.type !== "all"
    ? String(globalFilters.type).toLowerCase() : null;

  const dldGfRecord = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      )
    : null;
  const dldGfDevName = dldGfRecord?.name ? String(dldGfRecord.name).toLowerCase() : null;
  const dldGfCommunities = (dldGfRecord && Array.isArray(dldGfRecord.communities) && dldGfRecord.communities.length > 0)
    ? new Set(dldGfRecord.communities.map(c => String(c).toLowerCase()))
    : null;

  const dldMatchesGlobalFilter = (d) => {
    if (!d) return false;
    if (gfDev) {
      const rowDev = String(d.developer || "").toLowerCase();
      const rowCommunity = String(d.community || "").toLowerCase();
      const devMatch = dldGfDevName && rowDev === dldGfDevName;
      const communityMatch = dldGfCommunities && dldGfCommunities.has(rowCommunity);
      if (!devMatch && !communityMatch) return false;
    }
    if (gfCommunity) {
      if (String(d.community || "").toLowerCase() !== gfCommunity) return false;
    }
    if (gfType) {
      const TYPE_LABEL_MAP = {
        "apartment": "apartment", "villa": "villa", "townhouse": "townhouse",
        "penthouse": "penthouse", "duplex": "duplex", "garden_home": "garden home",
        "sky_villa": "sky villa", "hotel_apartment": "hotel apartment",
        "serviced_apartment": "serviced apartment", "resort_villa": "resort villa",
        "branded_residence": "branded residence", "office": "office",
        "retail": "retail", "showroom": "showroom", "warehouse": "warehouse",
        "co_working_space": "co-working space", "land": "land",
      };
      const rowType = String(d.type || "").toLowerCase().trim();
      const wantedType = TYPE_LABEL_MAP[gfType] || gfType;
      if (rowType !== wantedType) return false;
    }
    return true;
  };


            /* ── Local state ── */
            /* state moved to top level */

            /* ── Filter data ── */
            const rawDataUnfiltered = (() => {
              const live = (liveDLDVolumes || []).filter(d => d.community || d.developer || d.type);
              return live.length > 0 ? live : SEED_DATA.dldVolumes;
            })();
            // Phase 2.4 Batch 5: apply top-bar global filter first.
            const rawData = rawDataUnfiltered.filter(dldMatchesGlobalFilter);
            const dldIsSeed = !liveDLDVolumes?.length;
            const filtered = rawData.filter(d => {
              if (dldFilter.community !== "All" && d.community !== dldFilter.community) return false;
              if (dldFilter.type !== "All" && d.type !== dldFilter.type) return false;
              if (dldFilter.txType !== "All" && d.txType !== dldFilter.txType) return false;
              if (dldFilter.developer !== "All" && d.developer !== dldFilter.developer) return false;
              if (dldFilter.nationality !== "All" && d.nationality !== dldFilter.nationality) return false;
              if (dldSearch && !JSON.stringify(d).toLowerCase().includes(dldSearch.toLowerCase())) return false;
              return true;
            }).sort((a, b) => (b[dldSort] || 0) - (a[dldSort] || 0));

            /* ── Unique filter options ── */
            const communities = ["All", ...new Set(rawData.map(d => d.community).filter(Boolean))];
            const types = ["All", "Apartment", "Villa", "Townhouse", "Office", "Retail", "Hotel Apartment", "Land"];
            const txTypes = ["All", "Off-Plan", "Ready", "Secondary"];
            const developers = ["All", ...new Set(rawData.map(d => d.developer).filter(Boolean))];

            /* ── Summary stats ── */
            const totalTx = filtered.reduce((a, b) => a + (b.transactions || b.count || 0), 0);
            const totalVol = filtered.reduce((a, b) => a + (b.volume || b.totalValue || 0), 0);
            const avgPpsf = filtered.length > 0
              ? Math.round(filtered.reduce((a, b) => a + (b.avgPpsf || b.ppsf || 0), 0) / filtered.filter(d => d.avgPpsf || d.ppsf).length || 0)
              : 0;

            const selStyle = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif",
              fontSize: 12, padding: "7px 28px 7px 10px", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            };

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>DLD Transaction Intelligence</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Official Dubai Land Department registry · Live data · Auto-refreshes daily</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                      {["table", "chart"].map(v => (
                        <button key={v} type="button" onClick={() => setDldView(v)}
                          style={{ padding: "6px 14px", background: dldView === v ? "rgba(212,168,67,0.15)" : "transparent", color: dldView === v ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: T.green }}>
                      DLD Official
                    </span>
                  </div>
                </div>

                {/* Seed badge */}
                {dldIsSeed && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:T.gold,display:"inline-block"}} />
                    <span style={{fontSize:11,color:T.textMuted}}><span style={{color:T.gold,fontWeight:700}}>Research-based seed data</span> — DXBAnalytics.com / DLD 2025 · Replace via Admin → Data Manager</span>
                  </div>
                )}
                {/* ── Summary KPIs ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Total Transactions", value: totalTx > 0 ? totalTx.toLocaleString() : "—", sub: "Filtered results" },
                    { label: "Total Volume", value: totalVol > 0 ? "AED " + (totalVol / 1e9).toFixed(1) + "B" : "—", sub: "Registered value" },
                    { label: "Avg Price/sqft", value: avgPpsf > 0 ? "AED " + avgPpsf.toLocaleString() : "—", sub: "Registered PPSF" },
                    { label: "Communities", value: communities.length - 1 > 0 ? (communities.length - 1).toString() : "—", sub: "In dataset" },
                  ].map((kpi, i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: T.white, marginBottom: 4 }}>{kpi.value}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── Smart Filters ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "0 0 200px" }}>
                      {SvgIcons.Search({ width: 13, height: 13, style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" } })}
                      <input value={dldSearch} onChange={e => setDldSearch(e.target.value)}
                        placeholder="Search communities..."
                        style={{ ...selStyle, paddingLeft: 30, paddingRight: 10, width: "100%", backgroundImage: "none" }} />
                    </div>
                    {/* Community */}
                    <select value={dldFilter.community} onChange={e => setDldFilter(f => ({ ...f, community: e.target.value }))} style={selStyle}>
                      {communities.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {/* Property Type */}
                    <select value={dldFilter.type} onChange={e => setDldFilter(f => ({ ...f, type: e.target.value }))} style={selStyle}>
                      {types.map(t => <option key={t}>{t}</option>)}
                    </select>
                    {/* Transaction Type */}
                    <select value={dldFilter.txType} onChange={e => setDldFilter(f => ({ ...f, txType: e.target.value }))} style={selStyle}>
                      {txTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    {/* Sort */}
                    <select value={dldSort} onChange={e => setDldSort(e.target.value)} style={selStyle}>
                      <option value="transactions">Sort: Volume</option>
                      <option value="avgPpsf">Sort: PPSF High</option>
                      <option value="volume">Sort: Total Value</option>
                    </select>
                    {/* Results count */}
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>
                      {filtered.length} of {rawData.length} results
                    </span>
                    {/* Reset */}
                    {(dldSearch || Object.values(dldFilter).some(v => v !== "All")) && (
                      <button type="button" onClick={() => { setDldFilter({ community: "All", type: "All", txType: "All", developer: "All", nationality: "All" }); setDldSearch(""); }}
                        style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* ── No data state ── */}
                {rawData.length === 0 && !dldIsSeed && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "40px 24px", textAlign: "center", marginBottom: 20 }}>
                    <div style={{ marginBottom: 12 }}>{SvgIcons.Database({ width: 36, height: 36, style: { color: T.textMuted, display: "inline-block" } })}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 8 }}>DLD data not yet synced</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Data auto-syncs daily via cron job</div>
                    <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Check Admin → Data Health → DLD Cron status</div>
                  </div>
                )}

                {/* ── Chart View ── */}
                {dldView === "chart" && filtered.length > 0 && (
                  <div className="chart-box" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>Transaction Volume by Community</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={filtered.slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="community" tick={{ fill: T.textSecondary, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} />
                        <Bar dataKey="transactions" name="Transactions" fill={T.gold} radius={[0,6,6,0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ── Table View ── */}
                {dldView === "table" && filtered.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 0, background: T.surfaceAlt, padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
                      {["Community", "Type", "Transactions", "Avg PPSF", "Total Volume", "YoY Change"].map((h, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {/* Table rows */}
                    {filtered.slice(0, 50).map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 0, padding: "11px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{row.community || "—"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.type || "Residential"}</div>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>{(row.transactions || row.count || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 13, color: T.gold }}>AED {(row.avgPpsf || row.ppsf || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.volume ? "AED " + (row.volume / 1e6).toFixed(0) + "M" : "—"}</div>
                        <div style={{ fontSize: 12, color: row.change > 0 ? T.green : row.change < 0 ? T.red : T.textMuted }}>
                          {row.change ? (row.change > 0 ? "+" : "") + row.change + "%" : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick nav */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "Price History →", tab: "Price History" },
                    { label: "Neighbourhoods →", tab: "Neighbourhoods" },
                    { label: "Investment Score →", tab: "Investment Score" },
                  ].map((n,i) => (
                    <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
                      style={{ padding: "6px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {/* Sources */}
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "DXBinteract", "ValuStrat", "REIDIN"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default DLDVolumesTab;
