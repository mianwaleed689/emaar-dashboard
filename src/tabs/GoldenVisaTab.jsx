/* eslint-disable */
/* DXB ANALYTICS - GOLDEN VISA TAB - Session 22
   UAE 10-year Golden Visa | AED 2M+ property investment
   2026 rules: off-plan qualifies, mortgage qualifies, no upfront % required */

import React, { useState, useMemo } from "react";
import { T } from "../data";

const fmtP = n => n >= 1000000 ? "AED " + (n/1000000).toFixed(1) + "M" : n ? "AED " + Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1) + "%" : "--";

const GV_MIN = 2000000;

const VISA_FACTS = [
  { icon: "🏆", title: "10-Year Renewable", desc: "Longest residency visa available. Renew indefinitely as long as you own the property." },
  { icon: "👨‍👩‍👧‍👦", title: "Sponsor Your Family", desc: "Spouse, children (any age), parents, and up to 3 domestic staff included." },
  { icon: "✈️", title: "No Minimum Stay", desc: "Live anywhere in the world. Your visa stays valid even outside UAE for years." },
  { icon: "🏗️", title: "Off-Plan Qualifies", desc: "Buy from a developer before completion. 2026 rule: no minimum upfront payment required." },
  { icon: "🏦", title: "Mortgage Qualifies", desc: "Mortgaged properties now qualify if total certified value reaches AED 2M." },
  { icon: "🏘️", title: "Portfolio Route", desc: "Combine multiple properties to reach AED 2M total. Each must be in your name." },
];

const STEPS = [
  { num: 1, title: "Buy property AED 2M+", desc: "Single or portfolio. Ready, off-plan, or mortgaged." },
  { num: 2, title: "Get DLD valuation letter", desc: "Dubai Land Department certifies the property value." },
  { num: 3, title: "Submit to GDRFA/ICP", desc: "Apply through Dubai immigration with title deed + valuation." },
  { num: 4, title: "Medical + Emirates ID", desc: "Standard UAE residency medical test and biometrics." },
  { num: 5, title: "Visa issued in 5-10 days", desc: "10-year renewable Golden Visa for you and your family." },
];

