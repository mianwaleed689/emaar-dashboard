import React from "react";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { T } from "../../../styles/theme";

/**
 * PriceHistoryTab — Dubai property price history 2008–2025 with cycle analysis
 * Props: Section, Chart, CustomTooltip, TabSources
 */
const PriceHistoryTab = ({ Section, Chart, CustomTooltip, TabSources }) => {
  const HISTORY = {
    "Dubai Average":    [ { y:"2008",v:1420},{y:"2009",v:870},{y:"2010",v:780},{y:"2011",v:820},{y:"2012",v:920},{y:"2013",v:1100},{y:"2014",v:1250},{y:"2015",v:1150},{y:"2016",v:1050},{y:"2017",v:1020},{y:"2018",v:980},{y:"2019",v:930},{y:"2020",v:880},{y:"2021",v:970},{y:"2022",v:1150},{y:"2023",v:1380},{y:"2024",v:1560},{y:"2025",v:1689}],
    "Downtown Dubai":   [ { y:"2008",v:3200},{y:"2009",v:1800},{y:"2010",v:1600},{y:"2011",v:1700},{y:"2012",v:1950},{y:"2013",v:2300},{y:"2014",v:2600},{y:"2015",v:2350},{y:"2016",v:2100},{y:"2017",v:2050},{y:"2018",v:1980},{y:"2019",v:1900},{y:"2020",v:1780},{y:"2021",v:2050},{y:"2022",v:2450},{y:"2023",v:2800},{y:"2024",v:3050},{y:"2025",v:3200}],
    "Palm Jumeirah":    [ { y:"2008",v:3800},{y:"2009",v:2200},{y:"2010",v:1900},{y:"2011",v:2000},{y:"2012",v:2300},{y:"2013",v:2800},{y:"2014",v:3200},{y:"2015",v:2900},{y:"2016",v:2600},{y:"2017",v:2500},{y:"2018",v:2400},{y:"2019",v:2300},{y:"2020",v:2200},{y:"2021",v:2800},{y:"2022",v:3400},{y:"2023",v:3800},{y:"2024",v:4100},{y:"2025",v:4200}],
    "Dubai Hills Estate":[ { y:"2008",v:null},{y:"2009",v:null},{y:"2010",v:null},{y:"2011",v:null},{y:"2012",v:null},{y:"2013",v:null},{y:"2014",v:1100},{y:"2015",v:1050},{y:"2016",v:980},{y:"2017",v:1000},{y:"2018",v:1050},{y:"2019",v:1080},{y:"2020",v:1020},{y:"2021",v:1200},{y:"2022",v:1500},{y:"2023",v:1780},{y:"2024",v:1950},{y:"2025",v:2050}],
    "JVC":              [ { y:"2008",v:950},{y:"2009",v:600},{y:"2010",v:520},{y:"2011",v:530},{y:"2012",v:580},{y:"2013",v:680},{y:"2014",v:780},{y:"2015",v:720},{y:"2016",v:680},{y:"2017",v:660},{y:"2018",v:640},{y:"2019",v:620},{y:"2020",v:590},{y:"2021",v:700},{y:"2022",v:880},{y:"2023",v:1020},{y:"2024",v:1120},{y:"2025",v:1180}],
    "Business Bay":     [ { y:"2008",v:1800},{y:"2009",v:1100},{y:"2010",v:950},{y:"2011",v:980},{y:"2012",v:1100},{y:"2013",v:1300},{y:"2014",v:1450},{y:"2015",v:1320},{y:"2016",v:1200},{y:"2017",v:1150},{y:"2018",v:1100},{y:"2019",v:1050},{y:"2020",v:980},{y:"2021",v:1150},{y:"2022",v:1350},{y:"2023",v:1520},{y:"2024",v:1620},{y:"2025",v:1650}],
    "Dubai Marina":     [ { y:"2008",v:2200},{y:"2009",v:1300},{y:"2010",v:1150},{y:"2011",v:1200},{y:"2012",v:1380},{y:"2013",v:1600},{y:"2014",v:1800},{y:"2015",v:1650},{y:"2016",v:1500},{y:"2017",v:1450},{y:"2018",v:1380},{y:"2019",v:1320},{y:"2020",v:1250},{y:"2021",v:1450},{y:"2022",v:1720},{y:"2023",v:1920},{y:"2024",v:2050},{y:"2025",v:2100}],
  };

  const CYCLES = [
    { year:"2008", event:"Global Financial Crisis",  type:"crash",      desc:"Dubai property crashed 50–60% from peak. Off-plan projects stalled. Nakheel restructured $16B debt." },
    { year:"2012", event:"Recovery Begins",          type:"recovery",   desc:"Foreign investor confidence returns. Expo 2020 bid announced. Prices start rising again." },
    { year:"2014", event:"Peak & Correction",        type:"correction", desc:"Second boom peaks. Government cooling measures (double DLD fee to 4%, mortgage LTV caps) trigger 25% correction." },
    { year:"2020", event:"COVID-19 Dip",             type:"crash",      desc:"Pandemic causes 15–20% dip. Short-lived — UAE's COVID response and Golden Visa expansion drive rapid recovery." },
    { year:"2021", event:"New Bull Run Begins",      type:"recovery",   desc:"Record transactions. Millionaire migration accelerates. 56+ consecutive months of growth begins." },
    { year:"2025", event:"Record Market",            type:"peak",       desc:"AED 682B market. 5th consecutive record year. 214,912 transactions. Prices at all-time highs in most communities." },
  ];

  const COLORS = {
    "Dubai Average":     T.gold,
    "Downtown Dubai":    "#8B5CF6",
    "Palm Jumeirah":     "#3B82F6",
    "Dubai Hills Estate":"#10B981",
    "JVC":               "#F59E0B",
    "Business Bay":      "#EC4899",
    "Dubai Marina":      "#06B6D4",
  };

  const ALL_COMMUNITIES = Object.keys(HISTORY);
  const years = ["2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];

  const chartData = years.map(y => {
    const row = { year: y };
    ALL_COMMUNITIES.forEach(c => {
      const pt = HISTORY[c].find(p => p.y === y);
      if (pt && pt.v) row[c] = pt.v;
    });
    return row;
  });

  const calcStats = (comm) => {
    const pts = HISTORY[comm].filter(p => p.v);
    const first = pts[0]?.v;
    const last  = pts[pts.length - 1]?.v;
    const peak   = Math.max(...pts.map(p => p.v));
    const trough = Math.min(...pts.map(p => p.v));
    const totalGain   = first && last ? ((last - first) / first * 100).toFixed(0) : "—";
    const fromTrough  = trough && last ? ((last - trough) / trough * 100).toFixed(0) : "—";
    return { first, last, peak, trough, totalGain, fromTrough };
  };

  const cycleColor = (type) =>
    type === "crash" ? T.red : type === "recovery" ? T.green : type === "correction" ? T.orange : T.gold;

  return (
    <>
      <Section title="Dubai Property Price History 2008–2025" sub="Price per sqft (AED) · Full market cycle including 2008 crash, 2014 correction, COVID dip, and current bull run">

        {/* Cycle timeline */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:24, scrollbarWidth:"none" }}>
          {CYCLES.map((c, i) => (
            <div key={i} style={{ flexShrink:0, background:`${cycleColor(c.type)}14`, border:`1px solid ${cycleColor(c.type)}40`, borderRadius:12, padding:"12px 14px", minWidth:180, maxWidth:200 }}>
              <div style={{ fontSize:18, fontWeight:900, fontFamily:"'Fraunces',serif", color:cycleColor(c.type) }}>{c.year}</div>
              <div style={{ fontSize:11, fontWeight:700, color:T.textSecondary, marginBottom:6 }}>{c.event}</div>
              <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.5 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Main line chart */}
        <Chart title="Price Per Sqft (AED) — All Communities 2008–2025">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top:10, right:10, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill:T.textMuted, fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:T.textMuted, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => "AED " + v.toLocaleString()} width={80} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginBottom:8 }}>{label}</div>
                    {payload.map((p, i) => p.value && (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:16, fontSize:12, color:T.textSecondary, marginBottom:3 }}>
                        <span style={{ color:p.color }}>{p.name}</span>
                        <span style={{ fontWeight:700, color:T.white }}>AED {p.value.toLocaleString()}/sqft</span>
                      </div>
                    ))}
                  </div>
                );
              }} />
              <Legend wrapperStyle={{ fontSize:11, color:T.textMuted, paddingTop:12 }} />
              {ALL_COMMUNITIES.map(c => (
                <Line key={c} type="monotone" dataKey={c} stroke={COLORS[c]} strokeWidth={c === "Dubai Average" ? 3 : 1.5} dot={false} connectNulls={false} />
              ))}
              <ReferenceLine x="2008" stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value:"GFC",   fill:T.red,    fontSize:10 }} />
              <ReferenceLine x="2014" stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value:"Peak",  fill:T.orange, fontSize:10 }} />
              <ReferenceLine x="2020" stroke="rgba(239,68,68,0.3)"  strokeDasharray="4 4" label={{ value:"COVID", fill:T.red,    fontSize:10 }} />
              <ReferenceLine x="2021" stroke="rgba(16,185,129,0.4)" strokeDasharray="4 4" label={{ value:"Bull",  fill:T.green,  fontSize:10 }} />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      </Section>

      {/* Community stats cards */}
      <Section title="Community Performance — Full Cycle" sub="From 2008 peak to 2025 · AED/sqft">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:14, marginTop:16 }}>
          {ALL_COMMUNITIES.map(comm => {
            const s = calcStats(comm);
            const isPositive = parseFloat(s.totalGain) > 0;
            return (
              <div key={comm} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:COLORS[comm], display:"inline-block", marginRight:6 }} />
                    <span style={{ fontSize:13, fontWeight:700, color:T.white }}>{comm}</span>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:isPositive ? T.green : T.red, background:isPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", padding:"2px 8px", borderRadius:6 }}>
                    {isPositive ? "+" : ""}{s.totalGain}% since 2008
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { label:"2008 Peak",    val: s.first ? "AED " + s.first.toLocaleString() : "N/A" },
                    { label:"2025 Price",   val: s.last  ? "AED " + s.last.toLocaleString()  : "N/A" },
                    { label:"All-Time High",val: s.peak  ? "AED " + s.peak.toLocaleString()  : "N/A" },
                    { label:"From Trough",  val: s.fromTrough ? "+" + s.fromTrough + "%" : "N/A" },
                  ].map((m, i) => (
                    <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{m.label}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:i === 1 ? T.gold : T.textSecondary }}>{m.val}</div>
                    </div>
                  ))}
                </div>
                {/* Sparkline */}
                <div style={{ display:"flex", gap:2, marginTop:12, alignItems:"flex-end", height:28 }}>
                  {HISTORY[comm].filter(p => p.v).map((p, pi, arr) => {
                    const maxV = Math.max(...arr.map(x => x.v));
                    const h = Math.round((p.v / maxV) * 28);
                    const isLast = pi === arr.length - 1;
                    return <div key={pi} style={{ flex:1, height:h, borderRadius:2, background:isLast ? T.gold : COLORS[comm] + "60", transition:"height 0.3s" }} title={`${p.y}: AED ${p.v.toLocaleString()}`} />;
                  })}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:9, color:T.textMuted }}>2008</span>
                  <span style={{ fontSize:9, color:T.textMuted }}>2025</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cycle analysis */}
      <Section title="Market Cycle Analysis" sub="Dubai's 3 major cycles since 2008 — what history tells us">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:14, marginTop:16 }}>
          {[
            { cycle:"Cycle 1: 2008–2012", icon:"📉", color:T.red,   title:"Crash & Recovery",       stats:[{l:"Peak (2008)",v:"AED 1,420/sqft"},{l:"Trough (2010)",v:"AED 780/sqft"},{l:"Drawdown",v:"-45%"},{l:"Recovery",v:"3 years"}], insight:"GFC triggered Dubai's worst crash — overleveraged developers, stalled projects, and Nakheel's $16B debt restructuring. Recovery driven by fundamentals: no income tax, growing expat population, infrastructure completion." },
            { cycle:"Cycle 2: 2012–2020", icon:"📊", color:T.gold,  title:"Boom, Cooldown, Stability", stats:[{l:"Peak (2014)",v:"AED 1,250/sqft"},{l:"Trough (2020)",v:"AED 880/sqft"},{l:"Drawdown",v:"-30%"},{l:"Duration",v:"8 years"}], insight:"Government cooling measures (4% DLD, LTV caps) softened the boom. Gradual 25% correction until COVID. More orderly than 2008 — regulated market with escrow laws protecting off-plan buyers." },
            { cycle:"Cycle 3: 2020–2025+",icon:"🚀", color:T.green, title:"The Great Bull Run",       stats:[{l:"Trough (2020)",v:"AED 880/sqft"},{l:"Current (2025)",v:"AED 1,689/sqft"},{l:"Gain",v:"+92%"},{l:"Duration",v:"5+ years"}], insight:"Longest bull run in Dubai history. Driven by: Golden Visa expansion, millionaire migration, limited new supply in premium zones, post-COVID safe haven demand, and AED-USD peg stability." },
          ].map((cy, i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid ${cy.color}33`, borderRadius:14, padding:20 }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{cy.icon}</div>
              <div style={{ fontSize:11, color:cy.color, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{cy.cycle}</div>
              <div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:14 }}>{cy.title}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                {cy.stats.map((s, si) => (
                  <div key={si} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>{s.l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:cy.color, marginTop:2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:T.textMuted, lineHeight:1.6 }}>{cy.insight}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* YoY change bar chart */}
      <Section title="Year-on-Year Price Change — Dubai Average" sub="Annual % change in price per sqft · Highlights boom, bust, and recovery phases">
        <Chart>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={years.slice(1).map((y, i) => {
                const prev = HISTORY["Dubai Average"][i]?.v;
                const curr = HISTORY["Dubai Average"][i + 1]?.v;
                const pct  = prev && curr ? ((curr - prev) / prev * 100) : 0;
                return { year: y, change: parseFloat(pct.toFixed(1)) };
              })}
              margin={{ top:10, right:10, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill:T.textMuted, fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:T.textMuted, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} formatter={v => [v + "%", "YoY Change"]} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Bar dataKey="change" radius={[4,4,0,0]} barSize={28}>
                {years.slice(1).map((y, i) => {
                  const prev = HISTORY["Dubai Average"][i]?.v;
                  const curr = HISTORY["Dubai Average"][i + 1]?.v;
                  const pct  = prev && curr ? ((curr - prev) / prev * 100) : 0;
                  return <Cell key={i} fill={pct >= 0 ? T.green : T.red} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      </Section>

      <TabSources sources={[
        { label:"REIDIN Historical Index 2008–2025",      url:"https://reidin.com" },
        { label:"Property Monitor Dynamic Price Index",   url:"https://propertymonitor.com" },
        { label:"ValuStrat Price Index",                  url:"https://www.valustrat.com" },
        { label:"Dubai Land Department — DLD",            url:"https://dubailand.gov.ae" },
        { label:"Knight Frank Dubai Report 2025",         url:"https://www.knightfrank.com/research" },
        { label:"Cavendish Maxwell Market Reports" },
      ]} />
    </>
  );
};

export default PriceHistoryTab;
