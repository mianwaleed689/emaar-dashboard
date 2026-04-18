/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — STR vs LTR TAB
   Short-term vs long-term rental yield comparison + calculator
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function STRvsLTRTab({ liveSTRData, strCommunity, setStrCommunity, strBeds, setStrBeds, strView, setStrView, strCalcPrice, setStrCalcPrice, strCalcSize, setStrCalcSize, strCalcNightly, setStrCalcNightly, strCalcOccupancy, setStrCalcOccupancy, strCalcMgmt, setStrCalcMgmt, strCalcLTR, setStrCalcLTR, globalFilters = {}, allDevelopers = [] }) {

  /* Phase 2.4 Batch 7: sync strCommunity to top-bar community filter.
     Also derive matcher to narrow rawSTR rows by developer/community. */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? globalFilters.community : null;
  React.useEffect(() => {
    if (gfCommunity && strCommunity !== gfCommunity) setStrCommunity(gfCommunity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gfCommunity]);

  const strGfDev = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev))
    : null;
  const strGfCommunities = (strGfDev && Array.isArray(strGfDev.communities) && strGfDev.communities.length > 0)
    ? new Set(strGfDev.communities.map(c => String(c).toLowerCase())) : null;
  const strMatchesGlobalFilter = (row) => {
    if (!row) return false;
    const rowCommunity = String(row.community || "").toLowerCase();
    if (gfDev && strGfCommunities && !strGfCommunities.has(rowCommunity)) return false;
    if (gfCommunity && rowCommunity !== String(gfCommunity).toLowerCase()) return false;
    return true;
  };


            /* ══ RESEARCH-BASED SEED DATA 2026 ══
               Sources: DTCM, AirROI, Airbtics, homevy.com, maphomesrealestate.com
               ADR median Dubai: AED 609/night (Airbtics 2026)
               Median occupancy: 72% (Airbtics 2026)
               STR yields: 7-12% vs LTR 4-6% (homevy.com)
               DTCM license: AED 1,500-2,500/year
               Management fee STR: 15-25% of revenue
            ══════════════════════════════════════ */
            const SEED_STR = [
              { id:"s01", community:"Downtown Dubai",      strNightly:850,  strOccupancy:76, ltrAnnual:175000, strGross:11.2, ltrGross:5.5, strNet:8.1, ltrNet:3.8, beds:"1BR", dtcmAllowed:true,  mgmtFee:20, strCosts:28000, verdict:"STR",    note:"Burj Khalifa proximity drives premium rates. Peak Dec-Mar occupancy 90%+" },
              { id:"s02", community:"Dubai Marina",        strNightly:680,  strOccupancy:74, ltrAnnual:115000, strGross:10.8, ltrGross:6.8, strNet:7.6, ltrNet:5.0, beds:"1BR", dtcmAllowed:true,  mgmtFee:20, strCosts:22000, verdict:"STR",    note:"Marina Walk tourists + business travelers. Strong year-round demand." },
              { id:"s03", community:"Palm Jumeirah",       strNightly:1200, strOccupancy:70, ltrAnnual:220000, strGross:9.8,  ltrGross:5.5, strNet:7.0, ltrNet:3.9, beds:"1BR", dtcmAllowed:true,  mgmtFee:22, strCosts:38000, verdict:"STR",    note:"Luxury tourism demand. High costs but premium pricing supports STR." },
              { id:"s04", community:"JBR / The Walk",      strNightly:720,  strOccupancy:73, ltrAnnual:125000, strGross:11.0, ltrGross:6.5, strNet:7.8, ltrNet:4.8, beds:"1BR", dtcmAllowed:true,  mgmtFee:20, strCosts:23000, verdict:"STR",    note:"Beach access. Tourist zone. Strong summer STR from GCC visitors." },
              { id:"s05", community:"Business Bay",        strNightly:580,  strOccupancy:71, ltrAnnual:85000,  strGross:10.2, ltrGross:7.6, strNet:7.1, ltrNet:5.8, beds:"1BR", dtcmAllowed:true,  mgmtFee:18, strCosts:18000, verdict:"STR",    note:"Corporate travelers. Weekday demand strong. Mix of STR/LTR works." },
              { id:"s06", community:"Jumeirah Village Circle", strNightly:320, strOccupancy:68, ltrAnnual:72000, strGross:8.8, ltrGross:7.8, strNet:6.0, ltrNet:6.4, beds:"1BR", dtcmAllowed:true, mgmtFee:18, strCosts:14000, verdict:"LTR",   note:"Resident community. LTR wins — lower STR demand, high LTR occupancy." },
              { id:"s07", community:"Dubai Hills Estate",  strNightly:480,  strOccupancy:62, ltrAnnual:105000, strGross:7.8,  ltrGross:6.2, strNet:5.1, ltrNet:4.9, beds:"2BR", dtcmAllowed:true,  mgmtFee:20, strCosts:20000, verdict:"LTR",    note:"Family suburb. Residents prefer LTR. STR inconsistent occupancy." },
              { id:"s08", community:"Jumeirah Lake Towers",strNightly:450,  strOccupancy:72, ltrAnnual:80000,  strGross:10.4, ltrGross:8.1, strNet:7.2, ltrNet:6.5, beds:"1BR", dtcmAllowed:true,  mgmtFee:18, strCosts:16000, verdict:"STR",    note:"Near Marina. Corporate + leisure mix. STR edges LTR at good occupancy." },
              { id:"s09", community:"Dubai Creek Harbour", strNightly:520,  strOccupancy:65, ltrAnnual:95000,  strGross:8.5,  ltrGross:6.0, strNet:5.8, ltrNet:4.8, beds:"1BR", dtcmAllowed:true,  mgmtFee:19, strCosts:18000, verdict:"Mixed",  note:"Growing community. Tourism developing. LTR safer until more hotels." },
              { id:"s10", community:"Arjan",               strNightly:260,  strOccupancy:60, ltrAnnual:63000,  strGross:7.2,  ltrGross:7.5, strNet:4.8, ltrNet:6.1, beds:"1BR", dtcmAllowed:true,  mgmtFee:18, strCosts:12000, verdict:"LTR",    note:"No tourist demand. LTR clearly wins. Mid-market residents dominate." },
            ];

            const rawSTRAll = liveSTRData?.length > 0 ? liveSTRData : SEED_STR;
            // Phase 2.4 Batch 7: apply top-bar global filter
            const rawSTR = rawSTRAll.filter(strMatchesGlobalFilter);
            const filtered = rawSTR.filter(d => {
              if (strCommunity !== "All" && d.community !== strCommunity) return false;
              if (strBeds !== "All" && d.beds !== strBeds) return false;
              return true;
            });

            const communities = ["All", ...new Set(rawSTR.map(d => d.community))];
            const bedOptions  = ["All", "Studio", "1BR", "2BR", "3BR"];

            /* ── Calculator ── */
            const calcSTRRevenue  = Math.round(strCalcNightly * 365 * (strCalcOccupancy/100));
            const calcSTRMgmt     = Math.round(calcSTRRevenue * (strCalcMgmt/100));
            const calcSTRDTCM     = 2000;
            const calcSTRFurnish  = Math.round(strCalcSize * 50 / 5); // amortized 5yr
            const calcSTRNet      = calcSTRRevenue - calcSTRMgmt - calcSTRDTCM - calcSTRFurnish;
            const calcSTRYield    = (calcSTRNet / strCalcPrice * 100).toFixed(1);
            const calcLTRNet      = Math.round(strCalcLTR * 0.85); // after vacancy/costs
            const calcLTRYield    = (calcLTRNet / strCalcPrice * 100).toFixed(1);
            const strWins         = calcSTRNet > calcLTRNet;
            const diff            = Math.abs(calcSTRNet - calcLTRNet);

            const verdictColor = { "STR":"#10B981", "LTR":T.teal, "Mixed":T.gold };
            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>STR vs LTR Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>Airbnb vs long-term · DTCM costs · Break-even · Community verdict · 2026</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["comparison","calculator"].map(v => (
                      <button key={v} type="button" onClick={() => setStrView(v)}
                        style={{ padding:"6px 14px", background:strView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${strView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:strView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key insight banner */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                  {[
                    { color:"#10B981", bg:"rgba(16,185,129,0.06)", border:"rgba(16,185,129,0.25)", icon:"\uD83C\uDFD6", title:"STR Gross Yield", val:"7–12%", sub:"Tourist zones. Active management." },
                    { color:T.teal,    bg:"rgba(20,184,166,0.06)", border:"rgba(20,184,166,0.25)", icon:"\uD83C\uDFE0", title:"LTR Gross Yield", val:"4–8%",  sub:"Resident zones. Passive income." },
                    { color:T.gold,    bg:"rgba(212,168,67,0.06)", border:"rgba(212,168,67,0.2)",  icon:"⚖", title:"STR Net vs LTR", val:"Varies", sub:"Net yields often similar after costs." },
                  ].map((b,i) => (
                    <div key={i} style={{ padding:"14px 16px", background:b.bg, border:`1px solid ${b.border}`, borderRadius:10 }}>
                      <div style={{ fontSize:18, marginBottom:6 }}>{b.icon}</div>
                      <div style={{ fontSize:11, color:b.color, fontWeight:700, marginBottom:2 }}>{b.title}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:b.color, marginBottom:4 }}>{b.val}</div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{b.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <select value={strCommunity} onChange={e => setStrCommunity(e.target.value)} style={selSt}>
                    {communities.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={strBeds} onChange={e => setStrBeds(e.target.value)} style={selSt}>
                    {bedOptions.map(b => <option key={b}>{b}</option>)}
                  </select>
                  <span style={{ marginLeft:"auto", fontSize:11, color:T.textMuted }}>{filtered.length} communities</span>
                </div>

                {/* COMPARISON VIEW */}
                {strView === "comparison" && (
                  <>
                    {/* Community comparison table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Community","Beds","STR Nightly","Occupancy","STR Gross","LTR Gross","STR Net","Verdict"].map((h,i) => (
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                        ))}
                      </div>
                      {filtered.map((d,i) => (
                        <div key={d.id} style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.community}</div>
                            <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{d.note?.substring(0,50)}...</div>
                          </div>
                          <div style={{ fontSize:12, color:T.textMuted }}>{d.beds}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.white }}>AED {d.strNightly}/night</div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:d.strOccupancy>=75?T.green:d.strOccupancy>=65?T.gold:"#F97316" }}>{d.strOccupancy}%</div>
                            <div style={{ height:4, borderRadius:2, background:T.border, marginTop:3 }}>
                              <div style={{ height:"100%", width:`${d.strOccupancy}%`, background:d.strOccupancy>=75?T.green:d.strOccupancy>=65?T.gold:"#F97316", borderRadius:2 }} />
                            </div>
                          </div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:"#10B981" }}>{d.strGross}%</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:T.teal }}>{d.ltrGross}%</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.gold }}>{d.strNet}%</div>
                          <div>
                            <span style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:(verdictColor[d.verdict]||T.gold)+"22", color:verdictColor[d.verdict]||T.gold, fontWeight:700 }}>
                              {d.verdict === "STR" ? "\uD83C\uDFD6 STR Wins" : d.verdict === "LTR" ? "\uD83C\uDFE0 LTR Wins" : "⚖ Mixed"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DTCM Cost Breakdown */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>STR Annual Costs (DTCM)</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>What eats your Airbnb income — based on AED 1M property</div>
                        {[
                          { label:"DTCM Holiday Home License", val:"AED 1,500–2,500/yr", color:T.red    },
                          { label:"Management Fee (15-25%)",   val:"AED 15,000–25,000/yr", color:T.red  },
                          { label:"Furnishing (amortized)",    val:"AED 8,000–15,000/yr", color:"#F97316"},
                          { label:"Cleaning per turnover",     val:"AED 150–300/clean",   color:"#F97316"},
                          { label:"Tourism Dirham fee",        val:"AED 15/night occupied",color:"#F97316"},
                          { label:"Platform fee (Airbnb)",     val:"3% of revenue",        color:"#F97316"},
                          { label:"Municipality fee (DEWA)",   val:"5% of annual rent",    color:T.textMuted },
                          { label:"Utilities (if included)",   val:"AED 6,000–18,000/yr", color:T.textMuted },
                        ].map((r,i) => (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<7?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:12, color:T.textMuted }}>{r.label}</span>
                            <span style={{ fontSize:12, fontWeight:600, color:r.color }}>{r.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>When STR Beats LTR</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Location is the key decision — not personal preference</div>
                        {[
                          { icon:"✅", label:"Tourist/lifestyle zone", sub:"Downtown, Marina, Palm, JBR", model:"STR", color:"#10B981" },
                          { icon:"✅", label:"Occupancy stays above 65%", sub:"Peak months sustained year-round", model:"STR", color:"#10B981" },
                          { icon:"✅", label:"Corporate/business area", sub:"Business Bay, DIFC, JLT", model:"STR", color:"#10B981" },
                          { icon:"\uD83C\uDFE0", label:"Family/residential suburb", sub:"JVC, Dubai Hills, Arabian Ranches", model:"LTR", color:T.teal },
                          { icon:"\uD83C\uDFE0", label:"No tourist demand", sub:"Arjan, DSO, Al Furjan", model:"LTR", color:T.teal },
                          { icon:"\uD83C\uDFE0", label:"Passive investor", sub:"No active management capability", model:"LTR", color:T.teal },
                          { icon:"⚖", label:"Mixed-use communities", sub:"Creek Harbour, MBR City", model:"Hybrid", color:T.gold },
                        ].map((r,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<6?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:16 }}>{r.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:T.white }}>{r.label}</div>
                              <div style={{ fontSize:11, color:T.textMuted }}>{r.sub}</div>
                            </div>
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:r.color+"22", color:r.color, fontWeight:700 }}>{r.model}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Seasonality */}
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>STR Seasonality — Dubai 2026</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>ADR and occupancy swing 30-50% between peak and low season</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:4 }}>
                        {[
                          {m:"Jan",occ:82,adr:720,peak:true},{m:"Feb",occ:85,adr:750,peak:true},
                          {m:"Mar",occ:80,adr:680,peak:true},{m:"Apr",occ:72,adr:580,peak:false},
                          {m:"May",occ:65,adr:480,peak:false},{m:"Jun",occ:58,adr:380,peak:false},
                          {m:"Jul",occ:55,adr:350,peak:false},{m:"Aug",occ:52,adr:320,peak:false},
                          {m:"Sep",occ:62,adr:420,peak:false},{m:"Oct",occ:75,adr:600,peak:true},
                          {m:"Nov",occ:82,adr:700,peak:true},{m:"Dec",occ:88,adr:780,peak:true},
                        ].map((mo,i) => (
                          <div key={i} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:9, color:T.textMuted, marginBottom:4 }}>{mo.m}</div>
                            <div style={{ height:60, borderRadius:4, background:T.border, position:"relative", overflow:"hidden" }}>
                              <div style={{ position:"absolute", bottom:0, width:"100%", height:`${mo.occ}%`, background:mo.peak?"#10B981":"#3B82F6", opacity:0.8 }} />
                            </div>
                            <div style={{ fontSize:9, fontWeight:700, color:mo.peak?"#10B981":"#3B82F6", marginTop:4 }}>{mo.occ}%</div>
                            <div style={{ fontSize:8, color:T.textMuted }}>AED {mo.adr}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:16, marginTop:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:10, height:10, borderRadius:2, background:"#10B981" }} /><span style={{ fontSize:10, color:T.textMuted }}>Peak Season (Oct-Mar)</span></div>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:10, height:10, borderRadius:2, background:"#3B82F6" }} /><span style={{ fontSize:10, color:T.textMuted }}>Low Season (Apr-Sep)</span></div>
                      </div>
                    </div>
                  </>
                )}

                {/* CALCULATOR VIEW */}
                {strView === "calculator" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    <div className="chart-box" style={{ padding:24 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:4 }}>STR vs LTR Break-Even Calculator</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>Compare your specific property's returns</div>
                      {[
                        { label:"Purchase Price (AED)",        val:strCalcPrice,    min:400000, max:10000000, step:50000,  set:setStrCalcPrice,    fmt:v=>"AED "+v.toLocaleString() },
                        { label:"Nightly STR Rate (AED)",      val:strCalcNightly,  min:100,    max:3000,     step:50,     set:setStrCalcNightly,  fmt:v=>"AED "+v+"/night" },
                        { label:"STR Occupancy (%)",           val:strCalcOccupancy,min:20,     max:95,       step:1,      set:setStrCalcOccupancy,fmt:v=>v+"%" },
                        { label:"Management Fee (%)",          val:strCalcMgmt,     min:10,     max:30,       step:1,      set:setStrCalcMgmt,     fmt:v=>v+"%" },
                        { label:"LTR Annual Rent (AED)",       val:strCalcLTR,      min:20000,  max:500000,   step:5000,   set:setStrCalcLTR,      fmt:v=>"AED "+v.toLocaleString() },
                        { label:"Property Size (sqft)",        val:strCalcSize,     min:200,    max:5000,     step:50,     set:setStrCalcSize,     fmt:v=>v+" sqft" },
                      ].map((f,i) => (
                        <div key={i} style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{f.label}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{f.fmt(f.val)}</span>
                          </div>
                          <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                            onChange={e => f.set(Number(e.target.value))}
                            style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:24 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:20 }}>Results</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                        {[
                          { label:"STR Revenue",   val:"AED "+calcSTRRevenue.toLocaleString(), color:"#10B981", sub:"gross before costs" },
                          { label:"STR Mgmt Fee",  val:"AED "+calcSTRMgmt.toLocaleString(),    color:T.red,     sub:"operator fee" },
                          { label:"STR DTCM+Misc", val:"AED "+calcSTRDTCM.toLocaleString(),    color:T.red,     sub:"license + tourism dirham" },
                          { label:"STR Net Income",val:"AED "+calcSTRNet.toLocaleString(),      color:"#10B981", sub:"what you keep" },
                          { label:"LTR Annual Rent",val:"AED "+strCalcLTR.toLocaleString(),    color:T.teal,    sub:"gross rent" },
                          { label:"LTR Net Income", val:"AED "+calcLTRNet.toLocaleString(),     color:T.teal,    sub:"after vacancy/costs" },
                        ].map((r,i) => (
                          <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>{r.label}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:r.color }}>{r.val}</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{r.sub}</div>
                          </div>
                        ))}
                      </div>
                      {/* Verdict */}
                      <div style={{ padding:"18px 20px", background:strWins?"rgba(16,185,129,0.08)":"rgba(20,184,166,0.08)", border:`1px solid ${strWins?"rgba(16,185,129,0.3)":"rgba(20,184,166,0.3)"}`, borderRadius:12 }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:strWins?"#10B981":T.teal, marginBottom:6 }}>
                          {strWins ? "\uD83C\uDFD6 STR Wins" : "\uD83C\uDFE0 LTR Wins"}
                        </div>
                        <div style={{ fontSize:13, color:T.textSecondary, marginBottom:8 }}>
                          {strWins ? "STR" : "LTR"} generates <strong style={{ color:strWins?"#10B981":T.teal }}>AED {diff.toLocaleString()}</strong> more per year
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:9, color:T.textMuted }}>STR YIELD</div><div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:"#10B981" }}>{calcSTRYield}%</div></div>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:9, color:T.textMuted }}>LTR YIELD</div><div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.teal }}>{calcLTRYield}%</div></div>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:9, color:T.textMuted }}>GAP</div><div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>{Math.abs(Number(calcSTRYield)-Number(calcLTRYield)).toFixed(1)}%</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources */}
                {!liveSTRData?.length && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:T.gold, display:"inline-block" }} />
                    <span style={{ fontSize:11, color:T.textMuted }}><span style={{ color:T.gold, fontWeight:700 }}>2026 research data</span> — DTCM, Airbtics, homevy.com, maphomesrealestate.com, AirROI Feb 2025-Jan 2026</span>
                  </div>
                )}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["DTCM 2026","Airbtics Jan 2026","AirROI Feb-Jan 2026","homevy.com Apr 2026","Cavendish Maxwell"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default STRvsLTRTab;
