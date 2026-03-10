import React from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../../../styles/theme";

/**
 * FinancialsTab — 6-year financial data, margins, per-share metrics
 * Props passed down from EmaarDashboardV2 (parent keeps all state)
 */
const FinancialsTab = ({
  isPro,
  financials,
  setSelectedKPI,
  setShowUpgrade,
  KPI,
  Chart,
  Section,
  TabSources,
  CustomTooltip,
  ProGate,
}) => {
  return (
    <>
      <Section title="Financial Performance" sub="6-year trend · 2020–2025 · All figures in AED Billions">
        <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <KPI label="Revenue CAGR" value="27.2%" sub="2020-2025 · 5-year" delay={1} onClick={() => setSelectedKPI({ label: "Revenue CAGR", value: "27.2%", color: T.gold, description: "Compound Annual Growth Rate of revenue from AED 14.6B in 2020 to AED 49.6B in 2025.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "2020 Revenue", value: "AED 14.6B", note: "Base year" }, { label: "2025 Revenue", value: "AED 49.6B", note: "+240% total growth" }, { label: "CAGR", value: "27.2%", note: "5-year compounded" }], trend: [{ y: "2020", v: 14.6 }, { y: "2021", v: 17.0 }, { y: "2022", v: 24.5 }, { y: "2023", v: 30.6 }, { y: "2024", v: 35.4 }, { y: "2025", v: 49.6 }] })} />
          <KPI label="Profit CAGR" value="57.1%" sub="2020-2025 · 5-year" delay={2} onClick={() => setSelectedKPI({ label: "Profit CAGR", value: "57.1%", color: T.green, description: "Net profit grew from AED 2.6B in 2020 to AED 25.7B in 2025.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "2020 Net Profit", value: "AED 2.6B", note: "Base year" }, { label: "2025 Net Profit", value: "AED 25.7B", note: "+888% total growth" }, { label: "CAGR", value: "57.1%", note: "5-year compounded" }], trend: [{ y: "2020", v: 2.6 }, { y: "2021", v: 4.1 }, { y: "2022", v: 6.2 }, { y: "2023", v: 12.6 }, { y: "2024", v: 18.9 }, { y: "2025", v: 25.7 }] })} />
          <KPI label="Gross Margin" value="57.5%" sub="Industry-leading" delay={3} onClick={() => setSelectedKPI({ label: "Gross Margin", value: "57.5%", color: T.teal, description: "Gross profit margin significantly above the global real estate developer average of 25–35%.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Gross Margin", value: "57.5%", note: "FY2025" }, { label: "GCC Dev Avg", value: "~30–35%", note: "Industry benchmark" }], trend: [{ y: "2020", v: 42 }, { y: "2021", v: 45 }, { y: "2022", v: 50 }, { y: "2023", v: 54 }, { y: "2024", v: 56 }, { y: "2025", v: 57.5 }] })} />
          <KPI label="Net Margin" value="35.5%" sub="Consistent expansion" delay={4} onClick={() => setSelectedKPI({ label: "Net Margin", value: "35.5%", color: T.blue, description: "Net profit margin after all costs including tax.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Net Margin FY2025", value: "51.8%", note: "Pre-tax" }, { label: "EBITDA Margin", value: "51.6%", note: "Operational efficiency" }], trend: [{ y: "2020", v: 17.8 }, { y: "2021", v: 24.1 }, { y: "2022", v: 25.3 }, { y: "2023", v: 41.2 }, { y: "2024", v: 53.4 }, { y: "2025", v: 51.8 }] })} />
        </div>
      </Section>

      <ProGate isPro={isPro} message="Unlock 6 Years of Financial Data" onUpgrade={() => setShowUpgrade(true)}>
        <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          <Chart title="Revenue vs Property Sales (AED B)">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={financials}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="propertySales" fill="url(#gSales)" stroke={T.gold} strokeWidth={2} name="Property Sales" />
                <Bar dataKey="revenue" fill={T.teal} name="Revenue" radius={[4, 4, 0, 0]} barSize={24} opacity={0.8} />
              </ComposedChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Profitability Trend (AED B)">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={financials}>
                <defs>
                  <linearGradient id="gNP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.teal} stopOpacity={0.2} /><stop offset="100%" stopColor={T.teal} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gEb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.15} /><stop offset="100%" stopColor={T.blue} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ebitda" stroke={T.blue} fill="url(#gEb)" strokeWidth={2} name="EBITDA" />
                <Area type="monotone" dataKey="netProfit" stroke={T.teal} fill="url(#gNP)" strokeWidth={2} name="Net Profit" />
                <Line type="monotone" dataKey="grossProfit" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} name="Gross Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </Chart>
        </div>

        <Section title="Margin Analysis" sub="Profitability margins over 6 years">
          <Chart title="Margin Trends (%)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={financials}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 70]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="gm" stroke={T.gold} strokeWidth={2.5} dot={{ fill: T.gold, r: 4 }} name="Gross Margin %" />
                <Line type="monotone" dataKey="em" stroke={T.teal} strokeWidth={2.5} dot={{ fill: T.teal, r: 4 }} name="EBITDA Margin %" />
                <Line type="monotone" dataKey="nm" stroke={T.cyan} strokeWidth={2.5} dot={{ fill: T.cyan, r: 4 }} name="Net Margin %" />
              </LineChart>
            </ResponsiveContainer>
          </Chart>
        </Section>

        <Section title="Per-Share Metrics" sub="Dividend and earnings growth">
          <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <KPI label="EPS (2025)" value="AED 2.00" sub="+31% YoY" delay={1} />
            <KPI label="DPS (2025)" value="AED 1.00" sub="100% of share capital" delay={2} />
            <KPI label="EPS CAGR" value="52.8%" sub="5-year · 2020-2025" delay={3} />
            <KPI label="Total Dividend" value="AED 8.8B" sub="Payout to shareholders" delay={4} />
          </div>
          <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <Chart title="EPS & Dividend Per Share (AED)">
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={financials}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="dividend" fill={T.gold} name="Dividend/Share" radius={[4, 4, 0, 0]} barSize={20} opacity={0.7} />
                  <Line type="monotone" dataKey="eps" stroke={T.teal} strokeWidth={2.5} dot={{ fill: T.teal, r: 4 }} name="EPS" />
                </ComposedChart>
              </ResponsiveContainer>
            </Chart>
            <Chart title="International Sales (AED B)">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={financials}>
                  <defs><linearGradient id="gIntl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.25} /><stop offset="100%" stopColor={T.green} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="intlSales" stroke={T.green} fill="url(#gIntl)" strokeWidth={2.5} name="Int'l Sales" />
                </AreaChart>
              </ResponsiveContainer>
            </Chart>
          </div>
        </Section>

        <Section title="Full Financial Summary" sub="All key metrics · 2020–2025 · AED Billions">
          <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Metric", "2020", "2021", "2022", "2023", "2024", "2025"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: h === "Metric" ? "left" : "right", color: h === "2025" ? T.gold : T.textMuted, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { m: "Revenue", k: "revenue" }, { m: "EBITDA", k: "ebitda" }, { m: "Net Profit (Pre-Tax)", k: "netProfit" },
                  { m: "Property Sales", k: "propertySales" }, { m: "Revenue Backlog", k: "backlog" }, { m: "Recurring Revenue", k: "recurringRev" },
                  { m: "Int'l Sales", k: "intlSales" }, { m: "Mall Revenue", k: "mallRev" }, { m: "Hotel Revenue", k: "hotelRev" },
                ].map(({ m, k }) => (
                  <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 12px", color: T.white, fontWeight: 500, fontSize: 12 }}>{m}</td>
                    {financials.map((f, ci) => (
                      <td key={ci} style={{ padding: "10px 12px", textAlign: "right", color: ci === financials.length - 1 ? T.gold : T.textSecondary, fontFamily: "'Fraunces', serif", fontWeight: ci === financials.length - 1 ? 700 : 400, fontSize: 12 }}>
                        {f[k] ? f[k].toFixed(1) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TabSources sources={[
            { label: "Emaar Annual Report 2025", url: "https://www.emaar.com/en/investor-relations/" },
            { label: "Emaar Q4 2025 Earnings Release", url: "https://www.emaar.com/en/investor-relations/" },
            { label: "DFM Filing", url: "https://www.dfm.ae" },
          ]} />
        </Section>
      </ProGate>
    </>
  );
};

export default FinancialsTab;
