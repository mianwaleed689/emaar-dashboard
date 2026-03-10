import React from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../../../styles/theme";

/**
 * YieldsTab — Rental yield analysis, detailed table, ROI framework
 */
const YieldsTab = ({
  isPro,
  yields,
  liveYields,
  roiPhases,
  setSelectedKPI,
  setShowUpgrade,
  KPI,
  Chart,
  Section,
  DataBadge,
  TabSources,
  CustomTooltip,
  ProGate,
  ProGateFullPage,
}) => {
  if (!isPro) return <ProGateFullPage tabName="Yields" onUpgrade={() => setShowUpgrade(true)} />;

  const yieldData = liveYields.length > 0 ? liveYields : yields;

  return (
    <>
      <ProGate isPro={isPro} message="Unlock Rental Yield Analysis" onUpgrade={() => setShowUpgrade(true)}>
        <Section title="Rental Yield Analysis" sub="REIDIN Dec 2025 · DXB Interact · Engel & Völkers · DLD Rental Index">
          <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <DataBadge source="REIDIN Dec 2025" date="Dec 2025" type="reidin" />
            <DataBadge source="Dubai Land Department Rental Index" date="2025" type="dld" />
          </div>
          <Chart title="Gross Yield by Community & Unit Type (%)" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 7]} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                      <p style={{ color: T.gold, fontWeight: 700, margin: 0, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{d.community} — {d.label}</p>
                      <p style={{ color: T.white, margin: "4px 0 0", fontSize: 12 }}>Rent: AED {d.rent}K/yr · Price: AED {d.price}K</p>
                      <p style={{ color: T.teal, margin: "2px 0 0", fontSize: 12 }}>Gross: {d.gross}% · Net: {d.net}% · {d.demand}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="gross" name="Gross Yield %" radius={[6, 6, 0, 0]} barSize={30}>
                  {yieldData.map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Chart>
        </Section>

        <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <KPI label="Dubai Avg Gross Yield" value="6.9%" sub="Apartments 7.3% · Villas 5.0%" delay={1} onClick={() => setSelectedKPI({ label: "Dubai Avg Gross Yield", value: "6.9%", color: T.gold, description: "Dubai citywide average gross rental yield in 2025.", source: "REIDIN · DXB Interact · Engel & Völkers 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "City Avg (Gross)", value: "6.9%", note: "All property types" }, { label: "Apartments Avg", value: "7.3%", note: "Highest returns" }, { label: "Villas Avg", value: "5.0%", note: "Lower but appreciation" }, { label: "vs London", value: "2–4%", note: "Dubai 3× higher" }], trend: null })} />
          <KPI label="Best Dubai Yield" value="8–9%" sub="JVC · International City" delay={2} onClick={() => setSelectedKPI({ label: "Best Dubai Yield", value: "8–9%", color: T.green, description: "Jumeirah Village Circle and International City consistently deliver 8–9% gross yields.", source: "REIDIN · DXB Interact · Bayut H1 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Top Area", value: "Int'l City / JVC", note: "8–9% gross" }, { label: "Al Furjan", value: "7.5–8.5%", note: "Strong yield" }, { label: "Emaar communities", value: "5.5–7.5%", note: "Premium segment" }], trend: null })} />
          <KPI label="Palm / Downtown Yield" value="4–5.5%" sub="Capital appreciation play" delay={3} onClick={() => setSelectedKPI({ label: "Palm / Downtown Yield", value: "4–5.5%", color: T.blue, description: "Palm Jumeirah and Downtown Dubai offer 4–5.5% gross yield. Capital appreciation compensates.", source: "REIDIN · DXB Interact · Engel & Völkers Q4 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Palm Jumeirah", value: "4–5.5%", note: "Gross yield" }, { label: "Downtown Dubai", value: "4.5–6%", note: "Gross yield" }, { label: "Palm YoY Appreciation", value: "+14%", note: "2025 capital gain" }], trend: null })} />
          <KPI label="Avg 2BR Annual Rent" value="AED 91K" sub="Dubai citywide avg Q3 2025" delay={4} onClick={() => setSelectedKPI({ label: "Avg 2BR Annual Rent", value: "AED 91K", color: T.teal, description: "Average annual rent for a 2-bedroom apartment in Dubai is AED 91,052 (Q3 2025).", source: "Property Monitor · Engel & Völkers Q3 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "2BR Avg Rent", value: "AED 91,052", note: "Q3 2025 citywide" }, { label: "Rent Growth YoY", value: "+8.5–9%", note: "Apartments 2025" }], trend: null })} />
        </div>

        <Section title="Detailed Yield Data" sub="All Emaar communities · Annual rents · Launch prices · Demand levels">
          <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Community", "Unit Type", "Annual Rent", "Price", "Gross %", "Net %", "Demand", "Golden Visa"].map(h => (
                    <th key={h} style={{ padding: "10px 10px", textAlign: h === "Community" || h === "Unit Type" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yieldData.map((y, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 10px", color: T.white, fontWeight: 500, fontSize: 12 }}>{y.community}</td>
                    <td style={{ padding: "10px 10px", color: T.textSecondary, fontSize: 12 }}>{y.label}</td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontSize: 12 }}>AED {y.rent}K</td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontSize: 12 }}>AED {y.price}K</td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: y.gross >= 5 ? T.green : y.gross >= 4 ? T.gold : T.textSecondary, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>{y.gross}%</td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontFamily: "'Fraunces', serif" }}>{y.net}%</td>
                    <td style={{ padding: "10px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: y.demand === "V.High" ? "rgba(16,185,129,0.15)" : y.demand === "High" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", color: y.demand === "V.High" ? T.green : y.demand === "High" ? T.gold : T.blue }}>{y.demand}</span>
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: T.teal, fontSize: 11 }}>{y.visa || "≥2M"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="ROI Framework" sub="Expected returns for Emaar off-plan investments">
          <Chart title="Return Range by Phase (%)" style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roiPhases}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="phase" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="low" fill={T.teal} name="Low %" radius={[0, 0, 0, 0]} barSize={32} opacity={0.5} />
                <Bar dataKey="high" fill={T.gold} name="High %" radius={[6, 6, 0, 0]} barSize={32} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
        </Section>
      </ProGate>

      <TabSources sources={[
        { label: "REIDIN Dec 2025", url: "https://reidin.com" },
        { label: "DXB Interact", url: "https://dxbinteract.com" },
        { label: "Engel & Völkers Dubai 2025", url: "https://www.engelvoelkers.com/en-ae/dubai/" },
        { label: "DLD Rental Index", url: "https://dubailand.gov.ae" },
        { label: "Bayut Rental Report 2025", url: "https://www.bayut.com" },
      ]} />
    </>
  );
};

export default YieldsTab;
