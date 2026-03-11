import React from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T } from "../../../styles/theme";

/**
 * PortfolioTab — Personal investment tracker + project portfolio overview
 *
 * Props:
 *   myPortfolio, roiMode, setRoiMode
 *   activeProjects, emaarCommunities, communityProjects
 *   showAddPortfolio, setShowAddPortfolio
 *   removeFromPortfolio
 *   getHandoverCountdown, getLinkLabel, getInvestmentScore
 *   setSelectedKPI, setSelectedCommunity
 *   KPI, Section, Chart, CustomTooltip, TabSources
 */
const PortfolioTab = ({
  myPortfolio, roiMode, setRoiMode,
  activeProjects, emaarCommunities, communityProjects,
  setShowAddPortfolio,
  removeFromPortfolio,
  getHandoverCountdown, getLinkLabel,
  setSelectedKPI, setSelectedCommunity,
  KPI, Section, Chart, CustomTooltip, TabSources,
}) => {

  /* ── ROI ANALYSIS VIEW ── */
  const RoiView = () => {
    const holdings = myPortfolio.map(h => {
      const p    = activeProjects.find(x => x.id === h.projectId);
      if (!p) return null;
      const comm         = emaarCommunities.find(c => c.name === p.community);
      const grossYield   = comm ? comm.avgYield : 5.0;
      const serviceCharge= p.ppsf > 2500 ? 28 : p.ppsf > 1800 ? 20 : 14;
      const sqft         = h.investedAmount / (p.ppsf || 2000);
      const annualRent   = h.investedAmount * (grossYield / 100);
      const annualSC     = sqft * serviceCharge;
      const mgmtFee      = annualRent * 0.09;
      const netRent      = annualRent - annualSC - mgmtFee;
      const netYield     = (netRent / h.investedAmount) * 100;
      const yrsHeld      = h.purchaseDate ? Math.max(0.5, (new Date() - new Date(h.purchaseDate)) / (365.25 * 24 * 3600 * 1000)) : 1;
      const apprRate     = p.ppsf > 2500 ? 0.12 : p.ppsf > 2000 ? 0.18 : 0.22;
      const currentValue = h.investedAmount * Math.pow(1 + apprRate, yrsHeld);
      const capitalGain  = currentValue - h.investedAmount;
      const totalReturn  = capitalGain + (netRent * yrsHeld);
      const irr          = ((totalReturn / h.investedAmount) / yrsHeld) * 100;
      return { ...h, p, grossYield, netYield: netYield.toFixed(1), annualRent: Math.round(annualRent), annualSC: Math.round(annualSC), netRent: Math.round(netRent), currentValue: Math.round(currentValue), capitalGain: Math.round(capitalGain), totalReturn: Math.round(totalReturn), irr: irr.toFixed(1), yrsHeld: yrsHeld.toFixed(1) };
    }).filter(Boolean);

    const totalInvested  = holdings.reduce((s, h) => s + h.investedAmount, 0);
    const totalCurrentVal= holdings.reduce((s, h) => s + h.currentValue, 0);
    const totalNetRent   = holdings.reduce((s, h) => s + h.netRent, 0);
    const totalCapGain   = holdings.reduce((s, h) => s + h.capitalGain, 0);
    const avgIRR         = holdings.length ? (holdings.reduce((s,h) => s + parseFloat(h.irr), 0) / holdings.length).toFixed(1) : "—";

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:T.surface, borderRadius:14, border:"1px solid rgba(212,168,67,0.3)", padding:"20px 24px" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.gold, marginBottom:4 }}>Portfolio ROI Dashboard</div>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>Projected based on DLD rental index + historical appreciation rates</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
            {[
              { l:"Total Invested",   v:"AED " + (totalInvested/1e6).toFixed(2) + "M",          c:T.white },
              { l:"Current Value",    v:"AED " + (totalCurrentVal/1e6).toFixed(2) + "M",         c:"#10B981" },
              { l:"Capital Gain",     v:"AED " + (totalCapGain/1e6).toFixed(2) + "M",            c:T.gold },
              { l:"Annual Net Rent",  v:"AED " + (totalNetRent/1000).toFixed(0) + "K",           c:"#3B82F6" },
              { l:"Portfolio IRR",    v:avgIRR + "%",                                             c:"#8B5CF6" },
              { l:"Total Return",     v:"AED " + ((totalCapGain+totalNetRent)/1e6).toFixed(2)+"M",c:"#10B981" },
            ].map(k => (
              <div key={k.l} style={{ background:T.surfaceAlt, borderRadius:10, padding:"12px 14px", border:"1px solid "+T.border }}>
                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", marginBottom:5 }}>{k.l}</div>
                <div style={{ fontSize:15, fontWeight:800, color:k.c, fontFamily:"'Fraunces',serif" }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:T.surface, borderRadius:14, border:"1px solid "+T.border, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid "+T.border }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white }}>Per-Property Breakdown</div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
              <thead>
                <tr style={{ background:T.surfaceAlt, borderBottom:"1px solid "+T.border }}>
                  {["Project","Invested","Current Val","Capital Gain","Gross Yield","Net Yield","Annual Net Rent","IRR"].map(h => (
                    <th key={h} style={{ padding:"9px 12px", textAlign:h==="Project"?"left":"right", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid "+T.border }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding:"11px 12px" }}>
                      <div style={{ fontWeight:700, color:T.white, fontSize:12 }}>{h.p.name}</div>
                      <div style={{ fontSize:10, color:T.textMuted }}>{h.p.community} · {h.unitType}</div>
                    </td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:12, color:T.textSecondary }}>AED {(h.investedAmount/1e6).toFixed(2)}M</td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:12, fontWeight:700, color:"#10B981" }}>AED {(h.currentValue/1e6).toFixed(2)}M</td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:12, color:T.gold }}>+AED {(h.capitalGain/1000).toFixed(0)}K</td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:12, color:T.gold, fontWeight:700 }}>{h.grossYield}%</td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:12, color:"#10B981", fontWeight:700 }}>{h.netYield}%</td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:12, color:"#3B82F6" }}>AED {(h.netRent/1000).toFixed(0)}K</td>
                    <td style={{ padding:"11px 12px", textAlign:"right", fontSize:14, fontWeight:800, color:"#8B5CF6", fontFamily:"'Fraunces',serif" }}>{h.irr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── CASH FLOW VIEW ── */
  const CashFlowView = () => {
    const holdings = myPortfolio.map(h => {
      const p            = activeProjects.find(x => x.id === h.projectId);
      if (!p) return null;
      const comm         = emaarCommunities.find(c => c.name === p.community);
      const grossYield   = comm ? comm.avgYield : 5.0;
      const serviceCharge= p.ppsf > 2500 ? 28 : p.ppsf > 1800 ? 20 : 14;
      const sqft         = h.investedAmount / (p.ppsf || 2000);
      const annualRent   = h.investedAmount * (grossYield / 100);
      const annualSC     = sqft * serviceCharge;
      const mgmtFee      = annualRent * 0.09;
      const netRent      = annualRent - annualSC - mgmtFee;
      return { ...h, p, annualRent:Math.round(annualRent), annualSC:Math.round(annualSC), mgmtFee:Math.round(mgmtFee), netRent:Math.round(netRent) };
    }).filter(Boolean);

    const yr = v => "AED " + (v/1000).toFixed(0) + "K/yr";
    const mo = v => "AED " + Math.round(v/12).toLocaleString() + "/mo";

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {holdings.map((h, i) => (
          <div key={i} style={{ background:T.surface, borderRadius:14, border:"1px solid "+T.border, padding:"18px 22px" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:T.white, marginBottom:2 }}>{h.p.name}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:14 }}>{h.p.community} · {h.unitType} · AED {(h.investedAmount/1e6).toFixed(2)}M invested</div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {[
                { l:"Gross Rental Income",          v:h.annualRent, c:"#10B981", sign:"+" },
                { l:"Service Charges",              v:h.annualSC,   c:"#EF4444", sign:"−" },
                { l:"Property Management (9%)",     v:h.mgmtFee,    c:"#EF4444", sign:"−" },
                { l:"Net Annual Cash Flow",         v:h.netRent,    c:T.gold,    sign:"=", bold:true },
              ].map((row, ri) => (
                <div key={ri} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:ri===3?"rgba(212,168,67,0.06)":"transparent", borderRadius:ri===3?8:0, borderTop:ri===3?"1px solid "+T.border:"none", marginTop:ri===3?4:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:row.c, width:16 }}>{row.sign}</span>
                    <span style={{ fontSize:12, color:row.bold?T.white:T.textSecondary, fontWeight:row.bold?700:400 }}>{row.l}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:row.bold?15:13, fontWeight:row.bold?800:600, color:row.c, fontFamily:row.bold?"'Fraunces',serif":"inherit" }}>{yr(row.v)}</span>
                    <span style={{ fontSize:10, color:T.textMuted, marginLeft:8 }}>({mo(row.v)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── HOLDINGS / SUMMARY VIEW ── */
  const HoldingsView = () => (
    <>
      <Section title="My Investments" sub={myPortfolio.length > 0 ? `${myPortfolio.length} holdings` : "Track your Emaar investments"}>
        {myPortfolio.length > 0 ? (
          <>
            <div style={{ display:"grid", gap:12, marginTop:16 }}>
              <KPI label="Total Invested"  value={`AED ${(myPortfolio.reduce((s,h) => s+(h.investedAmount||0),0)/1e6).toFixed(2)}M`} sub={`${myPortfolio.length} holdings`} delay={1} />
              <KPI label="Projected Value" value={`AED ${(myPortfolio.reduce((s,h)=>{ const p=activeProjects.find(x=>x.id===h.projectId); const ppsf=p?p.ppsf:2500; const appr=ppsf>2500?1.15:ppsf>2000?1.20:1.25; return s+(h.investedAmount||0)*appr; },0)/1e6).toFixed(2)}M`} sub="15-25% appreciation" delay={2} />
              <KPI label="Avg Yield"       value={`${(myPortfolio.reduce((s,h)=>{ const p=activeProjects.find(x=>x.id===h.projectId); const comm=p?emaarCommunities.find(c=>c.name===p.community):null; return s+(comm?comm.avgYield:5); },0)/(myPortfolio.length||1)).toFixed(1)}%`} sub="Across portfolio" delay={3} />
              <KPI label="Total Units"     value={myPortfolio.reduce((s,h)=>s+(h.units||0),0)} sub="Properties" delay={4} />
            </div>
            <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end" }}>
              <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ padding:"8px 20px", background:T.gold, color:T.bg, border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ Add Investment</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12, marginTop:12 }}>
              {myPortfolio.map((h, i) => {
                const p = activeProjects.find(x => x.id === h.projectId);
                if (!p) return null;
                const appr     = p.ppsf > 2500 ? 1.15 : p.ppsf > 2000 ? 1.20 : 1.25;
                const projected= h.investedAmount * appr;
                const gain     = ((appr - 1) * 100).toFixed(0);
                return (
                  <div key={i} style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:16, animationDelay:`${i*0.03}s` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:T.white }}>{p.name}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize:10, color:T.textMuted }}>{p.community} · {h.unitType} · {h.units} unit{h.units>1?"s":""}</span>
                          {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:9, color:T.gold, textDecoration:"none", padding:"1px 5px", border:"1px solid rgba(212,168,67,0.3)", borderRadius:4, fontWeight:600 }}>{getLinkLabel(p.emaarUrl)}</a>}
                        </div>
                      </div>
                      <span style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:"rgba(16,185,129,0.12)", color:T.green, fontWeight:700 }}>+{gain}%</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                      <div><div style={{ fontSize:9, color:T.textMuted }}>INVESTED</div><div style={{ fontSize:14, fontWeight:700, color:T.gold }}>AED {(h.investedAmount/1e6).toFixed(2)}M</div></div>
                      <div><div style={{ fontSize:9, color:T.textMuted }}>PROJECTED</div><div style={{ fontSize:14, fontWeight:700, color:T.green }}>AED {(projected/1e6).toFixed(2)}M</div></div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:T.surfaceAlt, color:T.textMuted }}>{p.handover}</span>
                      {(() => { const cd=getHandoverCountdown(p.handover); return cd?<span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, fontWeight:700, color:cd.passed?"#10B981":cd.color, background:cd.passed?"rgba(16,185,129,0.1)":cd.urgent?"rgba(239,68,68,0.1)":"rgba(212,168,67,0.08)" }}>{cd.passed?"✓ Ready":"⏱ "+cd.label}</span>:null; })()}
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:T.surfaceAlt, color:T.textMuted }}>AED {p.ppsf}/sqft</span>
                      {p.branded && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(212,168,67,0.12)", color:T.gold }}>{p.brand}</span>}
                    </div>
                    {h.notes && <div style={{ fontSize:10, color:T.textMuted, fontStyle:"italic", marginBottom:6 }}>{h.notes}</div>}
                    {p.construction > 0 && (
                      <div style={{ marginBottom:6 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:T.textMuted, marginBottom:3 }}><span>Construction</span><span>{p.construction}%</span></div>
                        <div style={{ height:4, borderRadius:2, background:T.surfaceAlt }}><div style={{ height:"100%", borderRadius:2, background:T.teal, width:`${p.construction}%` }} /></div>
                      </div>
                    )}
                    <button type="button" onClick={() => removeFromPortfolio(h.projectId, h.unitType)} style={{ marginTop:4, background:"none", border:"none", color:T.textMuted, fontSize:10, cursor:"pointer", padding:0 }}>Remove</button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white, marginBottom:8 }}>Start Tracking Your Investments</div>
            <div style={{ fontSize:12, color:T.textMuted, maxWidth:360, margin:"0 auto 16px", lineHeight:1.6 }}>Add your Emaar property investments to track performance, projected returns, and portfolio allocation.</div>
            <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ padding:"10px 24px", background:`linear-gradient(135deg, ${T.gold}, #B8912F)`, color:T.bg, border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ Add Your First Investment</button>
          </div>
        )}
      </Section>

      <Section title="Project Portfolio" sub="48 active projects · 10+ master communities · 2026–2030">
        <div style={{ display:"grid", gap:12, marginTop:16 }}>
          <KPI label="Total Projects"    value={activeProjects.length}   sub="18 under construction · 30 off-plan" delay={1} onClick={() => setSelectedKPI({ label:"Total Projects", value:"48", color:T.gold, description:"48 active Emaar projects across UAE.", source:"DXB Analytics Project Database", sourceUrl:"#", items:[{label:"Under Construction",value:"18",note:"Active building"},{label:"Off-Plan",value:"30",note:"Pre-launch / launched"},{label:"Communities",value:"11",note:"Master-planned areas"}], trend:null })} />
          <KPI label="Branded Projects"  value="10"                      sub="Address · Vida · Palace"            delay={2} />
          <KPI label="Avg Starting Price" value="AED 2.76M"              sub="Range: 1.2M – 13.8M"               delay={3} />
          <KPI label="Avg Price/sqft"    value="AED 2,570"               sub="Across all tiers"                  delay={4} />
        </div>
      </Section>

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:16, marginTop:20 }}>
        <Chart title="Projects by Community">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={communityProjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill:T.textMuted, fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="full" tick={{ fill:T.textSecondary, fontSize:11 }} width={140} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="projects" fill={T.gold} name="Projects" radius={[0,8,8,0]} barSize={20}>
                {communityProjects.map((c, i) => <Cell key={i} fill={i===0?T.gold:i<3?T.teal:T.blue} opacity={1 - i*0.06} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <div>
          <h3 style={{ fontSize:11, fontWeight:600, color:T.goldLight, letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>Delivery Schedule</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["2026","7",T.teal],["2027","5",T.gold],["2028","10",T.blue],["2029","26",T.purple]].map(([yr,ct,cl],i) => (
              <div key={i} style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:16, textAlign:"center" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:cl }}>{yr}</div>
                <div style={{ fontSize:12, color:T.textSecondary }}>{ct} projects</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Section title="Community Details" sub="Yield ranges and pricing per community">
        <div style={{ overflowX:"auto", marginTop:12 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {["Community","Projects","Yield Range","Avg Price/sqft"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", color:T.gold, fontWeight:600, fontSize:11, letterSpacing:0.5, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {communityProjects.map((c, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, transition:"background 0.2s", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => { const comm = emaarCommunities.find(x => x.name === c.full); if(comm) setSelectedCommunity(comm.name); }}>
                  <td style={{ padding:"12px 14px", color:T.white, fontWeight:500 }}>{c.full}</td>
                  <td style={{ padding:"12px 14px", color:T.goldLight, fontFamily:"'Fraunces',serif", fontWeight:600 }}>{c.projects}</td>
                  <td style={{ padding:"12px 14px", color:T.teal }}>{c.yield}</td>
                  <td style={{ padding:"12px 14px", color:T.textSecondary }}>AED {c.ppsf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Investment Allocation Guide" sub="Strategy by buyer profile · Based on market research">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12, marginTop:16 }}>
          {[
            ["Yield Seeker",           "AED 1.2M–2.5M",  "Target: 5-6% gross yield. Best picks: The Valley 3BR townhouses, Emaar South 1BR apartments, Dubai Hills Estate 1BR. Payment plans (80/20) maximize leveraged returns. Hold 3-5 years minimum.",             T.teal,   "DHE · ES · TV"],
            ["Capital Growth",         "AED 2.5M–5M",    "Target: 15-25% appreciation by handover. Best picks: Dubai Creek Harbour waterfront, Grand Polo Club villas, Emaar Beachfront 2BR. Buy early in launch phase for maximum upside.",                         T.gold,   "DCH · GPC · EBF"],
            ["Ultra-Luxury / Golden Visa","AED 5M+",     "Target: Lifestyle + 2M+ Golden Visa. Best picks: The Oasis villas, Address branded residences, Palace at Business Bay. Branded premium justifies pricing and resale.",                                       T.purple, "TO · BB · EBF"],
            ["Diversified Portfolio",  "AED 3M–10M",     "Split: 40% yield (Valley/South), 35% growth (Creek/Polo), 25% luxury (Beachfront/Oasis). Balances cash flow with appreciation. Rebalance at handover milestones.",                                          T.blue,   "Mixed"],
          ].map(([profile, budget, desc, color, areas], i) => (
            <div key={i} style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:16, animationDelay:`${i*0.05}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color }}>{profile}</span>
                <span style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:T.surfaceAlt, color:T.textSecondary }}>{budget}</span>
              </div>
              <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.6, marginBottom:8 }}>{desc}</div>
              <div style={{ fontSize:10, color, fontWeight:600 }}>Best communities: {areas}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );

  return (
    <>
      {/* Mode toggle (only when there are holdings) */}
      {myPortfolio.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {[["summary","📊 Summary"],["roi","💰 ROI Analysis"],["cashflow","📈 Cash Flow"],["holdings","🏠 Holdings"]].map(([v,l]) => (
            <button key={v} type="button" onClick={() => setRoiMode(v)}
              style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${roiMode===v?T.gold:T.border}`, background:roiMode===v?"rgba(212,168,67,0.12)":T.surfaceAlt, color:roiMode===v?T.gold:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{l}</button>
          ))}
        </div>
      )}

      {roiMode === "roi"      && myPortfolio.length > 0 && <RoiView />}
      {roiMode === "cashflow" && myPortfolio.length > 0 && <CashFlowView />}
      {(roiMode === "holdings" || roiMode === "summary" || myPortfolio.length === 0) && <HoldingsView />}

      <TabSources sources={[
        { label:"Firebase Firestore (live user data)" },
        { label:"DLD Rental Index", url:"https://dubailand.gov.ae" },
        { label:"REIDIN 2025",      url:"https://reidin.com" },
        { label:"UAE Central Bank (EIBOR)", url:"https://www.cbuae.gov.ae" },
      ]} />
    </>
  );
};

export default PortfolioTab;
