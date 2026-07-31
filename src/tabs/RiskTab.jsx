/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — RISK TAB
   Community-level investment risk assessment
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import SourceList from "../components/SourceList";
import { classifyProvenance, PROVENANCE } from "../utils/provenance";

/* ── SOURCES ────────────────────────────────────────────────────────────────
   These used to render as seven grey text chips a reader could not open, and
   three of them — 1tab.co, mitchellscommercialrealty.com, lionandland.com —
   were blog aggregators being cited for figures that originate with Fitch and
   Goldman Sachs. Citing the aggregator instead of the primary source is how a
   number survives past the point where the original was revised.

   Now: primary publishers, linked where a public URL exists, and honestly
   marked where one does not. An agent must be able to send a client the
   source, which is the entire premise of this product.

   Bank research notes are genuinely not public. They are named with no link
   rather than dropped, because "Goldman Sachs, March 2026" tells a client
   something real even when they cannot click it. */
const RISK_TAB_SOURCES = [
  { title: "Dubai Land Department — transaction and price open data",
    url: "https://dubailand.gov.ae/en/open-data/real-estate-data/",
    publisher: "Dubai Land Department" },
  { title: "Fitch Ratings — research and sector outlooks",
    url: "https://www.fitchratings.com/research",
    publisher: "Fitch Ratings", date: "May 2025",
    note: "10–15% mid-market correction view" },
  { title: "CBRE Middle East — market insights",
    url: "https://www.cbre.ae/insights",
    publisher: "CBRE" },
  { title: "Goldman Sachs — Q1 2026 transaction volume note",
    publisher: "Goldman Sachs", date: "March 2026",
    note: "51% volume decline" },
  { title: "Citi — UAE population and growth revision",
    publisher: "Citi", date: "2026" },
];

