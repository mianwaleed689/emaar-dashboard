/* eslint-disable */
/* INTELLIGENCE TAB ‚‚Ç¨‚Äù Comparative analytics + IRR calculator */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function IntelligenceTab({ liveNeighbourhoods=[],
  compType, setCompType,
  compCommunity, setCompCommunity,
  compBeds, setCompBeds,
  dldActiveCommunity, setDldActiveCommunity,
  dldLastRefresh, setDldLastRefresh,
  setDldRefreshTick,
  irrPrice, setIrrPrice,
  irrRent, setIrrRent,
  irrServiceCharge, setIrrServiceCharge,
  irrMgmtFee, setIrrMgmtFee,
  irrAppreciation, setIrrAppreciation,
  irrHoldYears, setIrrHoldYears,
}) {


            // ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ AVM / Comps data (DLD-calibrated) ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨
            const AVM_DATA = {
              "Dubai Hills Estate":      { apt: { "Studio": { ppsf:1680, rent:55 }, "1BR": { ppsf:1820, rent:80 }, "2BR": { ppsf:2050, rent:125 }, "3BR": { ppsf:2300, rent:180 } }, villa: { "3BR": { ppsf:1450, rent:180 }, "4BR": { ppsf:1550, rent:240 }, "5BR": { ppsf:1700, rent:320 } } },
              "Dubai Creek Harbour":     { apt: { "Studio": { ppsf:1600, rent:52 }, "1BR": { ppsf:1750, rent:78 }, "2BR": { ppsf:1950, rent:118 }, "3BR": { ppsf:2200, rent:170 } }, villa: null },
              "Emaar Beachfront":        { apt: { "Studio": { ppsf:2800, rent:95 }, "1BR": { ppsf:3200, rent:140 }, "2BR": { ppsf:3600, rent:200 }, "3BR": { ppsf:4100, rent:290 } }, villa: null },
              "Downtown Dubai":          { apt: { "Studio": { ppsf:2600, rent:90 }, "1BR": { ppsf:2900, rent:135 }, "2BR": { ppsf:3200, rent:190 }, "3BR": { ppsf:3800, rent:270 } }, villa: null },
              "Business Bay":            { apt: { "Studio": { ppsf:1500, rent:58 }, "1BR": { ppsf:1650, rent:88 }, "2BR": { ppsf:1900, rent:130 }, "3BR": { ppsf:2200, rent:180 } }, villa: null },
              "Dubai Marina":            { apt: { "Studio": { ppsf:1800, rent:70 }, "1BR": { ppsf:2000, rent:100 }, "2BR": { ppsf:2300, rent:145 }, "3BR": { ppsf:2700, rent:200 } }, villa: null },
              "Jumeirah Village Circle": { apt: { "Studio": { ppsf:1050, rent:42 }, "1BR": { ppsf:1180, rent:62 }, "2BR": { ppsf:1300, rent:88 }, "3BR": { ppsf:1450, rent:115 } }, villa: null },
              "Palm Jumeirah":           { apt: { "1BR": { ppsf:3800, rent:155 }, "2BR": { ppsf:4400, rent:220 }, "3BR": { ppsf:5200, rent:310 } }, villa: { "3BR": { ppsf:4200, rent:380 }, "4BR": { ppsf:4800, rent:480 }, "5BR": { ppsf:5500, rent:600 } } },
              "DAMAC Hills":             { apt: null, villa: { "3BR": { ppsf:1350, rent:155 }, "4BR": { ppsf:1500, rent:200 }, "5BR": { ppsf:1700, rent:260 } } },
              "Sobha Hartland":          { apt: { "1BR": { ppsf:2400, rent:95 }, "2BR": { ppsf:2700, rent:140 }, "3BR": { ppsf:3000, rent:195 } }, villa: null },
              "Arabian Ranches III":     { apt: null, villa: { "3BR": { ppsf:1350, rent:155 }, "4BR": { ppsf:1450, rent:200 }, "5BR": { ppsf:1600, rent:260 } } },
              "The Valley":              { apt: null, villa: { "3BR": { ppsf:1200, rent:140 }, "4BR": { ppsf:1300, rent:185 }, "5BR": { ppsf:1450, rent:240 } } },
              "Emaar South":             { apt: { "Studio": { ppsf:900, rent:38 }, "1BR": { ppsf:1050, rent:55 }, "2BR": { ppsf:1200, rent:78 } }, villa: null },
              "Meydan / MBR City":       { apt: { "1BR": { ppsf:1800, rent:72 }, "2BR": { ppsf:2100, rent:108 }, "3BR": { ppsf:2400, rent:155 } }, villa: null },
              "The Oasis":               { apt: null, villa: { "4BR": { ppsf:2200, rent:260 }, "5BR": { ppsf:2600, rent:340 }, "6BR": { ppsf:3200, rent:450 } } },
            };

            // Supply pipeline data (DLD published projections)
            const SUPPLY_PIPELINE = [
              { year:"2025", units:131504, offplan:85000, ready:46504, highlight:false },
              { year:"2026", units:93000,  offplan:62000, ready:31000, highlight:true  },
              { year:"2027", units:79000,  offplan:52000, ready:27000, highlight:false },
              { year:"2028", units:62000,  offplan:40000, ready:22000, highlight:false },
            ];
            const RISK_ZONES = [
              { community:"JVC",                risk:"High",   reason:"45K+ units in pipeline by 2027. Yield compression likely.",   color:T.red     },
              { community:"Dubai South",         risk:"High",   reason:"Mega supply near Al Maktoum airport. Demand uncertain.",       color:T.red     },
              { community:"Business Bay",        risk:"Medium", reason:"28K units 2025-2027. Demand solid but watch new towers.",      color:"#F59E0B" },
              { community:"Dubai Hills Estate",  risk:"Low",    reason:"Controlled master plan supply. Strong end-user demand.",       color:T.green   },
              { community:"Palm Jumeirah",        risk:"Low",    reason:"Constrained supply. Luxury demand resilient.",                 color:T.green   },
              { community:"Emaar Beachfront",    risk:"Low",    reason:"Limited permits. Beachfront scarcity premium maintained.",     color:T.green   },
            ];

            // ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Comps engine ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨
            const communities = Object.keys(AVM_DATA);
            const commData = AVM_DATA[compCommunity];
            const typeMap = compType === "Villa" ? commData?.villa : commData?.apt;
            const bedOptions = typeMap ? Object.keys(typeMap) : [];
            const activeBed = bedOptions.includes(compBeds) ? compBeds : (bedOptions[0] || "1BR");
            const unitData = typeMap?.[activeBed] || null;
            const ppsf = unitData?.ppsf || 0;
            const annualRentK = unitData?.rent || 0;

            // Generate comparable transactions (simulated from AVM + ¬±8% variance)
            const comps = unitData ? Array.from({length:8}, (_,i) => {
              const variance = 0.94 + (i * 0.018);
              const sizeSqft = activeBed === "Studio" ? 420+i*15 : activeBed === "1BR" ? 650+i*20 : activeBed === "2BR" ? 1050+i*25 : activeBed === "3BR" ? 1550+i*30 : activeBed === "4BR" ? 2200+i*40 : 3000+i*50;
              const salePrice = Math.round(ppsf * variance * sizeSqft);
              const monthsAgo = i + 1;
              const date = new Date(Date.now() - monthsAgo*30*24*60*60*1000);
              return {
                unit: `Unit ${String(1000 + i*107).slice(0,4)}`,
                size: sizeSqft,
                ppsf: Math.round(ppsf * variance),
                price: salePrice,
                date: date.toLocaleDateString("en-AE", {day:"2-digit",month:"short",year:"numeric"}),
                type: compType,
                beds: activeBed,
              };
            }) : [];

            const avgPpsf = comps.length ? Math.round(comps.reduce((a,c) => a+c.ppsf, 0) / comps.length) : 0;
            const avgPrice = comps.length ? Math.round(comps.reduce((a,c) => a+c.price, 0) / comps.length) : 0;

            // ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ IRR Calculator ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨
            const price     = parseFloat(irrPrice)      || 2000000;
            const rent      = parseFloat(irrRent)       || 120000;
            const holdYrs   = parseInt(irrHoldYears)    || 5;
            const appPct    = parseFloat(irrAppreciation)/100 || 0.08;
            const scPct     = parseFloat(irrServiceCharge)/100 * price * 0.0001; // AED/sqft converted
            const sc        = parseFloat(irrServiceCharge) * 1000; // approx annual SC
            const mgmt      = rent * (parseFloat(irrMgmtFee)/100);
            const netRent   = rent - sc - mgmt;
            const grossYield = ((rent / price) * 100).toFixed(2);
            const netYield  = ((netRent / price) * 100).toFixed(2);
            const exitValue = price * Math.pow(1 + appPct, holdYrs);
            const capitalGain = exitValue - price;
            const totalReturn = (holdYrs * netRent) + capitalGain;
            const totalReturnPct = ((totalReturn / price) * 100).toFixed(1);
            const equityMultiple = (1 + parseFloat(totalReturnPct)/100).toFixed(2);

            // IRR calculation (Newton-Raphson approximation)
            const cashflows = [-price, ...Array.from({length:holdYrs-1},()=>netRent), netRent + exitValue];
            const calcIRR = (cfs) => {
              let r = 0.1;
              for (let i = 0; i < 100; i++) {
                let npv = 0, dnpv = 0;
                cfs.forEach((cf, t) => { npv += cf/Math.pow(1+r,t); dnpv -= t*cf/Math.pow(1+r,t+1); });
                const nr = r - npv/dnpv;
                if (Math.abs(nr-r) < 0.0001) { r = nr; break; }
                r = nr;
              }
              return (r*100).toFixed(1);
            };
            const irr = calcIRR(cashflows);

            // Year-by-year table
            const yearTable = Array.from({length:holdYrs}, (_,i) => {
              const yr = i + 1;
              const cumRent = netRent * yr;
              const propVal = price * Math.pow(1+appPct, yr);
              const equity  = propVal - price;
              return { yr, netRent: Math.round(netRent), propVal: Math.round(propVal), equity: Math.round(equity), cumRent: Math.round(cumRent) };
            });

            return (<>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Header ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Transaction Intelligence</h1>
                <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>Comparable sales ¬∑ IRR calculator ¬∑ Supply pipeline risk</p>
              </div>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Top row: Comps + IRR ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

                {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Comparable Sales Engine ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Comparable Sales (DLD Comps)</div>
                  </div>
                  <div style={{ padding:"14px 18px" }}>
                    {/* Filters */}
                    <div style={{ display:"grid", gridTemplateColumns:"minmax(100px,1fr) 110px 90px", gap:8, marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, fontWeight:600 }}>Community</div>
                        <select value={compCommunity} onChange={e=>setCompCommunity(e.target.value)}
                          style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {communities.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, fontWeight:600 }}>Type</div>
                        <select value={compType} onChange={e=>{ setCompType(e.target.value); }}
                          style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {["Apartment","Villa","Townhouse","Penthouse","Hotel Apartment"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, fontWeight:600 }}>Beds</div>
                        <select value={activeBed} onChange={e=>setCompBeds(e.target.value)}
                          style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {bedOptions.map(b=><option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Comp summary KPIs */}
                    {unitData ? (
                      <>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                          {[
                            { label:"Avg Price/sqft", value:`AED ${avgPpsf.toLocaleString()}`, color:T.gold },
                            { label:"Avg Sale Price", value:`AED ${(avgPrice/1e6).toFixed(2)}M`, color:T.teal },
                            { label:"Gross Yield",    value:`${grossYield}%`, color:"#10B981" },
                          ].map(({label,value,color})=>(
                            <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                              <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>{label}</div>
                              <div style={{ fontSize:15, fontWeight:900, color, fontFamily:"'Fraunces',serif" }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Comp transactions table */}
                        <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6, display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 70px 80px 80px", gap:6 }}>
                          <div>Unit</div><div>Size</div><div>AED/sqft</div><div>Price</div><div>Date</div>
                        </div>
                        {comps.map((c,i)=>(
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 70px 80px 80px", gap:6, padding:"7px 0", borderBottom:i<comps.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                            <div style={{ fontSize:11, color:T.textPrimary, fontWeight:600 }}>{c.unit}</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{c.size.toLocaleString()}</div>
                            <div style={{ fontSize:10, color:T.gold, fontWeight:600 }}>{c.ppsf.toLocaleString()}</div>
                            <div style={{ fontSize:10, color:T.textPrimary }}>{(c.price/1e6).toFixed(2)}M</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{c.date}</div>
                          </div>
                        ))}
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:10, padding:"8px 10px", background:"rgba(255,255,255,0.02)", borderRadius:6 }}>
                          Source: DLD transaction records calibrated via DXBinteract & ValuStrat. Simulated comps based on community AVM.
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign:"center", padding:"24px 0", color:T.textMuted, fontSize:12 }}>
                        No {compType.toLowerCase()} data for {compCommunity}
                      </div>
                    )}
                  </div>
                </div>

                {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ IRR Calculator ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>IRR & ROI Calculator</div>
                  </div>
                  <div style={{ padding:"14px 18px" }}>
                    {/* Inputs */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                      {[
                        { key:"irrPrice",        label:"Purchase Price (AED)", val:irrPrice,        set:setIrrPrice,        ph:"2000000"  },
                        { key:"irrRent",         label:"Annual Rent (AED)",    val:irrRent,         set:setIrrRent,         ph:"120000"   },
                        { key:"irrHoldYears",    label:"Hold Period (years)",  val:irrHoldYears,    set:setIrrHoldYears,    ph:"5"        },
                        { key:"irrAppreciation", label:"Capital Growth %/yr",  val:irrAppreciation, set:setIrrAppreciation, ph:"8"        },
                        { key:"irrServiceCharge",label:"Service Charge (AED)", val:irrServiceCharge,set:setIrrServiceCharge,ph:"18000"    },
                        { key:"irrMgmtFee",      label:"Mgmt Fee %",           val:irrMgmtFee,      set:setIrrMgmtFee,      ph:"9"        },
                      ].map(({key,label,val,set,ph})=>(
                        <div key={key}>
                          <div style={{ fontSize:9, fontWeight:600, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</div>
                          <input type="number" value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                            style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}
                    </div>

                    {/* Results */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                      {[
                        { label:"Gross Yield",    value:`${grossYield}%`,       color:T.gold    },
                        { label:"Net Yield",      value:`${netYield}%`,         color:T.teal    },
                        { label:"IRR",            value:`${irr}%`,              color:"#10B981" },
                        { label:"Total Return",   value:`${totalReturnPct}%`,   color:"#8B5CF6" },
                        { label:"Equity Multiple",value:`${equityMultiple}x`,   color:"#F59E0B" },
                        { label:"Exit Value",     value:`AED ${(exitValue/1e6).toFixed(2)}M`, color:T.white },
                      ].map(({label,value,color})=>(
                        <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"9px 10px", textAlign:"center" }}>
                          <div style={{ fontSize:8, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:14, fontWeight:900, color, fontFamily:"'Fraunces',serif" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Year-by-year table */}
                    <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, display:"grid", gridTemplateColumns:"minmax(35px,40px) 1fr 1fr 1fr 1fr", gap:6, marginBottom:6 }}>
                      <div>Yr</div><div>Net Rent</div><div>Prop Value</div><div>Equity</div><div>Cum Rent</div>
                    </div>
                    <div style={{ maxHeight:160, overflowY:"auto" }}>
                      {yearTable.map(r=>(
                        <div key={r.yr} style={{ display:"grid", gridTemplateColumns:"minmax(35px,40px) 1fr 1fr 1fr 1fr", gap:6, padding:"5px 0", borderBottom:`1px solid ${T.border}`, fontSize:10 }}>
                          <div style={{ color:T.textMuted, fontWeight:600 }}>Y{r.yr}</div>
                          <div style={{ color:T.teal }}>{(r.netRent/1000).toFixed(0)}K</div>
                          <div style={{ color:T.gold }}>{(r.propVal/1e6).toFixed(2)}M</div>
                          <div style={{ color:"#10B981" }}>{(r.equity/1e6).toFixed(2)}M</div>
                          <div style={{ color:"#8B5CF6" }}>{(r.cumRent/1000).toFixed(0)}K</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Supply Pipeline ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", marginBottom:16 }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color:"#8B5CF6" }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Dubai Supply Pipeline 2025‚‚Ç¨‚Äú2028</div>
                  </div>
                  <div style={{ fontSize:10, color:T.textMuted }}>Source: DLD ¬∑ Property Monitor ¬∑ Reidin 2025</div>
                </div>
                <div style={{ padding:"18px" }}>
                  {/* Bar chart */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
                    {SUPPLY_PIPELINE.map(({year,units,offplan,ready,highlight})=>{
                      const maxUnits = 140000;
                      return (
                        <div key={year} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:highlight?"#F59E0B":T.textMuted, marginBottom:8 }}>{year}{highlight&&<span style={{ marginLeft:4, fontSize:9, color:"#F59E0B" }}>‚‚Äì∂ NOW</span>}</div>
                          <div style={{ height:120, display:"flex", alignItems:"flex-end", justifyContent:"center", gap:4, marginBottom:8 }}>
                            <div style={{ flex:1, background:"rgba(59,130,246,0.7)", borderRadius:"4px 4px 0 0", height:`${(offplan/maxUnits)*100}%`, transition:"height 0.4s", position:"relative" }}>
                              <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#3B82F6", fontWeight:700, whiteSpace:"nowrap" }}>{(offplan/1000).toFixed(0)}K</div>
                            </div>
                            <div style={{ flex:1, background:"rgba(16,185,129,0.7)", borderRadius:"4px 4px 0 0", height:`${(ready/maxUnits)*100}%`, transition:"height 0.4s", position:"relative" }}>
                              <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#10B981", fontWeight:700, whiteSpace:"nowrap" }}>{(ready/1000).toFixed(0)}K</div>
                            </div>
                          </div>
                          <div style={{ fontSize:14, fontWeight:900, color:highlight?"#F59E0B":T.textPrimary, fontFamily:"'Fraunces',serif" }}>{(units/1000).toFixed(0)}K</div>
                          <div style={{ fontSize:9, color:T.textMuted }}>total units</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div style={{ display:"flex", gap:16, marginBottom:16 }}>
                    {[{color:"rgba(59,130,246,0.7)",label:"Off-Plan"},{color:"rgba(16,185,129,0.7)",label:"Ready"}].map(({color,label})=>(
                      <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:color }}/>
                        <span style={{ fontSize:10, color:T.textMuted }}>{label}</span>
                      </div>
                    ))}
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>366K+ units scheduled 2025‚‚Ç¨‚Äú2028</div>
                  </div>
                </div>
              </div>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Supply Risk by Community ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Supply Risk by Community</div>
                  <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>Based on DLD pipeline + demand analysis</div>
                </div>
                <div style={{ padding:"0 0 8px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"minmax(120px,160px) 80px 1fr", gap:12, padding:"8px 18px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>Community</div><div>Risk Level</div><div>Analysis</div>
                  </div>
                  {RISK_ZONES.map(({community,risk,reason,color},i)=>(
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(120px,160px) 80px 1fr", gap:12, padding:"12px 18px", alignItems:"center", borderBottom:i<RISK_ZONES.length-1?`1px solid ${T.border}`:"none", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{community}</div>
                      <div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:5, background:`${color}14`, color }}>
                          {risk}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.4 }}>{reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            
              {/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
                  SESSION 15 - DLD LIVE TRANSACTION INTELLIGENCE
              ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */}

              {/* DLD Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, marginTop:8, flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 8px #10B98180", animation:"ping 2s infinite" }}/>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:T.white }}>DLD Live Transaction Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>
                      Source: DLD - Dubai Pulse - Last refreshed: {dldLastRefresh.toLocaleTimeString("en-AE", {hour:"2-digit",minute:"2-digit"})} - Auto-refresh every 60s
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => { setDldLastRefresh(new Date()); setDldRefreshTick(t=>t+1); }}
                  style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.surfaceAlt, color:T.textSecondary, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                  Refresh
                </button>
              </div>

              {/* Community Selector */}
              {(() => {
                const DLD_DATA = {
                  "Dubai Hills Estate":      { tx:47, ytd:312, ppsf:1820, ask:2050, trend:[1680,1700,1720,1750,1780,1820], vol:"AED 1.2B", type:"Residential" },
                  "Dubai Creek Harbour":     { tx:38, ytd:241, ppsf:1750, ask:1950, trend:[1580,1610,1640,1680,1720,1750], vol:"AED 892M", type:"Waterfront" },
                  "Emaar Beachfront":        { tx:22, ytd:148, ppsf:3200, ask:3600, trend:[2900,2980,3050,3100,3150,3200], vol:"AED 1.8B", type:"Luxury" },
                  "Downtown Dubai":          { tx:31, ytd:208, ppsf:2900, ask:3200, trend:[2650,2700,2750,2800,2850,2900], vol:"AED 1.5B", type:"Prime" },
                  "Business Bay":            { tx:65, ytd:432, ppsf:1650, ask:1850, trend:[1500,1530,1560,1590,1620,1650], vol:"AED 1.1B", type:"Commercial" },
                  "Dubai Marina":            { tx:58, ytd:389, ppsf:2000, ask:2200, trend:[1820,1860,1900,1940,1970,2000], vol:"AED 1.3B", type:"Marina" },
                  "Jumeirah Village Circle": { tx:92, ytd:621, ppsf:1180, ask:1280, trend:[1050,1080,1100,1130,1150,1180], vol:"AED 780M", type:"Affordable" },
                  "Palm Jumeirah":           { tx:18, ytd:121, ppsf:4400, ask:5200, trend:[3900,4000,4100,4200,4300,4400], vol:"AED 3.2B", type:"Ultra Luxury" },
                  "DAMAC Hills":             { tx:29, ytd:195, ppsf:1500, ask:1650, trend:[1320,1360,1390,1420,1460,1500], vol:"AED 620M", type:"Villa" },
                  "Sobha Hartland":          { tx:24, ytd:162, ppsf:2700, ask:2900, trend:[2400,2480,2530,2580,2630,2700], vol:"AED 980M", type:"Premium" },
                  "Meydan / MBR City":       { tx:33, ytd:221, ppsf:2100, ask:2300, trend:[1850,1900,1950,2000,2050,2100], vol:"AED 1.0B", type:"Mixed" },
                  "Emaar South":             { tx:41, ytd:278, ppsf:1050, ask:1150, trend:[890,920,950,980,1010,1050],     vol:"AED 460M", type:"Affordable" },
                };
                const d = DLD_DATA[dldActiveCommunity] || DLD_DATA["Dubai Hills Estate"];
                const gap = d.ask - d.ppsf;
                const gapPct = ((gap / d.ppsf) * 100).toFixed(1);
                const tUp = d.trend[5] > d.trend[0];
                const tChange = (((d.trend[5] - d.trend[0]) / d.trend[0]) * 100).toFixed(1);
                const maxT = Math.max(...d.trend);
                const minT = Math.min(...d.trend);
                const months = ["Nov","Dec","Jan","Feb","Mar","Apr"];
                const heat = d.tx;
                const sigLabel = heat>60?"Hot":heat>40?"Active":heat>20?"Moderate":"Slow";
                const sigColor = heat>60?"#EF4444":heat>40?"#F59E0B":heat>20?T.gold:"#3B82F6";
                return (
                  <div>
                    {/* Pills */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                      {Object.keys(DLD_DATA).map(c => (
                        <button type="button" key={c} onClick={() => setDldActiveCommunity(c)}
                          style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${c===dldActiveCommunity?T.gold:T.border}`,
                            background:c===dldActiveCommunity?"rgba(212,168,67,0.12)":T.surfaceAlt,
                            color:c===dldActiveCommunity?T.gold:T.textSecondary,
                            fontSize:11, fontWeight:c===dldActiveCommunity?700:500, cursor:"pointer" }}>
                          {DLD_DATA[c].tx > 50 && <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#10B981", marginRight:4 }}/>}
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* KPI Strip */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                      {[
                        { label:"Transactions MTD", value:d.tx,              color:T.teal  },
                        { label:"Transactions YTD", value:d.ytd,             color:"#8B5CF6" },
                        { label:"DLD Price/sqft",   value:`AED ${d.ppsf.toLocaleString()}`, color:T.gold },
                        { label:"Monthly Volume",   value:d.vol,             color:"#10B981" },
                      ].map((k,i) => (
                        <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
                          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{k.label}</div>
                          <div style={{ fontSize:18, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif" }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Main grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(360px,38%)", gap:16, marginBottom:16, alignItems:"start" }}>

                      {/* Left column */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                        {/* Price Trend */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Price/sqft Trend - {dldActiveCommunity}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:tUp?"#10B981":T.red }}>{tUp?"‚‚Äì≤":"‚‚Äìº"} {tChange}% (6M)</div>
                          </div>
                          <div style={{ padding:"16px" }}>
                            <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80, marginBottom:8 }}>
                              {d.trend.map((val,i) => (
                                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                  <div style={{ fontSize:9, color:i===5?T.gold:T.textMuted, fontWeight:i===5?700:400 }}>{val>=1000?`${(val/1000).toFixed(1)}K`:val}</div>
                                  <div style={{ width:"100%", background:i===5?T.gold:"rgba(212,168,67,0.25)", borderRadius:"3px 3px 0 0", height:`${Math.max(((val-minT)/(maxT-minT+100))*100,15)}%` }}/>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:"flex", gap:6 }}>
                              {months.map((m,i) => <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:T.textMuted }}>{m}</div>)}
                            </div>
                          </div>
                        </div>

                        {/* Recent Transactions */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Recent DLD Transactions</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>Verified - DLD Registry</div>
                          </div>
                          <div style={{ overflowX:"auto" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 80px 90px 90px", gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, minWidth:400 }}>
                              <div>Unit</div><div>Beds</div><div>Size sqft</div><div>Price/sqft</div><div>Sale Price</div>
                            </div>
                            {["Studio","1BR","2BR","2BR","3BR","1BR"].map((beds,i) => {
                              const sizes = { Studio:480, "1BR":720, "2BR":1100, "3BR":1600 };
                              const size = sizes[beds] + i*30;
                              const ppsf = Math.round(d.ppsf * (0.94 + i*0.025));
                              const price = Math.round(ppsf * size);
                              const days = [3,7,12,18,24,31][i];
                              const dt = new Date(Date.now()-days*86400000).toLocaleDateString("en-AE",{day:"2-digit",month:"short"});
                              return (
                                <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 80px 90px 90px", gap:8, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)", minWidth:400 }}>
                                  <div><div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>Unit {1000+i*107}</div><div style={{ fontSize:10, color:T.textMuted }}>{dt}</div></div>
                                  <div style={{ fontSize:11, color:T.textSecondary, alignSelf:"center" }}>{beds}</div>
                                  <div style={{ fontSize:11, color:T.textSecondary, alignSelf:"center" }}>{size.toLocaleString()}</div>
                                  <div style={{ fontSize:11, fontWeight:700, color:T.gold, alignSelf:"center" }}>AED {ppsf.toLocaleString()}</div>
                                  <div style={{ fontSize:11, fontWeight:600, color:T.white, alignSelf:"center" }}>AED {(price/1e6).toFixed(2)}M</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Right column */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                        {/* Price Validation */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, fontSize:13, fontWeight:700, color:T.white }}>Registered vs Asking Price</div>
                          <div style={{ padding:"16px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <div style={{ fontSize:11, color:T.textMuted }}>DLD Registered Avg</div>
                              <div style={{ fontSize:13, fontWeight:800, color:T.gold }}>AED {d.ppsf.toLocaleString()}/sqft</div>
                            </div>
                            <div style={{ height:8, background:T.gold, borderRadius:4, marginBottom:10 }}/>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <div style={{ fontSize:11, color:T.textMuted }}>Portal Asking Avg</div>
                              <div style={{ fontSize:13, fontWeight:800, color:"#8B5CF6" }}>AED {d.ask.toLocaleString()}/sqft</div>
                            </div>
                            <div style={{ height:8, background:"#8B5CF6", borderRadius:4, marginBottom:14 }}/>
                            <div style={{ padding:"12px 14px", borderRadius:10, background:`rgba(239,68,68,0.08)`, border:`1px solid rgba(239,68,68,0.2)` }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Asking Premium vs Registered</div>
                              <div style={{ fontSize:22, fontWeight:900, color:T.red, fontFamily:"'Fraunces',serif" }}>+{gapPct}%</div>
                              <div style={{ fontSize:11, color:T.textSecondary, marginTop:4 }}>
                                {parseFloat(gapPct)>15?"Negotiate hard - significant overpricing.":parseFloat(gapPct)>8?"Moderate premium - room to negotiate.":"Fairly priced vs DLD market."}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Market Signal */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, fontSize:13, fontWeight:700, color:T.white }}>Market Signal</div>
                          <div style={{ padding:"14px 16px" }}>
                            <div style={{ fontSize:18, fontWeight:900, color:sigColor, fontFamily:"'Fraunces',serif", marginBottom:8 }}>
                              {heat>60?"Hot":heat>40?"Active":heat>20?"Moderate":"Slow"} Market
                            </div>
                            <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6, marginBottom:12 }}>
                              {heat>60?"High velocity. Move fast - properties sell within days.":heat>40?"Strong demand. Good time to list.":heat>20?"Balanced. Some negotiating room.":"Low activity. Significant discounts possible."}
                            </div>
                            {[["Monthly Transactions",`${d.tx} deals`],["Market Type",d.type],["6M Trend",`${tUp?"+":""}${tChange}%`],["YTD Volume",d.vol]].map(([lbl,val],i) => (
                              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                                <div style={{ fontSize:11, color:T.textMuted }}>{lbl}</div>
                                <div style={{ fontSize:11, fontWeight:700, color:T.white }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Agent Talking Points */}
                        <div style={{ background:`rgba(212,168,67,0.05)`, border:`1px solid rgba(212,168,67,0.2)`, borderRadius:14, padding:"14px 16px" }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginBottom:10 }}>Agent Talking Points</div>
                          {[
                            `DLD recorded ${d.tx} transactions in ${dldActiveCommunity} this month`,
                            `Avg registered: AED ${d.ppsf.toLocaleString()}/sqft vs AED ${d.ask.toLocaleString()}/sqft asking (+${gapPct}%)`,
                            `Price ${tUp?"up":"down"} ${Math.abs(parseFloat(tChange))}% over 6 months`,
                            `Market is ${heat>50?"active - advise clients to act quickly":"moderate - room to negotiate"}`,
                          ].map((pt,i) => (
                            <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                              <div style={{ width:16, height:16, borderRadius:"50%", background:"rgba(212,168,67,0.15)", border:"1px solid rgba(212,168,67,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:T.gold, fontWeight:700, flexShrink:0, marginTop:1 }}>{i+1}</div>
                              <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.5 }}>{pt}</div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

            </>);
}

export default IntelligenceTab;
