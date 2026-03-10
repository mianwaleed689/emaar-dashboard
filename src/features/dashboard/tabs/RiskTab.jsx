import React from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../../../styles/theme";

/**
 * RiskTab — 9-factor risk assessment, mitigation strategies
 */
const RiskTab = ({
  isPro,
  risks,
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
      <Section title="9-Factor Risk Assessment" sub="Overall: LOW-MODERATE · Investment Grade · BBB+/Baa1/BBB">
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
          <KPI label="Avg Risk Score" value="38.3" sub="LOW-MODERATE overall" delay={1}
            onClick={() => setSelectedKPI({ label: "Avg Risk Score", value: "38.3 / 140", color: T.teal, description: "Composite risk score across 9 factors. Score of 38.3 out of 140 max = LOW-MODERATE risk.", source: "DXB Analytics · Fitch · S&P · Moody's", sourceUrl: "https://www.fitchratings.com", items: [{ label: "Overall Score", value: "38.3/140", note: "LOW-MODERATE" }, { label: "S&P Rating", value: "BBB+", note: "Stable outlook" }, { label: "Moody's", value: "Baa1", note: "Stable outlook" }, { label: "Fitch", value: "BBB", note: "Stable outlook" }], trend: null })} />
          <KPI label="Highest Risk" value="125" sub="Premium Pricing" delay={2}
            onClick={() => setSelectedKPI({ label: "Highest Risk Factor", value: "Premium Pricing", color: T.red, description: "Premium pricing is Emaar's highest risk factor. At 20–40% above competitors, a market downturn could compress sales volumes faster than peers.", source: "DXB Analytics Risk Model", sourceUrl: "#", items: [{ label: "Risk Score", value: "125/140", note: "Highest risk factor" }, { label: "Price Premium", value: "20–40%", note: "vs comparable developments" }, { label: "Mitigation", value: "80/20 plans", note: "Reduces buyer barrier" }], trend: null })} />
          <KPI label="Lowest Risk" value="1" sub="Liquidity / Exit" delay={3}
            onClick={() => setSelectedKPI({ label: "Lowest Risk Factor", value: "Liquidity / Exit", color: T.green, description: "Emaar has the lowest liquidity risk of any Dubai developer. DFM-listed, investment-grade rated, with AED 30.5B free cash flow.", source: "DXB Analytics Risk Model · DFM", sourceUrl: "https://www.dfm.ae", items: [{ label: "Risk Score", value: "1/140", note: "Lowest risk factor" }, { label: "Free Cash Flow", value: "AED 30.5B", note: "FY2025" }, { label: "Net Cash", value: "AED 7.5B", note: "Cash vs debt" }, { label: "Debt/Equity", value: "0.11×", note: "Very low leverage" }], trend: null })} />
        </div>
      </Section>

      <ProGate isPro={isPro} message="Unlock Full Risk Analysis" onUpgrade={() => setShowUpgrade(true)}>
        <Chart title="Risk Score by Factor (Higher = More Risk)" style={{ marginTop: 20 }}>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={risks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 140]} />
              <YAxis type="category" dataKey="factor" tick={{ fill: T.textSecondary, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Risk Score" radius={[0, 8, 8, 0]} barSize={22}>
                {risks.map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Chart>

        <Section title="Mitigation Strategies" sub="How Emaar mitigates key risks">
          <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              ["Market Cycle", "AED 155B backlog = 3-4yr cushion. 35% recurring from malls/hotels.", T.orange],
              ["Supply Competition", "Brand premium 20-40%. 79K delivery track record. 14+ master communities.", T.gold],
              ["Premium Pricing", "80/20 payment plans reduce barrier. Branded residences justify premium.", T.red],
              ["Geographic Conc.", "+124% intl sales YoY. Expanding to Saudi, Egypt, India.", T.teal],
            ].map(([title, desc, color], i) => (
              <div key={i} className="chart-box" style={{ borderTop: `3px solid ${color}` }}>
                <h4 style={{ color, fontSize: 14, fontWeight: 600, marginBottom: 6, fontFamily: "'Fraunces', serif" }}>{title}</h4>
                <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </ProGate>

      <TabSources sources={[
        { label: "Fitch Ratings UAE Developers", url: "https://www.fitchratings.com" },
        { label: "Knight Frank Dubai 2025", url: "https://www.knightfrank.com/research" },
        { label: "IMF World Economic Outlook", url: "https://www.imf.org" },
        { label: "DLD Transaction Data", url: "https://dubailand.gov.ae" },
        { label: "CW Core Dubai Market Report", url: "https://cwcore.com" },
      ]} />
    </>
  );
};

export default RiskTab;
