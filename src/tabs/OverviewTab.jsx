/* eslint-disable */
/* OVERVIEW TAB — Dashboard home with KPIs from all live sources */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import SEED_DATA from "../utils/seedData";

function OverviewTab({
  liveMarketData, liveDLDVolumes, liveDevHealth, liveMortgageRates, liveYields,
  allDevelopers, deals, listings, myLeads, myPortfolio, watchlist,
  aiInsights, gDeveloper, lastDataSync,
  globalFilters = {},
  handleTabChange,
}) {

  /* Phase 2.4 Batch 1: derive which communities match the current filters.
     - If gDeveloper === "all" and no community filter, returns null (no filter).
     - Otherwise returns a Set of community names that match.
     - Looking up by developer uses allDevelopers[].communities[] (the array
       you set on each developer record in Admin → Data Manager → Developers). */
  const matchingCommunities = (() => {
    const devFilter = gDeveloper && gDeveloper !== "all" ? String(gDeveloper).toLowerCase() : null;
    const communityFilter = globalFilters?.community && globalFilters.community !== "all"
      ? String(globalFilters.community).toLowerCase()
      : null;
    if (!devFilter && !communityFilter) return null;

    // Start from all — narrow down
    let set = null;
    if (devFilter) {
      const dev = (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === devFilter ||
        String(d.name || "").toLowerCase() === devFilter ||
        String(d.name || "").toLowerCase().includes(devFilter)
      );
      if (dev && Array.isArray(dev.communities) && dev.communities.length > 0) {
        set = new Set(dev.communities.map(c => String(c).toLowerCase()));
      } else {
        // Unknown developer or no communities listed — empty result
        set = new Set();
      }
    }
    if (communityFilter) {
      if (set) {
        // Intersect
        set = new Set([...set].filter(c => c === communityFilter));
      } else {
        set = new Set([communityFilter]);
      }
    }
    return set;
  })();

  const matchesFilter = (communityName) => {
    if (!matchingCommunities) return true;
    return matchingCommunities.has(String(communityName || "").toLowerCase());
  };

  // Label for filter indicator — e.g. "Emaar Properties · Dubai Marina"
  const filterLabel = (() => {
    const parts = [];
    if (gDeveloper && gDeveloper !== "all") {
      const dev = (allDevelopers || []).find(d =>
        String(d.id).toLowerCase() === String(gDeveloper).toLowerCase()
      );
      parts.push(dev?.name || gDeveloper);
    }
    if (globalFilters?.community && globalFilters.community !== "all") {
      parts.push(globalFilters.community);
    }
    return parts.join(" · ");
  })();


            const OvKPI = ({ label, value, sub, color, icon, onClick, delay }) => (
              <div className={`kpi-card fade-up delay-${delay||1}`} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: color || T.gold, opacity: 0.8 }}>{icon}</div>
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 6 }}>{value || "—"}</div>
                {sub && <div style={{ fontSize: 11, color: T.textSecondary }}>{sub}</div>}
              </div>
            );

            const OvSection = ({ title, sub, action }) => (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, marginTop: 28 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white }}>{title}</div>
                  {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
                </div>
                {action}
              </div>
            );

            const syncTime = lastDataSync ? lastDataSync.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : null;
            const isSeed = !liveMarketData?.length;
            const kpis = (() => {
              // Only use liveMarketData if it contains metric/value formatted docs
              const live = liveMarketData?.filter?.(d => d.metric && d.value) || [];
              return live.length > 0 ? live : SEED_DATA.overviewKpis;
            })();
            const getKpi = (metric) => kpis?.find(d => d.metric === metric)?.value || "—";
            const getKpiChange = (metric) => kpis?.find(d => d.metric === metric)?.change || "";

            // yield data — live or seed, then filter by global filter
            const yieldDisplayRaw = liveYields?.length > 0 ? liveYields
              : SEED_DATA.communities.map(c => ({ community: c.community, tenantProfile: c.tenantProfile, gross: c.grossYield }));
            const yieldDisplay = yieldDisplayRaw.filter(y => matchesFilter(y.community));
            const sortedYields = [...yieldDisplay].sort((a,b) => (parseFloat(b.grossYield||b.gross)||0) - (parseFloat(a.grossYield||a.gross)||0)).slice(0,6);

            // DLD data — live or seed, then filter by global filter
            const dldDisplayRaw = liveDLDVolumes?.length > 0 ? liveDLDVolumes : SEED_DATA.dldVolumes;
            const dldDisplay = dldDisplayRaw.filter(d => matchesFilter(d.community));
            const sortedDLD = [...dldDisplay].sort((a,b) => (b.transactions||b.count||0) - (a.transactions||a.count||0)).slice(0,6);
            const dldMax = Math.max(...sortedDLD.map(d => d.transactions||d.count||0), 1);

            return (
              <div style={{ paddingTop: 8 }}>

                {/* Seed data notice */}
                {isSeed && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid rgba(212,168,67,0.2)`, marginBottom: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: T.textMuted }}>
                      <span style={{ color: T.gold, fontWeight: 700 }}>Research-based seed data</span> — DLD 2025, Bayut, REIDIN, ValuStrat · Replace via Admin → Data Manager
                    </span>
                  </div>
                )}

                {/* Verified bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: 11, color: T.textSecondary }}>
                      Live data — <span style={{ color: T.gold, fontWeight: 600 }}>DXB Analytics Intelligence Platform</span>
                      {syncTime && <span style={{ color: T.textMuted }}> · Last sync {syncTime}</span>}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: T.green }}>DLD Official</span>
                    <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}`, color: T.textMuted }}>RERA Verified</span>
                  </div>
                </div>

                {/* 7 KPI Cards */}
                <OvSection title="Market Pulse" sub="Dubai real estate — key indicators" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 8 }}>
                  <OvKPI delay={1} label="Total Market Value" icon={SvgIcons.TrendingUp({width:16,height:16})}
                    value={getKpi("Total Market Value")}
                    sub={getKpiChange("Total Market Value") || "Source: DLD 2025"}
                    onClick={() => handleTabChange("Market")} />
                  <OvKPI delay={2} label="DLD Transactions" icon={SvgIcons.Database({width:16,height:16})}
                    value={getKpi("Total Transactions")}
                    sub={getKpiChange("Total Transactions") || "Source: DLD Annual Report 2025"}
                    onClick={() => handleTabChange("DLD Volumes")} />
                  <OvKPI delay={3} label="EIBOR 3M — Live" icon={SvgIcons.Landmark({width:16,height:16})}
                    value={liveMortgageRates?.[0]?.eibor3m ? liveMortgageRates[0].eibor3m.toFixed(2) + "%" : "—"}
                    sub="Updated daily · Central Bank UAE"
                    color={T.teal} onClick={() => handleTabChange("Mortgage")} />
                  <OvKPI delay={4} label="Active Developers" icon={SvgIcons.Building2({width:16,height:16})}
                    value={gDeveloper && gDeveloper !== "all"
                      ? "1"
                      : (allDevelopers?.length > 0 ? allDevelopers.length.toString() : "50+")}
                    sub={gDeveloper && gDeveloper !== "all"
                      ? ((allDevelopers || []).find(d => String(d.id).toLowerCase() === String(gDeveloper).toLowerCase())?.name || gDeveloper)
                      : "RERA registered · DLD approved"}
                    onClick={() => handleTabChange("Developer Health")} />
                  <OvKPI delay={5} label="Avg Gross Yield" icon={SvgIcons.BarChart3({width:16,height:16})}
                    value={liveYields?.length > 0
                      ? (liveYields.reduce((a,b) => a + (parseFloat(b.gross)||0), 0) / liveYields.length).toFixed(1) + "%"
                      : (SEED_DATA.communities.reduce((a,b) => a + (parseFloat(b.grossYield)||0), 0) / SEED_DATA.communities.length).toFixed(1) + "%"}
                    sub="Across all communities · Bayut data"
                    color={T.green} onClick={() => handleTabChange("Yields")} />
                  <OvKPI delay={6} label="Off-Plan Share" icon={SvgIcons.BarChart2({width:16,height:16})}
                    value={getKpi("Off-Plan Share")}
                    sub="Of total DLD transactions"
                    onClick={() => handleTabChange("Projects")} />
                  <OvKPI delay={7} label="Units Launched" icon={SvgIcons.Activity({width:16,height:16})}
                    value={getKpi("Units Launched")}
                    sub={getKpiChange("Units Launched") || "Source: DLD Oct 2025"}
                    onClick={() => handleTabChange("Launch Calendar")} />
                </div>

                {/* 3-Column Intelligence Panel */}
                <OvSection title="Intelligence Panel"
                  sub="Context-aware — updates with your filter selection"
                  action={
                    <div style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: filterLabel ? T.gold : T.textMuted, display: "inline-block" }} />
                      {filterLabel || "All Developers"}
                    </div>
                  }
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 8 }}>

                  {/* Column 1: Top Yield Communities */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Top Communities — Yield</div>
                    {sortedYields.map((y, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
                        <div>
                          <div style={{ fontSize: 12, color: T.white, fontWeight: 500 }}>{y.community || "—"}</div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>{y.tenantProfile || "Apartment"}</div>
                        </div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: parseFloat(y.grossYield||y.gross||0) >= 7 ? T.green : parseFloat(y.grossYield||y.gross||0) >= 5.5 ? T.gold : T.textSecondary }}>
                          {parseFloat(y.grossYield||y.gross||0).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleTabChange("Yields")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      View All Yields →
                    </button>
                  </div>

                  {/* Column 2: DLD Volume */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>DLD Transaction Volume</div>
                    {sortedDLD.map((d, i) => {
                      const pct = Math.round(((d.transactions||d.count||0) / dldMax) * 100);
                      return (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: T.textSecondary }}>{d.community || "—"}</span>
                            <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{(d.transactions||d.count||0).toLocaleString()}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: T.border }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.teal})`, transition: "width 0.8s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={() => handleTabChange("DLD Volumes")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      View DLD Volumes →
                    </button>
                  </div>

                  {/* Column 3: AI Insight + Dev Health */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="chart-box" style={{ padding: 18, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, animation: "pulse 2s infinite" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>AI Market Insight</div>
                      </div>
                      {aiInsights?.length > 0
                        ? <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7 }}>{aiInsights[0]?.text || aiInsights[0]}</div>
                        : <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, fontStyle: "italic" }}>AI market analysis generates automatically every 7 days from live DLD and Bayut data.</div>
                      }
                      <div style={{ marginTop: 10, fontSize: 10, color: T.textMuted }}>
                        Powered by Claude · {aiInsights?.length > 0 ? "Updated this week" : "Connect data to activate"}
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Developer Health</div>
                      {liveDevHealth?.length > 0
                        ? [...liveDevHealth].slice(0,4).map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                              <span style={{ fontSize: 11, color: T.textSecondary }}>{d.developer || d.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (d.score||0) >= 75 ? "rgba(16,185,129,0.15)" : "rgba(212,168,67,0.15)", color: (d.score||0) >= 75 ? T.green : T.gold }}>
                                {d.score || "—"}
                              </span>
                            </div>
                          ))
                        : <div style={{ fontSize: 11, color: T.textMuted }}>Health scores load from Admin → Developer Health</div>
                      }
                      <button type="button" onClick={() => handleTabChange("Developer Health")} style={{ width: "100%", marginTop: 10, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        View All →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Feeds */}
                <OvSection title="Live Intelligence Feeds" sub="Real-time data streams — auto-refreshing" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>

                  {/* Recent DLD */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>Recent DLD</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", display: "inline-block" }} />
                        <span style={{ fontSize: 9, color: T.textMuted }}>Live</span>
                      </div>
                    </div>
                    {sortedDLD.slice(0,5).map((tx, i) => (
                      <div key={i} style={{ padding: "8px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>{tx.community || "—"}</span>
                          <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{tx.volume ? "AED " + (tx.volume/1000000000).toFixed(1) + "B" : "—"}</span>
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{tx.type || "Residential"}{"·"}{(tx.transactions||tx.count||0).toLocaleString()} deals</div>
                      </div>
                    ))}
                  </div>

                  {/* Launch Radar */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>Launch Radar</div>
                      <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View all →</button>
                    </div>
                    {SEED_DATA.launches.filter(l => l.status === "EOI Open" || l.status === "Upcoming").slice(0,3).map((l, i) => (
                      <div key={i} style={{ padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>{l.projectName?.split("—")[0]?.trim() || l.projectName}</span>
                          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: l.status === "EOI Open" ? "rgba(16,185,129,0.15)" : "rgba(212,168,67,0.1)", color: l.status === "EOI Open" ? T.green : T.gold }}>{l.status}</span>
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{l.developer}{"·"}{l.community}</div>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Open Launch Calendar →
                    </button>
                  </div>

                  {/* Platform Activity */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Platform Activity</div>
                    {[
                      { label: "Active Leads",   value: myLeads?.length || 0,     icon: SvgIcons.Users({width:14,height:14}),    tab: "My Leads",  color: T.blue },
                      { label: "My Listings",    value: listings?.length || 0,    icon: SvgIcons.Building({width:14,height:14}), tab: "Listings",  color: T.gold },
                      { label: "Portfolio Items",value: myPortfolio?.length || 0, icon: SvgIcons.Briefcase({width:14,height:14}),tab: "Portfolio", color: T.green },
                      { label: "Watchlist",      value: watchlist?.length || 0,   icon: SvgIcons.Star({width:14,height:14}),     tab: null,        color: T.textSecondary },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, cursor: item.tab ? "pointer" : "default", marginBottom: 8 }}
                        onClick={() => item.tab && handleTabChange(item.tab)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: item.color }}>{item.icon}</span>
                          <span style={{ fontSize: 12, color: T.textSecondary }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sources footer */}
                <div style={{ paddingBottom: 16, paddingTop: 4, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "RERA", "Bayut API", "ValuStrat", "REIDIN", "Claude AI"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default OverviewTab;