function RiskTab({ liveNeighbourhoods=[], riskTabView, setRiskTabView, riskCommunity2, setRiskCommunity2, riskHorizon, setRiskHorizon, globalFilters = {}, handleTabChange }) {

  /* Phase 2.4 Batch 6: when top bar sets a community, sync tab's selector */
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? globalFilters.community : null;

  /* ── LIVE COMMUNITY DATA ──────────────────────────────────────────────────
     This map was built and then never read. The tab took liveNeighbourhoods as
     a prop, computed real yields and transaction counts from it, and then the
     matrix below rendered a hardcoded `yldMap` instead — an undated literal
     that said Downtown Dubai yields 5.5% whatever the measured figure was.

     A tab that accepts live data and displays a constant is worse than one
     that never claimed to: the plumbing makes it look current. Wired up now,
     with provenance carried through so a measured yield and a missing one are
     not shown the same way. */
  const communityData = React.useMemo(() => {
    const map = {};
    (liveNeighbourhoods||[]).forEach(n => {
      const yieldValue = parseFloat(n.grossYield);
      map[n.community] = {
        grossYield:      Number.isFinite(yieldValue) && yieldValue > 0 ? yieldValue : null,
        dldTransactions: n.dldTransactions || 0,
        avgPpsf:         n.avgPpsf || 0,
        supplyRisk:      n.supplyRisk || null,
        /* Classified through the same function the Neighbourhoods tab uses, so
           a community cannot read "DLD verified" on one tab and "Estimate" on
           another. That inconsistency was already found once, between two
           definitions of "verified" that disagreed 61 to 60. */
        provenance:      classifyProvenance(n),
      };
    });
    return map;
  }, [liveNeighbourhoods]);

  const hasLiveData = Object.keys(communityData).length > 0;

  React.useEffect(() => {
    if (gfCommunity && riskCommunity2 !== gfCommunity) {
      setRiskCommunity2(gfCommunity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gfCommunity]);


            /* ══ RESEARCH — Risk Analysis Apr 2026 ══
               Sources: Fitch Ratings (15% correction forecast), Goldman Sachs
               (51% transaction drop Mar 2026), DFM index -21% post Feb 28
               mitchellscommercialrealty.com, 1tab.co, lionandland.com
               Cash 64% / mortgage 36% (May 2026 — the "87% cash" figure this
               research block previously cited is out of date) | RERA escrow
               9 risk factors: Supply, Geopolitical, Developer, Liquidity,
               Vacancy, Currency, Regulatory, Construction, Market Cycle
            ════════════════════════════════════════════════════════ */

            /* ── WHAT THESE SCORES ARE, AND WHAT THEY ARE NOT ──────────────────
             *
             * The nine factor DESCRIPTIONS below are sourced — Fitch on a 10-15%
             * mid-market correction, Goldman Sachs on the 51% March volume drop,
             * the 210,000-unit 2026 pipeline, JVC's 16,852 units. Those are real
             * and worth an agent's time.
             *
             * The per-community NUMBERS are not measurements. "Jumeirah Village
             * Circle: supply 72/100" was typed, not computed, and nothing in this
             * platform measures supply risk on a hundred-point scale. Same for the
             * grades and the composite score.
             *
             * They are kept rather than deleted because the weights ARE stated,
             * which makes the reasoning inspectable — that is what separates this
             * from the "Market Health 72/100" removed from the Market tab, where
             * no inputs were given at all. But the page must say so, and now does.
             *
             * COVERAGE: eight communities have profiles. The platform covers 193.
             * The selector previously offered communities this model has never
             * scored, which is the dead-filter fault fixed on the Projects tab —
             * an option that cannot return an answer. RISK_COVERED_COMMUNITIES
             * below is the honest list.
             */
            const RISK_FACTORS = [
              { key:"supply",       label:"Supply Oversupply",   weight:20, icon:"\uD83C\uDFD7",
                desc:"210,000 units planned 2026. JVC alone: 16,852 units 2025-27. Mid-market most exposed.",
                communityScores:{ "Jumeirah Village Circle":72, "Business Bay":78, "Dubai Marina":20, "Downtown Dubai":18, "Dubai Hills Estate":25, "Palm Jumeirah":15, "International City":55, "Dubai South":60 } },
              { key:"geopolitical", label:"Geopolitical Risk",   weight:18, icon:"⚔",
                desc:"Iran-US conflict. DFM -21% post Feb 28. Transaction freeze 48-72hrs. Physical prices -3% YoY mid-Mar 2026.",
                communityScores:{ "Jumeirah Village Circle":45, "Business Bay":45, "Dubai Marina":40, "Downtown Dubai":38, "Dubai Hills Estate":35, "Palm Jumeirah":35, "International City":55, "Dubai South":50 } },
              { key:"developer",    label:"Developer Default",   weight:15, icon:"\uD83C\uDFE2",
                desc:"Binghatti/Omniyat bonds >1000bps. 48-52% historical on-time delivery. Tier-1 (Emaar) vs Tier-3 risk gap wide.",
                communityScores:{ "Jumeirah Village Circle":40, "Business Bay":30, "Dubai Marina":25, "Downtown Dubai":20, "Dubai Hills Estate":15, "Palm Jumeirah":20, "International City":55, "Dubai South":45 } },
              { key:"liquidity",    label:"Liquidity / Exit",    weight:12, icon:"\uD83D\uDCA7",
                /* "87% cash market limits forced selling" corrected 2026-07-30:
                   cash funded 64% of activity in May 2026, mortgages 36%. The
                   cushion against forced selling is real but smaller than
                   stated, and mortgage share is rising. */
                desc:"Transaction volume -51% Mar 2026 (Goldman Sachs). Cash funds 64% of activity (May 2026), which limits but no longer largely removes forced-selling pressure. Secondary villa -89% YoY.",
                communityScores:{ "Jumeirah Village Circle":35, "Business Bay":28, "Dubai Marina":22, "Downtown Dubai":20, "Dubai Hills Estate":30, "Palm Jumeirah":38, "International City":48, "Dubai South":65 } },
              { key:"vacancy",      label:"Vacancy / Rental",    weight:12, icon:"\uD83C\uDFE0",
                desc:"JVC vacancy rising with supply. Prime areas 2-4% vacancy. Citi: population growth 1% vs 4% prior forecast.",
                communityScores:{ "Jumeirah Village Circle":42, "Business Bay":35, "Dubai Marina":22, "Downtown Dubai":20, "Dubai Hills Estate":28, "Palm Jumeirah":25, "International City":50, "Dubai South":60 } },
              { key:"currency",     label:"Currency / FX",       weight:8,  icon:"\uD83D\uDCB1",
                desc:"AED pegged to USD. Oil >$100 for 30 days tightens buyer purchasing power from India/Europe/Asia.",
                communityScores:{ "Jumeirah Village Circle":25, "Business Bay":25, "Dubai Marina":25, "Downtown Dubai":25, "Dubai Hills Estate":25, "Palm Jumeirah":25, "International City":25, "Dubai South":25 } },
              { key:"regulatory",   label:"Regulatory Change",   weight:5,  icon:"\uD83D\uDCCB",
                desc:"RERA/DLD well-established. Escrow protections strong. Golden Visa rules stable. Low regulatory risk vs 2008.",
                communityScores:{ "Jumeirah Village Circle":15, "Business Bay":15, "Dubai Marina":12, "Downtown Dubai":12, "Dubai Hills Estate":12, "Palm Jumeirah":12, "International City":20, "Dubai South":18 } },
              { key:"construction", label:"Construction Delay",  weight:5,  icon:"⏰",
                desc:"48% on-time delivery historically. Off-plan buyers at risk. Ready property: zero construction risk.",
                communityScores:{ "Jumeirah Village Circle":35, "Business Bay":30, "Dubai Marina":15, "Downtown Dubai":12, "Dubai Hills Estate":20, "Palm Jumeirah":15, "International City":40, "Dubai South":45 } },
              { key:"cycle",        label:"Market Cycle",        weight:5,  icon:"\uD83D\uDCC8",
                desc:"60% price run 2022-2025. Fitch: 10-15% correction probable. Prime areas more resilient than peripheral.",
                communityScores:{ "Jumeirah Village Circle":55, "Business Bay":48, "Dubai Marina":35, "Downtown Dubai":30, "Dubai Hills Estate":38, "Palm Jumeirah":28, "International City":45, "Dubai South":42 } },
            ];

            /* ── Community risk profiles ── */
            const COMMUNITY_RISK = {
              "Jumeirah Village Circle": { grade:"B+", label:"Moderate Risk", color:"#F97316", score:48, segment:"Mid-market apartment", note:"Highest supply pipeline in Dubai. Strong yield but correction risk elevated in 2026." },
              "Business Bay":            { grade:"B+", label:"Moderate Risk", color:"#F97316", score:42, segment:"Urban apartment/office", note:"Corporate demand strong but highest new supply pipeline. Watch absorption carefully." },
              "Dubai Marina":            { grade:"A-", label:"Low-Moderate",  color:T.gold,   score:28, segment:"Premium apartment", note:"Limited new supply. Strong global brand. Established liquidity. Resilient in downturns." },
              "Downtown Dubai":          { grade:"A",  label:"Low Risk",      color:T.green,  score:24, segment:"Premium apartment", note:"Iconic address. Very limited supply. Tourist demand supports STR. Best cycle resilience." },
              "Dubai Hills Estate":      { grade:"A-", label:"Low-Moderate",  color:T.gold,   score:30, segment:"Family villa/apt", note:"Emaar quality + management. Strong end-user demand. Family community insulated from speculation." },
              "Palm Jumeirah":           { grade:"A",  label:"Low Risk",      color:T.green,  score:26, segment:"Luxury apartment/villa", note:"Finite supply. Global recognition. Ultra-HNW buyer base less sensitive to market cycles." },
              "International City":      { grade:"C+", label:"Higher Risk",   color:T.red,    score:58, segment:"Budget apartment", note:"High supply, high tenant turnover. Strong yield but vulnerable to correction and vacancy." },
              "Dubai South":             { grade:"B",  label:"Moderate-High", color:"#F97316", score:52, segment:"Emerging market", note:"Long-term upside from AMI Airport. High current risk — not for short-term investors." },
            };

            const comm = riskCommunity2;
            const commRisk = COMMUNITY_RISK[comm] || COMMUNITY_RISK["Dubai Marina"];

            /* ── Overall risk score for selected community ── */
            const communityRiskScore = Math.round(
              RISK_FACTORS.reduce((sum, f) => {
                const s = f.communityScores[comm] || 30;
                return sum + s * (f.weight / 100);
              }, 0)
            );

            /* ── Horizon adjustment ── */
            const horizonAdj = { short:-12, medium:0, long:10 };
            const adjScore = Math.max(5, Math.min(95, communityRiskScore + (horizonAdj[riskHorizon]||0)));

            const riskGrade = adjScore <= 25 ? {label:"Low Risk",     color:T.green,  grade:"A"}
                            : adjScore <= 40 ? {label:"Low-Moderate", color:T.gold,   grade:"A-"}
                            : adjScore <= 55 ? {label:"Moderate",     color:"#F97316",grade:"B+"}
                            : adjScore <= 70 ? {label:"High Risk",    color:T.red,    grade:"B-"}
                            :                  {label:"Very High",    color:T.red,    grade:"C"};

            const communities3 = Object.keys(COMMUNITY_RISK);
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
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Risk Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>9-factor risk model · Community scoring · Investment grade · Fitch/Goldman Sachs data · Apr 2026</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["radar","matrix","factors"].map(v=>(
                      <button key={v} type="button" onClick={()=>setRiskTabView(v)}
                        style={{ padding:"6px 14px", background:riskTabView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${riskTabView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:riskTabView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="radar"?"Community Risk":v==="matrix"?"Risk Matrix":"Factor Guide"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── WHAT THIS MODEL IS ────────────────────────────────────
                    An agent quoting "risk score 45, grade B+" to a client will be
                    asked where it came from. They need to know the answer before
                    they are asked, not after. */}
                <div style={{
                  padding:"11px 15px", marginBottom:12, borderRadius:10,
                  background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.25)",
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B", marginBottom:5 }}>
                    An analyst assessment, not a measurement
                  </div>
                  <div style={{ fontSize:10.5, color:T.textSecondary, lineHeight:1.6 }}>
                    The evidence behind each factor is sourced and cited below — Fitch, Goldman Sachs,
                    the published supply pipeline. The per-community <strong>scores and grades are our
                    judgement</strong>, weighted as shown, and nothing in this platform measures supply
                    risk on a hundred-point scale. Use them to compare communities against each other,
                    not as a figure to quote to a client.
                    {" "}Profiles exist for <strong>8 communities</strong>; the platform covers 193.
                  </div>
                </div>

                {/* Market alert */}
                <div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, marginBottom:16 }}>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.red }}>⚠ Market Alert Apr 2026:</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}>DFM index -21% post 28 Feb · Transaction volumes -51% in March (Goldman Sachs) · Fitch: 10-15% correction probable in mid-market · Cash funds 64% of activity and mortgages 36% (May 2026), so leverage cushions the market less than it did · Prime areas resilient</span>
                  </div>
                </div>

                {/* COMMUNITY RISK VIEW */}
                {riskTabView === "radar" && (
                  <>
                    {/* Controls */}
                    <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                      <select value={comm} onChange={e=>setRiskCommunity2(e.target.value)} style={{ ...selSt, minWidth:200 }}>
                        {communities3.map(c=><option key={c}>{c}</option>)}
                      </select>
                      <div style={{ display:"flex", gap:6 }}>
                        {[{key:"short",label:"Short (<2yr)"},{key:"medium",label:"Medium (2-5yr)"},{key:"long",label:"Long (5yr+)"}].map(h=>(
                          <button key={h.key} type="button" onClick={()=>setRiskHorizon(h.key)}
                            style={{ padding:"6px 12px", background:riskHorizon===h.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${riskHorizon===h.key?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:riskHorizon===h.key?T.gold:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                      {/* Risk score card */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div style={{ padding:"24px", background:`linear-gradient(135deg,${riskGrade.color}14,${riskGrade.color}04)`, border:`1px solid ${riskGrade.color}40`, borderRadius:14, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Risk Score — {comm.split(" ").slice(0,2).join(" ")}</div>
                          {/* The number is 52px tall and reads like a measurement. It is
                              not one — it is a weighted analyst judgement. The badge sits
                              on the figure itself rather than only in the note above,
                              because a screenshot of this card travels without the note. */}
                          <div style={{
                            display:"inline-block", marginBottom:6, padding:"1px 8px", borderRadius:6,
                            fontSize:9, fontWeight:700, letterSpacing:0.4, textTransform:"uppercase",
                            color:"#F59E0B", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)",
                          }}>
                            Analyst estimate — not measured
                          </div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:52, fontWeight:900, color:riskGrade.color, lineHeight:1 }}>{adjScore}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:riskGrade.color, marginTop:6 }}>{riskGrade.label}</div>
                          <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Investment Grade: <strong style={{ color:riskGrade.color }}>{riskGrade.grade}</strong>{"·"}{riskHorizon} horizon</div>
                          {/* Risk bar */}
                          <div style={{ height:8, borderRadius:4, background:`linear-gradient(90deg,${T.green} 0%,${T.gold} 40%,#F97316 65%,${T.red} 100%)`, margin:"14px 0 6px", position:"relative" }}>
                            <div style={{ position:"absolute", top:-2, left:`${adjScore}%`, transform:"translateX(-50%)", width:12, height:12, borderRadius:"50%", background:T.white, border:`2px solid ${riskGrade.color}` }} />
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted }}>
                            <span>Low 0</span><span>Moderate 50</span><span>High 100</span>
                          </div>
                        </div>

                        {/* Community verdict */}
                        <div className="chart-box" style={{ padding:18 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>{comm}</div>
                          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:11, padding:"2px 10px", borderRadius:8, background:commRisk.color+"20", color:commRisk.color, fontWeight:700 }}>Grade {commRisk.grade}</span>
                            <span style={{ fontSize:11, padding:"2px 10px", borderRadius:8, background:T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>{commRisk.segment}</span>
                          </div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7, marginBottom:12 }}>{commRisk.note}</div>
                          <button type="button" onClick={()=>handleTabChange("Investment Score")}
                            style={{ width:"100%", padding:"8px 0", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            View Investment Score →
                          </button>
                        </div>
                      </div>

                      {/* Factor breakdown */}
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Risk Factors — {comm.split(" ").slice(0,2).join(" ")}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Higher score = higher risk · Weighted by importance</div>
                        {RISK_FACTORS.map((f,i)=>{
                          const score = f.communityScores[comm] || 30;
                          const weighted = (score * f.weight / 100).toFixed(1);
                          const barColor = score<=25?T.green:score<=45?T.gold:score<=65?"#F97316":T.red;
                          return (
                            <div key={i} style={{ marginBottom:10 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                <span style={{ fontSize:11, color:T.textSecondary }}>{f.icon} {f.label} <span style={{ color:T.textMuted }}>({f.weight}%)</span></span>
                                <span style={{ fontSize:11, fontWeight:700, color:barColor }}>{score}/100</span>
                              </div>
                              <div style={{ height:6, borderRadius:3, background:T.border, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${score}%`, background:barColor, borderRadius:3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* RISK MATRIX VIEW */}
                {riskTabView === "matrix" && (
                  <>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Community Risk Matrix</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>
                      8 scored communities ranked · Risk score is our judgement, gross yield is measured · Click any row to explore
                    </div>

                    {/* ── EMPTY STATE ──────────────────────────────────────────
                        The risk scores are constants, so this table renders whether
                        or not live data arrived — which means a Firestore outage
                        looked identical to a working page, just with different
                        yields. Now it says so. */}
                    {!hasLiveData && (
                      <div style={{
                        padding:"11px 15px", marginBottom:12, borderRadius:10,
                        background:"rgba(100,116,139,0.08)", border:"1px solid rgba(100,116,139,0.28)",
                      }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textSecondary, marginBottom:4 }}>
                          Rental yields unavailable
                        </div>
                        <div style={{ fontSize:10.5, color:T.textMuted, lineHeight:1.6 }}>
                          Community data has not loaded, so the gross yield column is empty. The risk
                          scores below still show — they are a stored assessment rather than live data —
                          but do not read the missing yields as zero or as low. Reload, or check
                          Neighbourhoods to confirm whether community data is reaching the app.
                        </div>
                      </div>
                    )}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Community","Grade","Risk Score","Gross Yield","Supply Risk","Geo Risk","Verdict"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                        ))}
                      </div>
                      {Object.entries(COMMUNITY_RISK).sort((a,b)=>a[1].score-b[1].score).map(([comm2,cr],i)=>{
                        const supplyScore = RISK_FACTORS.find(f=>f.key==="supply")?.communityScores[comm2]||30;
                        const geoScore   = RISK_FACTORS.find(f=>f.key==="geopolitical")?.communityScores[comm2]||40;
                        /* Measured yield, or nothing. The literal map that used to
                           sit here fell back to 6.5% for any community it did not
                           list — a number with no basis at all, rendered in the same
                           weight as the rest of the row. A blank cell is honest; an
                           invented 6.5% is what gets quoted to a buyer. */
                        const live = communityData[comm2];
                        const yld  = live?.grossYield ?? null;
                        const yldProv = live?.provenance || null;
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<Object.keys(COMMUNITY_RISK).length-1?`1px solid ${T.border}`:"none", alignItems:"center", cursor:"pointer" }}
                            onClick={()=>{ setRiskCommunity2(comm2); setRiskTabView("radar"); }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{comm2}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{cr.segment}</div>
                            </div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:cr.color }}>{cr.grade}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:cr.color }}>{cr.score}</div>
                            <div>
                              {yld === null ? (
                                <span style={{ fontSize:11, color:T.textMuted }} title="No measured rental yield recorded for this community">not recorded</span>
                              ) : (
                                <>
                                  <span style={{ fontSize:12, fontWeight:700, color:T.teal }}>{yld.toFixed(1)}%</span>
                                  {yldProv && (
                                    <div style={{ fontSize:8.5, color:yldProv.color, marginTop:1 }}>{yldProv.label}</div>
                                  )}
                                </>
                              )}
                            </div>
                            <div style={{ fontSize:12, color:supplyScore>55?T.red:supplyScore>35?"#F97316":T.green }}>{supplyScore>55?"High":supplyScore>35?"Medium":"Low"}</div>
                            <div style={{ fontSize:12, color:geoScore>55?T.red:geoScore>35?"#F97316":T.green }}>{geoScore>45?"Elevated":"Moderate"}</div>
                            <span style={{ fontSize:10, padding:"3px 8px", borderRadius:8, background:cr.color+"20", color:cr.color, fontWeight:700 }}>{cr.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Scenario analysis */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                      {[
                        { scenario:"De-escalation by Q2 2026", prob:"50%", impact:"Flat to -5% physical prices. Rapid sentiment recovery. Transaction volumes normalize.", color:T.green, icon:"✅" },
                        { scenario:"Prolonged conflict (base)", prob:"35%", impact:"10-15% correction mid-market. Off-plan slowdown. Supply headwind compounds.", color:"#F97316", icon:"⚠" },
                        { scenario:"Major escalation",          prob:"15%", impact:"20%+ correction possible (Citi). Population growth 1% vs 4%. Multi-year recovery.", color:T.red, icon:"❌" },
                      ].map((s,i)=>(
                        <div key={i} style={{ padding:"14px 16px", background:s.color+"08", border:`1px solid ${s.color}30`, borderRadius:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:16 }}>{s.icon}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.prob}</span>
                          </div>
                          <div style={{ fontSize:12, fontWeight:700, color:s.color, marginBottom:6 }}>{s.scenario}</div>
                          <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{s.impact}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* FACTOR GUIDE VIEW */}
                {riskTabView === "factors" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:20 }}>
                    {RISK_FACTORS.map((f,i)=>(
                      <div key={i} className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:22, marginBottom:8 }}>{f.icon}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:T.white }}>{f.label}</div>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:"rgba(239,68,68,0.1)", color:T.red, fontWeight:700 }}>{f.weight}% weight</span>
                        </div>
                        <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7, marginBottom:12 }}>{f.desc}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, marginBottom:6 }}>HIGHEST RISK COMMUNITIES</div>
                        {Object.entries(f.communityScores).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([comm2,score],j)=>(
                          <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:j<2?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:11, color:T.textSecondary }}>{comm2.split(" ").slice(0,2).join(" ")}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:score>60?T.red:score>40?"#F97316":T.gold }}>{score}/100</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources — links a client can open, not grey chips */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                  <SourceList sources={RISK_TAB_SOURCES} />
                </div>
              </div>
            );
}

export default RiskTab;
