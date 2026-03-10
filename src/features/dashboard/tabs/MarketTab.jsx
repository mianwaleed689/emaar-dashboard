import React from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../../../styles/theme";

/**
 * MarketTab — Dubai real estate market data, 2026 outlook, indicators
 */
const MarketTab = ({
  dubaiMarket,
  dubaiSalesHistory,
  liveMarketData,
  setSelectedKPI,
  KPI,
  Chart,
  Section,
  DataBadge,
  TabSources,
  CustomTooltip,
  ForecastCard,
}) => {
  return (
    <>
      <Section title="Dubai Real Estate — 2025" sub="Official DLD Data · 5th Consecutive Record Year">
        <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DataBadge source="Dubai Land Department FY2025" date="Dec 2025" type="dld" />
          <DataBadge source="REIDIN Price Index Dec 2025" date="Dec 2025" type="reidin" />
          <DataBadge source="ValuStrat Q4 2025" date="Q4 2025" type="manual" />
        </div>
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
          {(liveMarketData.length > 0 ? liveMarketData.map(d => ({ metric: d.metric, val2025: d.value, yoy: d.change, val2024: "" })) : dubaiMarket).map((m, i) => (
            <KPI key={i} label={m.metric} value={m.val2025} sub={m.yoy} delay={Math.min(i + 1, 8)}
              onClick={() => setSelectedKPI({ label: m.metric, value: m.val2025, color: T.gold, description: `${m.metric} — Official DLD data for 2025. Dubai's 5th consecutive record year.`, source: "Dubai Land Department 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "2025 Value", value: m.val2025, note: "Record year" }, { label: "YoY Change", value: m.yoy, note: "vs 2024" }, { label: "2024 Value", value: m.val2024 || "—", note: "Prior year" }], trend: null })}
            />
          ))}
        </div>
      </Section>

      <Chart title="Dubai Total Sales Value Growth (AED B)" style={{ marginTop: 20 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dubaiSalesHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" name="Sales (AED B)" radius={[6, 6, 0, 0]} barSize={36}>
              {[T.textMuted, T.textSecondary, T.teal, T.blue, T.gold, T.goldLight].map((c, i) => <Cell key={i} fill={c} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Chart>

      <Section title="2026 Outlook" sub="Knight Frank, CW Core, Fitch Ratings — Click each for full analysis">
        <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
          {[
            { firm: "Knight Frank", color: T.gold, forecast: "+3% prime / +1% mainstream", short: "+3% prime, ~1% mainstream. Transitioning to sustainable growth phase.", detail: "Knight Frank's 2026 Dubai Residential Forecast projects prime property appreciation of +3% and mainstream market growth of ~1%. The report notes Dubai is entering a more mature, sustainable growth cycle after two years of double-digit gains.", bullets: ["+3% prime appreciation", "~1% mainstream growth", "Sustainable cycle ahead", "HNWI inflows continue", "Golden Visa demand strong"], sourceUrl: "https://www.knightfrank.com/research" },
            { firm: "CW Core", color: T.teal, forecast: "5–8% appreciation", short: "5-8% appreciation forecast. Slowdown from 12-22% in 2024-25.", detail: "Cushman & Wakefield Core's 2026 outlook projects 5–8% price appreciation for Dubai residential, a marked slowdown from 12–22% seen in 2024–25.", bullets: ["5–8% price appreciation", "~120K units in 2026 pipeline", "Off-plan stays 60–65% of volume", "Strong end-user demand", "Low mortgage penetration"], sourceUrl: "https://cwcore.com" },
            { firm: "Fitch Ratings", color: T.orange, forecast: "Stable / Watch", short: "Moderate correction possible. ~120K units in 2026 pipeline.", detail: "Fitch Ratings maintained a Stable Outlook for UAE developers (Dec 2025), citing Emaar's strong backlog and recurring revenue as key buffers.", bullets: ["Developer outlook: Stable", "120K unit pipeline = risk", "Affordable segment most exposed", "Emaar backlog = strong buffer", "Emaar rated BBB (Stable)"], sourceUrl: "https://www.fitchratings.com" },
          ].map((item, i) => <ForecastCard key={i} {...item} />)}
        </div>
      </Section>

      <Section title="Market Indicators" sub="Key metrics shaping Dubai's real estate future">
        <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          {[
            ["Population Target", "5.8M by 2040"], ["Price Cycle", "56+ months positive"], ["Developer Count", "228 active"],
            ["Units Launched", "131,504 in 2025"], ["Mortgage Txns", "50,974 deals"], ["2026 Pipeline", "~120K units"],
            ["Women Investors", "AED 154B"], ["REIDIN Growth", "+12.9% YoY"], ["Investor Base", "193.1K (+24%)"],
          ].map(([k, v], i) => (
            <div key={i} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
              <span style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{k}</span>
              <span style={{ color: T.white, fontSize: 15, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>

      <TabSources sources={[
        { label: "Dubai Land Department (Official)", url: "https://dubailand.gov.ae" },
        { label: "REIDIN Dec 2025", url: "https://reidin.com" },
        { label: "ValuStrat Q4 2025" },
        { label: "Knight Frank Dubai 2025", url: "https://www.knightfrank.com/research" },
        { label: "Gulf News Property", url: "https://gulfnews.com/business/property" },
        { label: "Zawya Real Estate", url: "https://www.zawya.com" },
      ]} />
    </>
  );
};

export default MarketTab;
