import React from "react";
import { T } from "../../../styles/theme";

/**
 * ProjectsTab — Project cards, search/filter, communities, mega projects
 * Props passed down from EmaarDashboardV2 (parent keeps all state)
 */
const ProjectsTab = ({
  isPro,
  activeProjects,
  projectSearch, setProjectSearch,
  projectFilter, setProjectFilter,
  projectTier, setProjectTier,
  projectHandover, setProjectHandover,
  projectPriceMax, setProjectPriceMax,
  projectsLoading,
  compareList,
  watchlist,
  myAlerts,
  expandedMega, setExpandedMega,
  setSelectedProject,
  setSelectedCommunity,
  setShowUpgrade,
  setShowSetAlert,
  setAlertForm,
  emaarCommunities,
  megaProjects,
  toggleWatchlist,
  toggleCompare,
  getInvestmentScore,
  getHandoverCountdown,
  getUnitEntries,
  getLinkLabel,
  Icons,
  KPI,
  Section,
  TabSources,
  LoadingSkeleton,
  setSelectedKPI,
}) => {
  return (
    <>
      <Section title={`${activeProjects.length} Active Projects`} sub="Complete Emaar off-plan portfolio · 2026–2030 · Search & filter">
        <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <KPI label="Total Projects" value={activeProjects.length} sub="18 under construction · 30 off-plan" delay={1} onClick={() => setSelectedKPI({ label: "Total Projects", value: "48", color: T.gold, description: "48 active Emaar projects across UAE.", source: "DXB Analytics", sourceUrl: "#", items: [{ label: "Under Construction", value: "18", note: "Active building" }, { label: "Off-Plan", value: "30", note: "Pre-launch" }, { label: "Communities", value: "11", note: "Master-planned" }, { label: "Branded", value: "10", note: "Address, Vida, Palace" }], trend: null })} />
          <KPI label="Communities" value="11" sub="DHE · DCH · EBF · GPC + 7 more" delay={2} />
          <KPI label="Branded" value={`${activeProjects.filter(p => p.branded).length}`} sub="Address · Vida · Palace · Bristol" delay={3} />
          <KPI label="Avg Construction" value={`${Math.round(activeProjects.reduce((a, p) => a + (p.construction || 0), 0) / activeProjects.length)}%`} sub="Weighted average progress" delay={4} />
        </div>
      </Section>

      {/* Search & Filters */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 250px", maxWidth: 350 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{Icons.search}</span>
            <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder="Search projects or community..." style={{ width: "100%", padding: "10px 12px 10px 36px", background: T.surface, border: "1px solid " + T.border, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "Outfit, sans-serif", outline: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 200px", background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: "8px 14px" }}>
            <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>Max Price</span>
            <input type="range" min={1} max={20} step={0.5} value={projectPriceMax} onChange={e => setProjectPriceMax(Number(e.target.value))} style={{ flex: 1, accentColor: T.gold, cursor: "pointer" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, whiteSpace: "nowrap", minWidth: 60 }}>{projectPriceMax >= 20 ? "Any" : "AED " + projectPriceMax + "M"}</span>
          </div>
          {(projectSearch || projectFilter !== "All" || projectTier !== "All" || projectHandover !== "All" || projectPriceMax < 20) && (
            <button type="button" onClick={() => { setProjectSearch(""); setProjectFilter("All"); setProjectTier("All"); setProjectHandover("All"); setProjectPriceMax(20); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: T.red, fontSize: 12, cursor: "pointer" }}>Clear Filters</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Area</span>
          {["All", "DHE", "DCH", "EBF", "GPC", "ES", "TV", "RYM", "TO", "BB", "TH", "Branded"].map(f => (
            <button type="button" key={f} onClick={() => setProjectFilter(f)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (projectFilter === f ? T.gold : T.border), background: projectFilter === f ? T.goldGlow : "transparent", color: projectFilter === f ? T.gold : T.textSecondary, fontSize: 11, fontWeight: projectFilter === f ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Tier</span>
          {["All", "Affordable", "Mid-Market", "Mid-Premium", "Premium", "Luxury", "Ultra-Luxury", "Luxury Branded", "Ultra-Lux Branded"].map(t => (
            <button type="button" key={t} onClick={() => setProjectTier(t)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (projectTier === t ? T.teal : T.border), background: projectTier === t ? "rgba(0,191,165,0.1)" : "transparent", color: projectTier === t ? T.teal : T.textSecondary, fontSize: 11, fontWeight: projectTier === t ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Handover</span>
          {["All", "2026", "2027", "2028", "2029", "2030+"].map(y => (
            <button type="button" key={y} onClick={() => setProjectHandover(y)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (projectHandover === y ? T.purple : T.border), background: projectHandover === y ? "rgba(139,92,246,0.1)" : "transparent", color: projectHandover === y ? T.purple : T.textSecondary, fontSize: 11, fontWeight: projectHandover === y ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{y}</button>
          ))}
        </div>
      </div>

      {/* Project Cards */}
      {projectsLoading ? <LoadingSkeleton rows={6} cols={3} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
          {activeProjects
            .filter(p => {
              const matchSearch = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase());
              const matchFilter = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);
              const matchTier = projectTier === "All" || p.tier === projectTier;
              const matchHandover = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover));
              const matchPrice = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6;
              return matchSearch && matchFilter && matchTier && matchHandover && matchPrice;
            })
            .map((p, i) => {
              const isLocked = !isPro && i >= 5;
              return (
                <div key={p.id} className="chart-box fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s`, padding: 0, overflow: "hidden", cursor: isLocked ? "default" : "pointer", outline: compareList.find(x => x.id === p.id) ? `2px solid ${T.gold}` : "none", outlineOffset: "-1px", position: "relative", boxShadow: compareList.find(x => x.id === p.id) ? `0 0 20px rgba(212,168,67,0.2)` : "none" }} onClick={() => !isLocked && setSelectedProject(p)}>
                  {isLocked && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(4,9,15,0.7)", backdropFilter: "blur(4px)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                      <span style={{ fontSize: 24, marginBottom: 6 }}>🔒</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>Pro Feature</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }} style={{ marginTop: 8, padding: "6px 16px", background: T.gold, color: T.bg, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Unlock</button>
                    </div>
                  )}
                  {compareList.find(x => x.id === p.id) && (
                    <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 6, background: T.gold, color: T.bg, fontSize: 9, fontWeight: 800, zIndex: 5, letterSpacing: 0.5 }}>COMPARING</div>
                  )}
                  {p.imageUrl && (
                    <div style={{ width: "100%", height: 140, overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
                      <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.gold, marginBottom: 2 }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: T.textSecondary }}>{p.community}</span>
                          {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, fontWeight: 600, letterSpacing: 0.3, flexShrink: 0 }} title="Official listing on Emaar.com">{getLinkLabel(p.emaarUrl)}</a>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {(() => {
                          const inv = p.ratingOverride != null && p.ratingOverride !== "" ? { score: parseFloat(p.ratingOverride), color: parseFloat(p.ratingOverride) >= 8 ? "#10B981" : parseFloat(p.ratingOverride) >= 6 ? "#D4A843" : parseFloat(p.ratingOverride) >= 4 ? "#F59E0B" : "#EF4444", label: parseFloat(p.ratingOverride) >= 8 ? "Excellent" : parseFloat(p.ratingOverride) >= 6 ? "Strong" : parseFloat(p.ratingOverride) >= 4 ? "Good" : "Weak", breakdown: [] } : getInvestmentScore(p);
                          return (
                            <div title={`Investment Score: ${inv.score}/10`} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 8, background: `${inv.color}18`, border: `1px solid ${inv.color}40`, cursor: "default" }}>
                              <span style={{ fontSize: 11, fontWeight: 900, color: inv.color, fontFamily: "'Fraunces', serif" }}>{inv.score}</span>
                              <span style={{ fontSize: 9, color: inv.color, fontWeight: 700, letterSpacing: 0.3 }}>/10</span>
                              <span style={{ fontSize: 9, color: inv.color, fontWeight: 600 }}>★ {inv.label}</span>
                            </div>
                          );
                        })()}
                        <div style={{ display: "flex", gap: 4 }}>
                          {p.branded && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 600 }}>{p.brand}</span>}
                          <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: p.status === "Completed" ? "rgba(16,185,129,0.2)" : p.status === "Under Construction" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: p.status === "Completed" ? T.green : p.status === "Under Construction" ? T.green : T.blue, fontWeight: 600 }}>{p.status === "Completed" ? "✓ Done" : p.status === "Under Construction" ? "Building" : "Off-Plan"}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: T.textMuted }}>Construction</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: p.construction >= 100 ? T.green : p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue }}>{p.construction}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.construction}%`, borderRadius: 2, background: p.construction >= 100 ? T.green : p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>FROM</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.price ? `AED ${(p.price / 1000000).toFixed(1)}M` : "TBD"}</span></div>
                      <div>
                        <span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>HANDOVER</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.handover}</span>
                        {(() => { const cd = getHandoverCountdown(p.handover); return cd ? (<span style={{ display: "inline-block", marginTop: 2, fontSize: 9, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, background: cd.passed ? "rgba(16,185,129,0.1)" : cd.urgent ? "rgba(239,68,68,0.12)" : "rgba(212,168,67,0.08)", padding: "1px 5px", borderRadius: 4 }}>{cd.passed ? "✓ Ready" : "⏱ " + cd.label}</span>) : null; })()}
                      </div>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>PRICE/SQFT</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.ppsf ? `AED ${p.ppsf.toLocaleString()}` : "TBD"}</span></div>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>SIZE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.sizeFrom?.toLocaleString()} - {p.sizeTo?.toLocaleString()} sqft</span></div>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TYPE</span><span style={{ fontSize: 12, color: T.textSecondary }}>{p.type} · {p.beds} BR</span></div>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>PAYMENT</span><span style={{ fontSize: 12, color: T.textSecondary }}>{p.payment}</span></div>
                    </div>
                    {p.units && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>UNIT AVAILABILITY</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {getUnitEntries(p.units).map(([type, d]) => {
                          const avail = d.total - d.sold;
                          return (
                            <div key={type} style={{ padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, fontSize: 10, display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ fontWeight: 700, color: T.white, textTransform: "uppercase" }}>{type}</span>
                              <span style={{ color: avail > 0 ? T.green : T.red }}>{avail > 0 ? `${avail} left` : "Sold out"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>}
                    <div style={{ marginTop: 8, padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, display: "inline-block" }}>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{p.tier}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                      <a href={`/project/${p.id}`} style={{ flex: 1, padding: "8px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.08))", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        Full Details
                      </a>
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleWatchlist(p); }} style={{ padding: "8px 10px", background: watchlist.find(w => w.id === p.id) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${watchlist.find(w => w.id === p.id) ? T.gold : T.border}`, borderRadius: 8, color: watchlist.find(w => w.id === p.id) ? T.gold : T.textMuted, fontSize: 14, cursor: "pointer" }} title={watchlist.find(w => w.id === p.id) ? "Remove from watchlist" : "Add to watchlist"}>
                        {watchlist.find(w => w.id === p.id) ? "★" : "☆"}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); isPro ? toggleCompare(p) : setShowUpgrade(true); }} style={{ padding: "8px 10px", background: !isPro ? "rgba(212,168,67,0.05)" : compareList.find(x => x.id === p.id) ? T.goldGlow : T.surfaceAlt, border: `1px solid ${!isPro ? T.border : compareList.find(x => x.id === p.id) ? T.gold : T.border}`, borderRadius: 8, color: !isPro ? T.textMuted : compareList.find(x => x.id === p.id) ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                        {!isPro ? "🔒" : compareList.find(x => x.id === p.id) ? "✓" : "⊕"}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); if (!isPro) { setShowUpgrade(true); return; } setShowSetAlert(p); setAlertForm({ type: "price_below", value: p.price ? p.price.toString() : "" }); }} style={{ padding: "8px 10px", background: myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${myAlerts.find(a => a.projectId === p.id && !a.triggered) ? T.gold : T.border}`, borderRadius: 8, color: myAlerts.find(a => a.projectId === p.id && !a.triggered) ? T.gold : T.textMuted, fontSize: 13, cursor: "pointer" }}>
                        {myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "🔔" : "🔕"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          {activeProjects.filter(p => {
            const ms = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase());
            const mf = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);
            const mt = projectTier === "All" || p.tier === projectTier;
            const my = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover));
            const mp = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6;
            return ms && mf && mt && my && mp;
          }).length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 4 }}>No projects found</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Try adjusting your search or filter</div>
            </div>
          )}
        </div>
      )}

      {/* Community Summary */}
      <Section title="Communities Overview" sub="11 master-planned communities">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
          {emaarCommunities.filter(c => c.name).map((c, i) => (
            <div key={c.district} className="chart-box fade-up" style={{ animationDelay: `${i * 0.05}s`, padding: 14, cursor: "pointer", transition: "border 0.2s" }} onClick={() => setSelectedCommunity(c.name)} title="Click for full community details">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{c.district}</span>
                  <span style={{ fontSize: 11, color: T.textSecondary, marginLeft: 8 }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.teal }}>{c.projects} projects</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
                <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>AVG PPSF</span><span style={{ color: T.white, fontWeight: 600 }}>{c.avgPpsf ? `AED ${c.avgPpsf.toLocaleString()}` : "—"}</span></div>
                <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>YIELD</span><span style={{ color: T.white, fontWeight: 600 }}>{c.avgYield ? `${c.avgYield}%` : "—"}</span></div>
                <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>ACRES</span><span style={{ color: T.white, fontWeight: 600 }}>{c.acres ? c.acres.toLocaleString() : "—"}</span></div>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{c.buyer} · {c.strengths}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Mega Projects */}
      <Section title="Mega Projects Pipeline" sub="Strategic developments 2026-2035 · AED 800B+ combined value · Click any project for deep analysis">
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 16 }}>
          {megaProjects.map((m, i) => {
            const isOpen = expandedMega === m.name;
            const mStatus = m.status || "Planned";
            return (
              <div key={m.name} className="chart-box fade-up" style={{ animationDelay: `${i * 0.05}s`, padding: 0, overflow: "hidden", cursor: "pointer", border: isOpen ? `1px solid ${T.gold}` : undefined }} onClick={() => setExpandedMega(isOpen ? null : m.name)}>
                <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.gold }}>{m.name}</div>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: mStatus === "Under Construction" ? "rgba(16,185,129,0.12)" : mStatus.includes("Active") || mStatus.includes("Partial") ? "rgba(234,179,8,0.12)" : "rgba(99,102,241,0.12)", color: mStatus === "Under Construction" ? T.green : mStatus.includes("Active") || mStatus.includes("Partial") ? T.gold : T.blue, fontWeight: 600 }}>{mStatus}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 3 }}>{m.community} · {m.type} · {m.developer || "Emaar"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>VALUE</span><span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{m.value}</span></div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TIMELINE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.teal }}>{m.timeline}</span></div>
                    <span style={{ fontSize: 14, color: T.textMuted, transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
                    <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, margin: "14px 0" }}>{m.desc || m.feature || "Details coming soon."}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                      <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, letterSpacing: 0.5 }}>KEY FACTS</div>
                        {m.keyFacts && m.keyFacts.map((f, fi) => (
                          <div key={fi} style={{ fontSize: 11, color: T.textSecondary, padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <span style={{ color: T.gold, fontSize: 8, marginTop: 4, flexShrink: 0 }}>•</span><span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6, letterSpacing: 0.5 }}>INVESTOR IMPACT</div>
                          <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.investorImpact || "Impact analysis coming soon."}</div>
                        </div>
                        {m.benchmark && (
                          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6, letterSpacing: 0.5 }}>GLOBAL BENCHMARK</div>
                            <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.benchmark}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", padding: "10px 0 0", borderTop: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 10, color: T.textMuted }}>Developer: <span style={{ color: T.white, fontWeight: 600 }}>{m.developer || "Emaar"}</span></div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>Timeline: <span style={{ color: T.white, fontWeight: 600 }}>{m.timeline}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <TabSources sources={[
          { label: "Emaar.com Projects", url: "https://www.emaar.com/en/residential/" },
          { label: "DLD Project Registry", url: "https://dubailand.gov.ae" },
          { label: "Emaar IR", url: "https://www.emaar.com/en/investor-relations/" },
        ]} />
      </Section>
    </>
  );
};

export default ProjectsTab;
