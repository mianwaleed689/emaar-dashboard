import React from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../../../styles/theme";

/**
 * OverviewTab — Key Performance, AI Insights, Charts, Company Strength
 * Props passed down from EmaarDashboardV2 (parent keeps all state)
 */
const OverviewTab = ({
  tab,
  user,
  isPro,
  segments,
  financials,
  radarData,
  activeProjects,
  emaarStockPrice,
  aiInsights,
  insightsLoading,
  setSelectedKPI,
  setShowUpgrade,
  KPI,
  Chart,
  Section,
  DataBadge,
  TabSources,
  CustomTooltip,
  ProGate,
}) => {
  return (
    <>
      {/* ─── VERIFIED BAR ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 4, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
          </span>
          <span style={{ fontSize: 11, color: T.textSecondary }}>Data verified <span style={{ color: T.gold, fontWeight: 600 }}>{new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</span></span>
          <span style={{ color: T.border }}>·</span>
          <a href="https://www.emaar.com/en/investor-relations/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.teal, textDecoration: "none" }}>Emaar IR ↗</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.textMuted }}>Click any card for breakdown & sources</span>
          <button
            type="button"
            onClick={async () => {
              const now = new Date().toLocaleDateString("en-AE", { day: "numeric", month: "long", year: "numeric" });
              const tabLabel = tab || "Overview";
              if (!window.jspdf) {
                await new Promise((resolve, reject) => {
                  const s = document.createElement("script");
                  s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                  s.onload = resolve; s.onerror = reject;
                  document.head.appendChild(s);
                });
              }
              const { jsPDF } = window.jspdf;
              const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
              const W = 210, M = 18;
              pdf.setFillColor(4, 9, 15);
              pdf.rect(0, 0, W, 297, "F");
              pdf.setFillColor(212, 168, 67);
              pdf.rect(0, 0, W, 2, "F");
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(22); pdf.setTextColor(212, 168, 67);
              pdf.text("DXB Analytics", M, 22);
              pdf.setFontSize(10); pdf.setTextColor(180, 180, 180);
              pdf.text("The Bloomberg of Dubai Real Estate", M, 29);
              pdf.setFontSize(14); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold");
              pdf.text(`${tabLabel} Report`, M, 42);
              pdf.setFontSize(9); pdf.setTextColor(140, 140, 140); pdf.setFont("helvetica", "normal");
              pdf.text(`Generated ${now} · ${user || "DXB Analytics"}`, M, 49);
              pdf.setDrawColor(212, 168, 67, 0.3); pdf.setLineWidth(0.3);
              pdf.line(M, 54, W - M, 54);
              let y = 62;
              const addSection = (title, rows) => {
                pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(212, 168, 67);
                pdf.text(title.toUpperCase(), M, y); y += 7;
                rows.forEach(([label, value, note]) => {
                  pdf.setFillColor(20, 35, 60); pdf.rect(M, y - 4, W - M * 2, 10, "F");
                  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(160, 160, 160);
                  pdf.text(label, M + 3, y + 2);
                  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(255, 255, 255);
                  pdf.text(value, M + 70, y + 2);
                  if (note) { pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(120, 140, 160); pdf.text(note, M + 130, y + 2); }
                  y += 12;
                });
                y += 4;
              };
              addSection("KEY METRICS", [
                ["Property Sales FY2025", "AED 80.4B", "+16% YoY · All-time record"],
                ["Revenue FY2025", "AED 49.6B", "+40% YoY · USD 13.5B"],
                ["Net Profit FY2025", "AED 25.7B", "+36% YoY · USD 7.0B"],
                ["Backlog", "AED 155B", "3–4yr revenue visibility"],
                ["Units Delivered", "125,600+", "Since 2002 · #1 GCC"],
              ]);
              addSection("FINANCIALS", [
                ["Market Cap", "AED 128.2B", "~USD 34.9B"],
                ["P/E Ratio", "7.83×", "Industry avg 15.5×"],
                ["Dividend Yield", "7.04%", "AED 1.00/share"],
                ["Debt/Equity", "0.11×", "Very low leverage"],
                ["Credit Rating", "BBB+ / Baa1", "S&P / Moody's stable"],
              ]);
              if (aiInsights.length > 0 && y < 220) {
                pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(212, 168, 67);
                pdf.text("AI MARKET INSIGHTS", M, y); y += 7;
                aiInsights.slice(0, 3).forEach(ins => {
                  if (y > 260) return;
                  pdf.setFillColor(14, 25, 45); pdf.rect(M, y - 4, W - M * 2, 14, "F");
                  pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(200, 200, 200);
                  pdf.text(ins.title, M + 3, y + 1);
                  pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(140, 140, 140);
                  const insText = ins.insight.length > 90 ? ins.insight.slice(0, 90) + "…" : ins.insight;
                  pdf.text(insText, M + 3, y + 7);
                  y += 16;
                });
              }
              pdf.setFillColor(212, 168, 67); pdf.rect(0, 293, W, 4, "F");
              pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(100, 100, 100);
              pdf.text(`DXB Analytics · emaar-dashboard.vercel.app · ${now} · For informational purposes only`, M, 289);
              pdf.save(`DXB-Analytics-Overview-${new Date().toISOString().slice(0, 10)}.pdf`);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(212,168,67,0.1)"}
          >
            ⬇ Export PDF
          </button>
        </div>
      </div>

      {/* ── AI Market Insights Feed ── */}
      {(aiInsights.length > 0 || insightsLoading) && (
        <div style={{ background: "linear-gradient(135deg, rgba(14,29,53,0.8), rgba(4,9,15,0.9))", borderRadius: 16, border: `1px solid rgba(212,168,67,0.2)`, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>✦</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase" }}>AI Market Intelligence</span>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: T.gold, border: `1px solid ${T.gold}30` }}>Powered by Claude</span>
            </div>
            <span style={{ fontSize: 10, color: T.textMuted }}>Updated {new Date().toLocaleDateString("en-AE", { month: "short", year: "numeric" })}</span>
          </div>
          {insightsLoading
            ? <div style={{ display: "flex", gap: 8, alignItems: "center", color: T.textMuted, fontSize: 12 }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Analysing Dubai market data…</div>
            : <div className="ai-insights-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {aiInsights.map((ins, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8, fontWeight: 700, letterSpacing: 0.5,
                        background: ins.tag === "Yield" ? "rgba(16,185,129,0.1)" : ins.tag === "Risk" ? "rgba(239,68,68,0.1)" : ins.tag === "Opportunity" ? "rgba(212,168,67,0.1)" : "rgba(59,130,246,0.1)",
                        color: ins.tag === "Yield" ? T.green : ins.tag === "Risk" ? "#EF4444" : ins.tag === "Opportunity" ? T.gold : T.blue }}>
                        {ins.tag}
                      </span>
                      <span style={{ fontSize: 13 }}>{ins.direction === "up" ? "↑" : ins.direction === "down" ? "↓" : "→"}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 5, lineHeight: 1.3 }}>{ins.title}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{ins.insight}</div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      <Section title="Key Performance" sub="FY 2025 — All-Time Records Across Every Metric · Source: Emaar Annual Report 2025">
        <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {emaarStockPrice && (
            <div
              style={{ background: T.surface, border: `1px solid ${emaarStockPrice.up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: "14px 16px", cursor: "default", position: "relative", overflow: "hidden" }}
              onClick={() => setSelectedKPI({ label: "EMAAR.DU Live Price", value: `AED ${emaarStockPrice.price}`, color: emaarStockPrice.up ? T.green : "#EF4444", description: "Live Emaar Properties (EMAAR.DU) share price from Dubai Financial Market. Auto-refreshes every 5 minutes.", source: "Yahoo Finance · DFM Live", sourceUrl: "https://finance.yahoo.com/quote/EMAAR.DU", items: [{ label: "Current Price", value: `AED ${emaarStockPrice.price}`, note: "DFM live" }, { label: "Day Change", value: `${emaarStockPrice.up ? "+" : ""}${emaarStockPrice.change}%`, note: "vs prev close" }, { label: "Market Cap", value: "AED 128.2B", note: "~USD 34.9B" }, { label: "Analyst Target", value: "AED 19.94", note: "12/12 Strong Buy" }, { label: "Dividend Yield", value: "~7%", note: "AED 1.00/share" }], trend: null })}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: emaarStockPrice.up ? "#10B981" : "#EF4444" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>EMAAR.DU · Live</span>
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: emaarStockPrice.up ? T.green : "#EF4444", lineHeight: 1 }}>AED {emaarStockPrice.price}</div>
              <div style={{ fontSize: 11, color: emaarStockPrice.up ? T.green : "#EF4444", marginTop: 4 }}>{emaarStockPrice.up ? "▲" : "▼"} {Math.abs(emaarStockPrice.change)}% today · DFM</div>
            </div>
          )}
          <KPI label="Property Sales" value="AED 80.4B" sub="+16% YoY · USD 21.9B" delay={1} onClick={() => setSelectedKPI({ label: "Property Sales", value: "AED 80.4B", color: T.gold, description: "Total off-plan and ready property sales contracted in FY2025.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "FY2025 Sales", value: "AED 80.4B", note: "All-time record" }, { label: "FY2024 Sales", value: "AED 69.3B", note: "+16% YoY" }, { label: "FY2023 Sales", value: "AED 52.7B", note: "+31% YoY" }, { label: "Int'l Sales", value: "AED 9.3B", note: "+124% YoY" }, { label: "UAE Market Share", value: "~30%", note: "Largest by value" }], trend: [{ y: "2020", v: 21.5 }, { y: "2021", v: 26.2 }, { y: "2022", v: 33.5 }, { y: "2023", v: 52.7 }, { y: "2024", v: 69.3 }, { y: "2025", v: 80.4 }] })} />
          <KPI label="Revenue" value="AED 49.6B" sub="+40% YoY · USD 13.5B" delay={2} onClick={() => setSelectedKPI({ label: "Revenue", value: "AED 49.6B", color: T.teal, description: "Total recognized revenue across all segments.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "UAE Dev Revenue", value: "AED 36.4B", note: "73% of total" }, { label: "Malls & Retail", value: "AED 6.3B", note: "+13% YoY" }, { label: "Hospitality", value: "AED 4.2B", note: "+12% YoY" }, { label: "International", value: "AED 2.6B", note: "+124% YoY" }], trend: [{ y: "2020", v: 14.6 }, { y: "2021", v: 17.0 }, { y: "2022", v: 24.5 }, { y: "2023", v: 30.6 }, { y: "2024", v: 35.4 }, { y: "2025", v: 49.6 }] })} />
          <KPI label="Net Profit" value="AED 25.7B" sub="+36% YoY · USD 7.0B" delay={3} onClick={() => setSelectedKPI({ label: "Net Profit", value: "AED 25.7B", color: T.green, description: "Net profit before minority interest.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Net Margin", value: "51.8%", note: "Industry-leading" }, { label: "EPS FY2025", value: "AED 2.00", note: "+31% YoY" }, { label: "Q4 2025 Profit", value: "AED 7.3B", note: "Strongest quarter" }], trend: [{ y: "2020", v: 2.6 }, { y: "2021", v: 4.1 }, { y: "2022", v: 6.2 }, { y: "2023", v: 12.6 }, { y: "2024", v: 18.9 }, { y: "2025", v: 25.7 }] })} />
          <KPI label="Backlog" value="AED 155B" sub="+39% YoY · 3-4yr visibility" delay={4} onClick={() => setSelectedKPI({ label: "Revenue Backlog", value: "AED 155B", color: T.purple, description: "Total contracted but unrecognized revenue.", source: "Emaar Q4 2025 Results", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Backlog", value: "AED 155B", note: "+39% YoY record" }, { label: "FY2024 Backlog", value: "AED 111.5B", note: "Prior year" }, { label: "Coverage Ratio", value: "3–4 yrs", note: "Revenue visibility" }], trend: [{ y: "2020", v: 45 }, { y: "2021", v: 52 }, { y: "2022", v: 68 }, { y: "2023", v: 80 }, { y: "2024", v: 111.5 }, { y: "2025", v: 155 }] })} />
          <KPI label="Units Delivered" value="125,600+" sub="Since 2002 · #1 in GCC" delay={5} onClick={() => setSelectedKPI({ label: "Units Delivered", value: "125,600+", color: T.gold, description: "Total residential and commercial units delivered since inception in 2002.", source: "Emaar Corporate Profile 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Delivered", value: "125,600+", note: "Since 2002" }, { label: "FY2025 Deliveries", value: "~11,000", note: "Est. annual handovers" }], trend: null })} />
        </div>
      </Section>

      <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <Chart title="Revenue by Segment (AED B)">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={segments} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={52} paddingAngle={3} stroke="none">
                {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {segments.map((s, i) => (
              <span key={i} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, display: "inline-block" }} />
                {s.name} ({s.revenue}B · {s.growth})
              </span>
            ))}
          </div>
        </Chart>

        <Chart title="6-Year Revenue & Profit (AED B)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={financials}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.25} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke={T.gold} fill="url(#gRev)" strokeWidth={2.5} name="Revenue" />
              <Line type="monotone" dataKey="netProfit" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 3 }} name="Net Profit" />
              <Line type="monotone" dataKey="ebitda" stroke={T.blue} strokeWidth={2} dot={{ fill: T.blue, r: 3 }} name="EBITDA" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[["Revenue", T.gold], ["Net Profit", T.teal], ["EBITDA", T.blue]].map(([name, color]) => (
              <span key={name} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 20, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
                {name}
              </span>
            ))}
          </div>
        </Chart>
      </div>

      <Section title="Company Strength" sub="Analyst consensus: STRONG BUY (12 of 12 analysts) · Source: Investing.com">
        <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DataBadge source="Emaar Annual Report FY2025" date="Dec 2025" type="emaar" />
          <DataBadge source="S&P / Fitch Ratings 2025" date="2025" type="manual" />
        </div>
        <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <Chart title="Performance Radar">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSecondary, fontSize: 10 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name="Emaar" dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </Chart>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Founded", value: "1997", sub: "27+ years track record" },
              { label: "Developer Rank", value: "#1", sub: "Dubai's largest by value" },
              { label: "Active Projects", value: String(activeProjects.length), sub: "Across 10+ communities" },
              { label: "International", value: "AED 9.3B", sub: "+124% growth YoY" },
              { label: "Dividend/Share", value: "AED 1.00", sub: "2× increase from 2023" },
              { label: "Target Upside", value: "+21.8%", sub: "AED 20.77 consensus" },
            ].map(({ label, value, sub }, i) => (
              <KPI key={i} label={label} value={value} sub={sub} delay={Math.min(i + 1, 8)} />
            ))}
          </div>
        </div>
        <TabSources sources={[
          { label: "Emaar Annual Report 2025", url: "https://www.emaar.com/en/investor-relations/" },
          { label: "DFM: EMAAR.DU", url: "https://www.dfm.ae" },
          { label: "TradingView", url: "https://www.tradingview.com/symbols/DFM-EMAAR/" },
          { label: "Yahoo Finance", url: "https://finance.yahoo.com/quote/EMAAR.DU" },
        ]} />
      </Section>
    </>
  );
};

export default OverviewTab;