function EligibilityChecker({ liveProjects }) {
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState("single");
  const budgetNum = parseFloat((budget || "0").replace(/[^0-9.]/g, "")) * (budget.toLowerCase().includes("m") ? 1000000 : 1);
  const isEligible = budgetNum >= GV_MIN;
  const gap = GV_MIN - budgetNum;
  const matchingProjects = useMemo(() =>
    (liveProjects || []).filter(p => (p.priceMin || 0) >= GV_MIN && (budgetNum === 0 || (p.priceMin || 0) <= budgetNum * 1.2))
      .slice(0, 3)
  , [liveProjects, budgetNum]);

  return (
    <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 4 }}>Golden Visa Eligibility Checker</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Enter your client's budget to check eligibility instantly</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>AED</span>
          <input
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="e.g. 2500000 or 2.5M"
            style={{ width: "100%", padding: "10px 12px 10px 42px", background: "rgba(255,255,255,0.04)", border: "1px solid " + (isEligible && budget ? "rgba(16,185,129,0.5)" : budget && !isEligible ? "rgba(239,68,68,0.5)" : T.border), borderRadius: 8, color: T.white, fontSize: 13, outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
          />
        </div>
        <select value={budgetType} onChange={e => setBudgetType(e.target.value)} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid " + T.border, borderRadius: 8, color: "#CBD5E1", fontSize: 12, outline: "none", fontFamily: "'Outfit',sans-serif" }}>
          <option value="single">Single Property</option>
          <option value="portfolio">Portfolio</option>
        </select>
      </div>

      {budget && (
        <div style={{ padding: "14px 16px", borderRadius: 10, background: isEligible ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)", border: "1px solid " + (isEligible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"), marginBottom: matchingProjects.length > 0 ? 14 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{isEligible ? "✅" : "❌"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isEligible ? "#10B981" : "#EF4444" }}>
                {isEligible ? "Golden Visa Eligible — 10-Year Residency" : "Below Threshold"}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                {isEligible
                  ? `Budget AED ${(budgetNum/1e6).toFixed(2)}M meets the AED 2M minimum. ${budgetType === "portfolio" ? "Applies across combined portfolio." : "Qualifies as single property."}`
                  : `Need AED ${(gap/1e6).toFixed(2)}M more to reach the AED 2M threshold. Consider portfolio route or a higher budget property.`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {budget && isEligible && matchingProjects.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>Matching projects in budget range:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {matchingProjects.map((p, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid " + T.border, borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: T.white, fontWeight: 600, marginBottom: 2 }}>{p.name || p.project}</div>
                <div style={{ color: T.gold }}>{fmtP(p.priceMin)} · {p.masterCommunity || p.community}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, onTabChange }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "rgba(212,168,67,0.04)" : "rgba(255,255,255,0.02)", border: "1px solid " + (hovered ? "rgba(212,168,67,0.3)" : T.border), borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.15s" }}
      onClick={() => onTabChange && onTabChange("Projects")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || p.project}</div>
          <div style={{ fontSize: 10, color: "#94A3B8" }}>{p.masterCommunity || p.community} · {p.developer}</div>
        </div>
        <span style={{ fontSize: 9, padding: "3px 7px", borderRadius: 4, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>GV ✓</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          { label: "From", value: fmtP(p.priceMin), color: T.gold },
          { label: "Yield", value: fmtY(p.grossYield), color: "#10B981" },
          { label: "Payment", value: p.paymentPlan || "--", color: "#CBD5E1" },
        ].map((m, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.value}</div>
          </div>
        ))}
      </div>
      {p.handoverDate && (
        <div style={{ marginTop: 8, fontSize: 10, color: "#64748B" }}>
          Handover: <span style={{ color: "#94A3B8" }}>{p.handoverDate}</span>
          {p.status === "Ready" && <span style={{ marginLeft: 6, color: "#10B981" }}>· Ready Now</span>}
        </div>
      )}
    </div>
  );
}

export default function GoldenVisaTab(props) {
  const safeProps = {
    ...props,
    liveNeighbourhoods: Array.isArray(props.liveNeighbourhoods) ? props.liveNeighbourhoods : [],
    liveProjects: Array.isArray(props.liveProjects) ? props.liveProjects : [],
  };
  return <GoldenVisaTabInner {...safeProps} />;
}

function GoldenVisaTabInner({ liveProjects = [], handleTabChange, globalFilters = {} }) {
  const [search, setSearch] = useState("");
  const [community, setCommunity] = useState("All");
  const [sortBy, setSortBy] = useState("price");
  const [activeSection, setActiveSection] = useState("projects");

  const gvProjects = useMemo(() =>
    (liveProjects || []).filter(p => (p.priceMin || 0) >= GV_MIN)
  , [liveProjects]);

  const communities = useMemo(() => {
    const all = [...new Set(gvProjects.map(p => p.masterCommunity || p.community).filter(Boolean))].sort();
    return ["All", ...all];
  }, [gvProjects]);

  const filtered = useMemo(() => {
    let a = [...gvProjects];
    if (community !== "All") a = a.filter(p => (p.masterCommunity || p.community) === community);
    if (search.trim()) a = a.filter(p => (p.name || p.project || "").toLowerCase().includes(search.toLowerCase()) || (p.masterCommunity || p.community || "").toLowerCase().includes(search.toLowerCase()) || (p.developer || "").toLowerCase().includes(search.toLowerCase()));
    a.sort((x, y) => {
      if (sortBy === "price") return (x.priceMin || 0) - (y.priceMin || 0);
      if (sortBy === "yield") return (parseFloat(y.grossYield || 0)) - (parseFloat(x.grossYield || 0));
      if (sortBy === "name") return (x.name || x.project || "").localeCompare(y.name || y.project || "");
      return 0;
    });
    return a;
  }, [gvProjects, community, search, sortBy]);

  const selStyle = { padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid " + T.border, borderRadius: 8, color: "#CBD5E1", fontSize: 11, outline: "none", fontFamily: "'Outfit',sans-serif" };

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: T.white, fontFamily: "'Fraunces',serif" }}>
          🏅 UAE Golden Visa
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8" }}>
          10-year UAE residency through property investment · AED 2M minimum · {gvProjects.length} eligible projects
        </p>
      </div>

      {/* Key Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Min Investment", value: "AED 2M", color: T.gold },
          { label: "Visa Duration", value: "10 Years", color: "#10B981" },
          { label: "Eligible Projects", value: String(gvProjects.length), color: "#63B3ED" },
          { label: "Family Included", value: "Spouse + Kids", color: "#8B5CF6" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid " + T.border, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 2026 Update Banner */}
      <div style={{ padding: "10px 16px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>📢</span>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>
          <span style={{ color: "#10B981", fontWeight: 700 }}>2026 Update: </span>
          No minimum upfront payment required. Off-plan and mortgaged properties now qualify. Portfolio of multiple properties counts toward AED 2M threshold.
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
        {[
          { key: "projects", label: "🏢 Eligible Projects" },
          { key: "checker", label: "✅ Eligibility Checker" },
          { key: "guide", label: "📋 Visa Guide" },
          { key: "steps", label: "🚀 How to Apply" },
        ].map(s => (
          <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", background: activeSection === s.key ? "rgba(212,168,67,0.15)" : "transparent", color: activeSection === s.key ? T.gold : "#94A3B8", fontSize: 11, fontWeight: activeSection === s.key ? 700 : 400, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}
          >{s.label}</button>
        ))}
      </div>

      {/* PROJECTS SECTION */}
      {activeSection === "projects" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 220px", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid " + (search ? T.gold : T.border), borderRadius: 8 }}>
              <span style={{ fontSize: 12 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project, community, developer..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
              {search && <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14 }}>×</button>}
            </div>
            <select value={community} onChange={e => setCommunity(e.target.value)} style={{ ...selStyle, maxWidth: 200 }}>
              {communities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selStyle}>
              <option value="price">Price: Low to High</option>
              <option value="yield">Highest Yield</option>
              <option value="name">A - Z</option>
            </select>
            <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{filtered.length} projects</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              No projects found. Try adjusting your filters.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {filtered.slice(0, 60).map((p, i) => (
                <ProjectCard key={p.id || i} p={p} onTabChange={handleTabChange} />
              ))}
            </div>
          )}

          {filtered.length > 60 && (
            <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#94A3B8" }}>
              Showing 60 of {filtered.length} projects. Use filters to narrow results.
            </div>
          )}
        </div>
      )}

      {/* CHECKER SECTION */}
      {activeSection === "checker" && (
        <EligibilityChecker liveProjects={liveProjects} />
      )}

      {/* GUIDE SECTION */}
      {activeSection === "guide" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, marginBottom: 20 }}>
            {VISA_FACTS.map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + T.border, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid " + T.border, borderRadius: 10, fontSize: 11, color: "#64748B", lineHeight: 1.7 }}>
            ⚠️ <strong style={{ color: "#94A3B8" }}>Disclaimer:</strong> Golden Visa eligibility is subject to GDRFA/ICP approval. Property value must be DLD-certified at AED 2M+. Mortgaged properties require bank NOC. Individual unit price — not community average — determines eligibility. This information is based on publicly available UAE government guidance as of 2026 and may change. Consult a licensed UAE immigration advisor for your specific case.
          </div>
        </div>
      )}

      {/* STEPS SECTION */}
      {activeSection === "steps" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,168,67,0.15)", border: "2px solid " + T.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.gold }}>{s.num}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", marginLeft: 17, marginTop: 36, width: 2, height: 16, background: "rgba(212,168,67,0.2)" }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Useful Links</div>
            {[
              { label: "Dubai Land Department — Property Valuation", url: "https://dubailand.gov.ae" },
              { label: "GDRFA Dubai — Golden Visa Application", url: "https://gdrfad.gov.ae" },
              { label: "ICP — Federal Golden Visa Portal", url: "https://icp.gov.ae" },
            ].map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 11, color: "#63B3ED", marginBottom: 4, textDecoration: "none" }}>
                🔗 {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
