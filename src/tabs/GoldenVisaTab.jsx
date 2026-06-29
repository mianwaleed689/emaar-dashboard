/* eslint-disable */
/* DXB ANALYTICS - GOLDEN VISA TAB - Session 22 v2
   v2: slide-in detail panel, WhatsApp share, investment case, GV checklist */

import React, { useState, useMemo, useEffect } from "react";
import { T } from "../data";

const fmtP = n => n >= 1000000 ? "AED " + (n/1000000).toFixed(2) + "M" : n ? "AED " + Math.round(n).toLocaleString() : "--";
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

function ProjectDetailPanel({ project, onClose, onViewInProjects }) {
  const p = project;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const monthlyMortgage = useMemo(() => {
    if (!p.priceMin) return null;
    const principal = p.priceMin * 0.75;
    const rate = 0.045 / 12;
    const n = 300;
    return Math.round(principal * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1));
  }, [p.priceMin]);

  const annualRent = useMemo(() => {
    if (!p.priceMin || !p.grossYield) return null;
    return Math.round(p.priceMin * parseFloat(p.grossYield) / 100);
  }, [p]);

  const waMsg = encodeURIComponent(
    "Hi, I have a client interested in " + (p.name || p.project) + " in " + (p.masterCommunity || p.community) + ".\n\n" +
    "Price from: " + fmtP(p.priceMin) + "\n" +
    "Yield: " + fmtY(p.grossYield) + "\n" +
    "Payment: " + (p.paymentPlan || "TBC") + "\n" +
    "Handover: " + (p.handoverDate || "TBC") + "\n\n" +
    "Golden Visa eligible checkmark\n\nWould you like more details?"
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, opacity: visible ? 1 : 0, transition: "opacity 0.25s" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#0F1729", borderLeft: "1px solid rgba(212,168,67,0.2)", zIndex: 1000, overflowY: "auto", transform: visible ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", boxShadow: "-8px 0 32px rgba(0,0,0,0.4)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(212,168,67,0.04)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(212,168,67,0.15)", color: "#D4A843", fontWeight: 700 }}>GV ELIGIBLE</span>
              {p.status && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 600 }}>{p.status}</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", fontFamily: "'Fraunces',serif", lineHeight: 1.3, marginBottom: 3 }}>{p.name || p.project}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.developer} · {p.masterCommunity || p.community}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94A3B8", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>x</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>STARTING FROM</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#D4A843", fontFamily: "'Fraunces',serif" }}>{fmtP(p.priceMin)}</div>
            {p.priceMax && p.priceMax !== p.priceMin && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>up to {fmtP(p.priceMax)}</div>}
            <div style={{ fontSize: 11, color: "#10B981", marginTop: 6 }}>Qualifies for 10-Year Golden Visa</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Gross Yield", value: fmtY(p.grossYield), color: "#10B981" },
              { label: "Net Yield", value: fmtY(p.netYield), color: "#84CC16" },
              { label: "Avg PPSF", value: p.ppsf ? "AED " + Math.round(p.ppsf).toLocaleString() : "--", color: "#D4A843" },
              { label: "Payment Plan", value: p.paymentPlan || "--", color: "#CBD5E1" },
              { label: "Handover", value: p.handoverDate || p.completionDate || "--", color: "#94A3B8" },
              { label: "Build Progress", value: p.constructionPct != null ? p.constructionPct + "%" : "--", color: "#63B3ED" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", marginBottom: 10 }}>Investment Case</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {annualRent && (<div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2 }}>Est. Annual Rent</div><div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>AED {annualRent.toLocaleString()}</div></div>)}
              {monthlyMortgage && (<div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2 }}>Monthly Mortgage*</div><div style={{ fontSize: 13, fontWeight: 700, color: "#63B3ED" }}>AED {monthlyMortgage.toLocaleString()}</div></div>)}
              {p.serviceCharge && (<div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2 }}>Service Charge</div><div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>AED {p.serviceCharge}/sqft/yr</div></div>)}
              {p.investmentScore && (<div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 2 }}>Inv Score</div><div style={{ fontSize: 13, fontWeight: 700, color: p.investmentScore >= 80 ? "#10B981" : "#D4A843" }}>{p.investmentScore}/100</div></div>)}
            </div>
            {monthlyMortgage && <div style={{ fontSize: 9, color: "#64748B", marginTop: 8 }}>*75% LTV, 4.5% rate, 25yr. Not financial advice.</div>}
          </div>
          <div style={{ background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#D4A843", marginBottom: 10 }}>Golden Visa Checklist</div>
            {[
              { label: "Property value AED 2M+", pass: (p.priceMin || 0) >= GV_MIN },
              { label: "Freehold ownership", pass: p.freehold !== false },
              { label: "Off-plan accepted (2026)", pass: true },
              { label: "Mortgage accepted (2026)", pass: p.mortgageAvailable !== false },
              { label: "DLD registered", pass: p.dldRegistered !== false },
              { label: "Foreign ownership allowed", pass: p.foreignOwnership !== false },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: c.pass ? "#10B981" : "#EF4444" }}>{c.pass ? "+" : "-"}</span>
                <span style={{ fontSize: 11, color: c.pass ? "#CBD5E1" : "#94A3B8" }}>{c.label}</span>
              </div>
            ))}
          </div>
          {p.beds && p.beds.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>Available Configurations</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.beds.map((b, i) => <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.2)", color: "#63B3ED" }}>{b}</span>)}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <a href={"https://wa.me/?text=" + waMsg} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit',sans-serif" }}>
              Share with Client via WhatsApp
            </a>
            <button type="button" onClick={() => { onViewInProjects && onViewInProjects(); onClose(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.3)", color: "#D4A843", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              View Full Details in Projects Tab
            </button>
            <button type="button" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function EligibilityChecker({ liveProjects }) {
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState("single");
  const budgetNum = parseFloat((budget || "0").replace(/[^0-9.]/g, "")) * (budget.toLowerCase().includes("m") ? 1000000 : 1);
  const isEligible = budgetNum >= GV_MIN;
  const gap = GV_MIN - budgetNum;
  const matchingProjects = useMemo(() =>
    (liveProjects || []).filter(p => (p.priceMin || 0) >= GV_MIN && (budgetNum === 0 || (p.priceMin || 0) <= budgetNum * 1.2)).slice(0, 3)
  , [liveProjects, budgetNum]);

  return (
    <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#D4A843", marginBottom: 4 }}>Golden Visa Eligibility Checker</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Enter your client's budget to check eligibility instantly</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>AED</span>
          <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 2500000 or 2.5M" style={{ width: "100%", padding: "10px 12px 10px 42px", background: "rgba(255,255,255,0.04)", border: "1px solid " + (isEligible && budget ? "rgba(16,185,129,0.5)" : budget && !isEligible ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"), borderRadius: 8, color: "#FFFFFF", fontSize: 13, outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
        </div>
        <select value={budgetType} onChange={e => setBudgetType(e.target.value)} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#CBD5E1", fontSize: 12, outline: "none", fontFamily: "'Outfit',sans-serif" }}>
          <option value="single">Single Property</option>
          <option value="portfolio">Portfolio</option>
        </select>
      </div>
      {budget && (
        <div style={{ padding: "14px 16px", borderRadius: 10, background: isEligible ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)", border: "1px solid " + (isEligible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"), marginBottom: matchingProjects.length > 0 ? 14 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isEligible ? "#10B981" : "#EF4444" }}>{isEligible ? "Golden Visa Eligible - 10-Year Residency" : "Below Threshold"}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{isEligible ? "Budget AED " + (budgetNum/1e6).toFixed(2) + "M meets the AED 2M minimum." : "Need AED " + (gap/1e6).toFixed(2) + "M more to qualify. Consider portfolio route."}</div>
            </div>
          </div>
        </div>
      )}
      {budget && isEligible && matchingProjects.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>Matching projects in budget range:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {matchingProjects.map((p, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: 2 }}>{p.name || p.project}</div>
                <div style={{ color: "#D4A843" }}>{fmtP(p.priceMin)} - {p.masterCommunity || p.community}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => onSelect(p)} style={{ background: hovered ? "rgba(212,168,67,0.04)" : "rgba(255,255,255,0.02)", border: "1px solid " + (hovered ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"), borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || p.project}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.masterCommunity || p.community} - {p.developer}</div>
        </div>
        <span style={{ fontSize: 9, padding: "3px 7px", borderRadius: 4, background: "rgba(212,168,67,0.15)", color: "#D4A843", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>GV</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[
          { label: "From", value: fmtP(p.priceMin), color: "#D4A843" },
          { label: "Yield", value: fmtY(p.grossYield), color: "#10B981" },
          { label: "Payment", value: p.paymentPlan || "--", color: "#CBD5E1" },
        ].map((m, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#64748B" }}>{p.handoverDate ? "Handover: " + p.handoverDate : p.status || ""}</div>
        <div style={{ fontSize: 10, color: "#D4A843", opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>View details</div>
      </div>
    </div>
  );
}

export default function GoldenVisaTab(props) {
  return <GoldenVisaTabInner
    {...props}
    liveNeighbourhoods={Array.isArray(props.liveNeighbourhoods) ? props.liveNeighbourhoods : []}
    liveProjects={Array.isArray(props.liveProjects) ? props.liveProjects : []}
  />;
}

function GoldenVisaTabInner({ liveProjects = [], handleTabChange }) {
  const [search, setSearch] = useState("");
  const [community, setCommunity] = useState("All");
  const [sortBy, setSortBy] = useState("price");
  const [activeSection, setActiveSection] = useState("projects");
  const [selectedProject, setSelectedProject] = useState(null);

  const gvProjects = useMemo(() => (liveProjects || []).filter(p => (p.priceMin || 0) >= GV_MIN), [liveProjects]);

  const communities = useMemo(() => {
    const all = [...new Set(gvProjects.map(p => p.masterCommunity || p.community).filter(Boolean))].sort();
    return ["All", ...all];
  }, [gvProjects]);

  const filtered = useMemo(() => {
    let a = [...gvProjects];
    if (community !== "All") a = a.filter(p => (p.masterCommunity || p.community) === community);
    if (search.trim()) {
      const s = search.toLowerCase();
      a = a.filter(p => (p.name || p.project || "").toLowerCase().includes(s) || (p.masterCommunity || p.community || "").toLowerCase().includes(s) || (p.developer || "").toLowerCase().includes(s));
    }
    if (sortBy === "price") a.sort((x, y) => (x.priceMin || 0) - (y.priceMin || 0));
    else if (sortBy === "yield") a.sort((x, y) => parseFloat(y.grossYield || 0) - parseFloat(x.grossYield || 0));
    else if (sortBy === "name") a.sort((x, y) => (x.name || x.project || "").localeCompare(y.name || y.project || ""));
    return a;
  }, [gvProjects, community, search, sortBy]);

  const sel = { padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#CBD5E1", fontSize: 11, outline: "none", fontFamily: "'Outfit',sans-serif" };

  return (
    <div style={{ paddingBottom: 60 }}>
      {selectedProject && <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} onViewInProjects={() => handleTabChange && handleTabChange("Projects")} />}

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Fraunces',serif" }}>UAE Golden Visa</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8" }}>
          10-year UAE residency through property investment - AED 2M minimum - {liveProjects.length === 0 ? "Loading..." : gvProjects.length + " eligible projects"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Min Investment", value: "AED 2M", color: "#D4A843" },
          { label: "Visa Duration", value: "10 Years", color: "#10B981" },
          { label: "Eligible Projects", value: liveProjects.length === 0 ? "..." : String(gvProjects.length), color: "#63B3ED" },
          { label: "Family Included", value: "Spouse + Kids", color: "#8B5CF6" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 16px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>
          <span style={{ color: "#10B981", fontWeight: 700 }}>2026 Update: </span>
          No minimum upfront payment required. Off-plan and mortgaged properties now qualify. Portfolio of multiple properties counts toward AED 2M threshold.
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
        {[
          { key: "projects", label: "Eligible Projects" },
          { key: "checker", label: "Eligibility Checker" },
          { key: "guide", label: "Visa Guide" },
          { key: "steps", label: "How to Apply" },
        ].map(s => (
          <button key={s.key} type="button" onClick={() => setActiveSection(s.key)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", background: activeSection === s.key ? "rgba(212,168,67,0.15)" : "transparent", color: activeSection === s.key ? "#D4A843" : "#94A3B8", fontSize: 11, fontWeight: activeSection === s.key ? 700 : 400, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}>{s.label}</button>
        ))}
      </div>

      {activeSection === "projects" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 220px", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project, community, developer..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#FFFFFF", fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
              {search && <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16 }}>x</button>}
            </div>
            <select value={community} onChange={e => setCommunity(e.target.value)} style={{ ...sel, maxWidth: 200 }}>{communities.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={sel}>
              <option value="price">Price: Low to High</option>
              <option value="yield">Highest Yield</option>
              <option value="name">A - Z</option>
            </select>
            <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{liveProjects.length === 0 ? "Loading..." : filtered.length + " projects"}</span>
          </div>
          {liveProjects.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              Loading projects... Click Refresh if this persists.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No projects found. Try adjusting filters.</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Click any project to view investment details and share with client via WhatsApp</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                {filtered.slice(0, 60).map((p, i) => <ProjectCard key={p.id || i} p={p} onSelect={setSelectedProject} />)}
              </div>
              {filtered.length > 60 && <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#94A3B8" }}>Showing 60 of {filtered.length}. Use filters to narrow results.</div>}
            </>
          )}
        </div>
      )}

      {activeSection === "checker" && <EligibilityChecker liveProjects={liveProjects} />}

      {activeSection === "guide" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, marginBottom: 20 }}>
            {VISA_FACTS.map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11, color: "#64748B", lineHeight: 1.7 }}>
            Disclaimer: Golden Visa eligibility is subject to GDRFA/ICP approval. Property value must be DLD-certified at AED 2M+. Individual unit price determines eligibility. Based on UAE government guidance as of 2026. Consult a licensed UAE immigration advisor.
          </div>
        </div>
      )}

      {activeSection === "steps" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,168,67,0.15)", border: "2px solid #D4A843", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#D4A843" }}>{s.num}</span>
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#D4A843", marginBottom: 8 }}>Official Links</div>
            {[
              { label: "Dubai Land Department - Property Valuation", url: "https://dubailand.gov.ae" },
              { label: "GDRFA Dubai - Golden Visa Application", url: "https://gdrfad.gov.ae" },
              { label: "ICP - Federal Golden Visa Portal", url: "https://icp.gov.ae" },
            ].map((l, i) => <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 11, color: "#63B3ED", marginBottom: 6, textDecoration: "none" }}>{l.label}</a>)}
          </div>
        </div>
      )}
    </div>
  );
}
