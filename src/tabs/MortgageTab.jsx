/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — MORTGAGE TAB
   Extracted from EmaarDashboardV2.jsx
   EIBOR mortgage calculator, bank comparison, amortisation schedule
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { Section, Chart, CustomTooltip, KPI, ForecastCard, DataBadge, TabSources, LoadingSkeleton } from "../components/SharedUI";
import SEED_DATA from "../utils/seedData";
import {
  BANKS as BANK_TABLE,
  LTV_RULES,
  LTV_SECOND_PROPERTY,
  DBR_CAP,
  BANK_RATES_SOURCE,
  MORTGAGE_DATA_AS_OF,
} from "../data/mortgageMarket";

function MortgageTab({ liveNeighbourhoods=[], liveMortgageRates, liveEiborRates, liveInvestScores, handleTabChange, mortPrice, setMortPrice, mortDown, setMortDown, mortRate, setMortRate, mortYears, setMortYears, mortType, setMortType, mortProfile, setMortProfile, mortView, setMortView, mortIncome, setMortIncome, mortExistingDebts = 0, setMortExistingDebts = () => {}, invScSearch, setInvScSearch, invScSort, setInvScSort, invScFilter, setInvScFilter, invScView, setInvScView, invScSelected, setInvScSelected }) {


            /* ══ BANK DATA ◆ Research-based Apr 2026 ══
               Sources: ricadimortgages.com, realestateclubdubai.com,
               capitalzone.ae, finnxstar.com
               EIBOR 3-month: 3.593% (Feb 2026, capitalzone.ae)
            ════════════════════════════════════════════ */
            /* EIBOR rates: read live from Firestore tabData/eiborRates (admin EIBOR tab), fallback to research values */
            const EIBOR_3M = parseFloat(liveEiborRates?.["3m"] ?? 3.593);
            const EIBOR_6M = parseFloat(liveEiborRates?.["6m"] ?? 3.676);
            const EIBOR_1Y = parseFloat(liveEiborRates?.["1y"] ?? 3.674);
            const eiborIsLive = !!liveEiborRates?.["3m"];
            const eiborSource = eiborIsLive ? `Live - ${liveEiborRates?.asOf || "Firestore"}` : "Fallback (Feb 2026)";

            /* How old is what we are showing, and did it come from the central
               bank or from the cron's hardcoded fallback? Both were previously
               invisible: the tab said "Live EIBOR" either way. */
            const eiborPct = v => {
              const n = parseFloat(v);
              return Number.isFinite(n) ? `${n.toFixed(3)}%` : "—";
            };
            /* ── AGE THE RATE, NOT THE WRITE ────────────────────────────────
               This measured `updatedAt`, which the cron stamps on every run —
               including the runs where every source failed and it wrote a
               hardcoded rate. The document was rewritten daily, so the age was
               always 0 and this never once reported stale, while the number on
               screen was five months old.

               `usedFallback` is written by the cron and is the honest signal.
               When it is set the rate is not live, whatever the write time. */
            const eiborIsFallback = liveEiborRates?.usedFallback === true ||
              String(liveEiborRates?.source || "").toLowerCase().includes("fallback");
            /* asOf now describes the rate itself, so it is what to age. */
            const eiborRateDate = liveEiborRates?.rateDate || liveEiborRates?.asOf || null;
            const parsedRateDate = eiborRateDate ? new Date(eiborRateDate) : null;
            const eiborAgeDays = parsedRateDate && !isNaN(parsedRateDate)
              ? Math.floor((Date.now() - parsedRateDate.getTime()) / 86400000) : null;
            const eiborStale = eiborIsFallback ||
              (eiborAgeDays != null && eiborAgeDays > 7);
            const eiborAsOf = eiborRateDate || (eiborIsLive ? "from Firestore" : "not refreshed");

            /* Bank rates now come from src/data/mortgageMarket.js, which carries
               its source and verification date. The variable rate is derived from
               live EIBOR rather than baked in, so it tracks the market. maxLTV
               follows the CBUAE cap for the selected profile and price band. */
            const BANKS = BANK_TABLE.map(b => ({
              ...b,
              logo: b.islamic ? "\uD83D\uDD4C" : "\uD83C\uDFE6",
              variable: EIBOR_3M + b.variableMargin,
            }));

            /* ── LTV Rules (UAE Central Bank) ── */
            /* LTV caps now live in src/data/mortgageMarket.js with their source
               and verification date. The expat above-AED-5M cap here was 65,
               which is the pre-2020 figure — CBUAE Board Resolution 31/2/2020
               raised it to 70, so this tab was demanding a 35% deposit where the
               regulation requires 30%. */
            const profileRule = LTV_RULES[mortProfile] || LTV_RULES.expat;
            const [commSearch, setCommSearch] = React.useState("");
  const [selComm, setSelComm] = React.useState(null);
  const commHints = React.useMemo(()=>{
    if(!commSearch.trim()||commSearch.length<2) return [];
    return (liveNeighbourhoods||[]).filter(n=>n.avgPpsf>0&&(n.community||"").toLowerCase().includes(commSearch.toLowerCase())).slice(0,5);
  },[liveNeighbourhoods,commSearch]);
  const maxLTV = mortPrice > 5000000 ? profileRule.over5m : profileRule.under5m;
            const minDown = 100 - maxLTV;

            /* ── Calculator ── */
            const loanAmount    = mortPrice * ((100 - mortDown) / 100);
            const downPayment   = mortPrice * (mortDown / 100);
            const annualRate    = mortRate / 100;
            const monthlyRate   = annualRate / 12;
            const numPayments   = mortYears * 12;
            const monthlyPayment = loanAmount > 0 && monthlyRate > 0
              ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
              : loanAmount / numPayments;
            const totalRepay    = monthlyPayment * numPayments;
            const totalInterest = totalRepay - loanAmount;
            /* UAE Central Bank DBR counts ALL monthly debt obligations, not just
               the new mortgage. Ignoring existing car loans / credit cards told
               borrowers they could afford more than any bank would approve. */
            const existingDebts = Number(mortExistingDebts) || 0;
            const availableForMortgage = Math.max(0, mortIncome * 0.50 - existingDebts);
            const maxAfford     = monthlyRate > 0
              ? availableForMortgage * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate
              : availableForMortgage * numPayments;
            const dbr           = ((monthlyPayment + existingDebts) / mortIncome) * 100;

            /* ── Buying cost breakdown ── */
            /* Dubai purchase costs, 2026 schedule.
               The 4% DLD transfer fee is legally split 2%/2% between buyer and
               seller (2013 Executive Council resolution), but by market
               convention the buyer pays the full 4%. VAT at 5% applies to
               brokerage and bank service fees; government charges do not. */
            const VAT = 0.05;
            const dldFee        = mortPrice * 0.04;             // DLD transfer fee
            const dldAdminFee   = 580;                           // ready property (off-plan is AED 40)
            const knowledgeFee  = 20;                            // knowledge + innovation
            const agencyFee     = mortPrice * 0.02 * (1 + VAT);  // 2% + VAT
            const mortReg       = loanAmount * 0.0025 + 290;     // 0.25% + AED 290
            const trusteeFee    = mortPrice >= 500000
              ? 4200 * (1 + VAT)                                 // AED 4,200 + VAT
              : 4000 * (1 + VAT);                                // AED 4,000 + VAT
            const titleDeedFee  = 250;
            const sitePlanFee   = 250;                           // property map / site plan
            const valuationFee  = 3000;
            // Banks typically charge 1%, capped around AED 15,000.
            const processingFee = Math.min(loanAmount * 0.01, 15000) * (1 + VAT);
            const totalBuyCosts = dldFee + dldAdminFee + knowledgeFee + agencyFee + mortReg
                                + trusteeFee + titleDeedFee + sitePlanFee + valuationFee + processingFee;
            const totalCashNeeded = downPayment + totalBuyCosts;

            /* ── Rate for selected type ── */
            const getRateForType = (bank) => {
              if (mortType === "fixed1") return bank.fixed1y;
              if (mortType === "fixed3") return bank.fixed3y;
              if (mortType === "fixed5") return bank.fixed5y;
              return bank.variable;
            };

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
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Mortgage Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>
                      Interbank rate · 6 bank comparison · loan-to-value rules · monthly payment · total cost of buying
                    </div>
                    {/* Say plainly what the rate is and how old, instead of
                        asserting "Live" regardless. */}
                    <div style={{ fontSize:11, marginTop:6,
                                  color: (eiborStale || eiborIsFallback) ? "#F59E0B" : T.green }}>
                      {eiborIsFallback
                        ? `Rates are the manually-set fallback, not a live feed${eiborAsOf ? ` (${eiborAsOf})` : ""} — confirm with the bank before quoting.`
                        : eiborStale
                          ? `Rates last refreshed ${eiborAgeDays} days ago (${eiborAsOf}) — confirm with the bank before quoting.`
                          : `Rates from the UAE Central Bank${eiborAsOf ? `, ${eiborAsOf}` : ""}.`}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["calculator","banks"].map(v => (
                      <button key={v} type="button" onClick={() => setMortView(v)}
                        style={{ padding:"6px 14px", background:mortView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${mortView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:mortView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v === "calculator" ? "Calculator" : "Bank Comparison"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── EIBOR strip ────────────────────────────────────────
                    THE BUG THIS FIXES: these six cards were hardcoded —
                    "3.635% / Feb 2026" written into the JSX — while lines 32-34
                    above read the LIVE rates from Firestore and used them in the
                    calculator. So the calculator was right and the display was
                    frozen, under a header reading "Live EIBOR". On 2026-08-02
                    the cards were showing a February rate, 182 days old.

                    They now read the same live values the calculator uses, and
                    show the date Firestore actually carries. If the cron fell
                    back to its hardcoded quarterly values, `source` says
                    "Fallback" and that is shown rather than hidden. */}
                <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                  {[
                    { label:"EIBOR 1M",  val: eiborPct(liveEiborRates?.["1m"]), note: eiborAsOf },
                    { label:"EIBOR 3M",  val: eiborPct(EIBOR_3M),               note: eiborAsOf },
                    { label:"EIBOR 6M",  val: eiborPct(EIBOR_6M),               note: eiborAsOf },
                    { label:"EIBOR 1Y",  val: eiborPct(EIBOR_1Y),               note: eiborAsOf },
                    { label:"UAE CB Rate",val:"4.40%",  note:"central bank" },
                    { label:"DBR Cap",    val:"50%",    note:"of gross income" },
                  ].map((e,i) => (
                    <div key={i} style={{ padding:"8px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, textAlign:"center", flex:"1 1 80px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{e.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.gold, margin:"3px 0" }}>{e.val}</div>
                      <div style={{ fontSize:9, color:T.textMuted }}>{e.note}</div>
                    </div>
                  ))}
                </div>

                {/* CALCULATOR VIEW */}
                {mortView === "calculator" && (
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                      {/* Inputs */}
                      <div className="chart-box" style={{ padding:24 }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:4 }}>Your Mortgage</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>Based on UAE Central Bank rules · Apr 2026</div>

                        {/* Profile selector */}
                        <div style={{ marginBottom:16 }}>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>Buyer Profile</div>
                          <div style={{ display:"flex", gap:6 }}>
                            {[
                              { key:"expat",        label:"Expat Resident", ltv:"80%" },
                              { key:"uae_national", label:"UAE National",   ltv:"85%" },
                              { key:"non_resident", label:"Non-Resident",   ltv:"60%" },
                            ].map(p => (
                              <button key={p.key} type="button" onClick={() => setMortProfile(p.key)}
                                style={{ flex:1, padding:"8px 6px", background:mortProfile===p.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${mortProfile===p.key?"rgba(212,168,67,0.5)":T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                <div style={{ fontSize:11, fontWeight:700, color:mortProfile===p.key?T.gold:T.white }}>{p.label}</div>
                                <div style={{ fontSize:10, color:mortProfile===p.key?T.gold:T.textMuted }}>Max LTV {p.ltv}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rate type */}
                        <div style={{ marginBottom:16 }}>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>Mortgage Type</div>
                          <div style={{ display:"flex", gap:6 }}>
                            {[
                              { key:"fixed1",   label:"Fixed 1yr"  },
                              { key:"fixed3",   label:"Fixed 3yr"  },
                              { key:"fixed5",   label:"Fixed 5yr"  },
                              { key:"variable", label:"Variable"   },
                            ].map(t => (
                              <button key={t.key} type="button" onClick={() => setMortType(t.key)}
                                style={{ flex:1, padding:"7px 4px", background:mortType===t.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${mortType===t.key?"rgba(212,168,67,0.5)":T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:11, fontWeight:mortType===t.key?700:400, color:mortType===t.key?T.gold:T.textMuted }}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sliders */}
                        {[
                          ...([selComm&&{label:"COMMUNITY PPSF",val:Math.round((selComm.avgPpsf||1500)*750),min:400000,max:20000000,step:50000,set:setMortPrice,fmt:v=>"AED "+v.toLocaleString()}].filter(Boolean)),
                          { label:"Property Price (AED)",  val:mortPrice,  min:400000,   max:20000000, step:50000,  set:setMortPrice,  fmt:v=>v>=1000000?"AED "+(v/1000000).toFixed(2)+"M":"AED "+(v/1000).toFixed(0)+"K" },
                          { label:`Down Payment (${mortDown}% = AED ${Math.round(downPayment/1000)}K)`, val:mortDown, min:minDown, max:50, step:1, set:setMortDown, fmt:v=>v+"%" },
                          { label:"Interest Rate (%)",      val:mortRate,   min:2.5,      max:8,        step:0.05,   set:setMortRate,   fmt:v=>v.toFixed(2)+"%" },
                          { label:"Loan Tenure (Years)",    val:mortYears,  min:5,        max:25,       step:1,      set:setMortYears,  fmt:v=>v+"yrs" },
                          { label:"Monthly Income (AED)",   val:mortIncome, min:10000,    max:200000,   step:1000,   set:setMortIncome, fmt:v=>"AED "+v.toLocaleString() },
                          { label:"Existing Monthly Debts (AED)", val:mortExistingDebts, min:0, max:100000, step:500, set:setMortExistingDebts, fmt:v=>"AED "+v.toLocaleString() },
                        ].map((f,i) => (
                          <div key={i} style={{ marginBottom:16 }}>
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

                      {/* Results */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {/* Monthly payment hero */}
                        <div style={{ padding:"24px", background:"linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))", border:`1px solid rgba(212,168,67,0.3)`, borderRadius:14, textAlign:"center" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Monthly Payment</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:42, fontWeight:900, color:T.gold, lineHeight:1 }}>
                            AED {Math.round(monthlyPayment).toLocaleString()}
                          </div>
                          <div style={{ fontSize:12, color:T.textMuted, marginTop:8 }}>{mortYears} years · {mortRate}% · AED {(loanAmount/1000000).toFixed(2)}M loan</div>
                          {/* DBR indicator */}
                          <div style={{ marginTop:16, padding:"10px 14px", background:dbr<=50?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", borderRadius:8, border:`1px solid ${dbr<=50?T.green:T.red}30` }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:11, color:T.textMuted }}>Debt Burden Ratio</span>
                              <span style={{ fontSize:12, fontWeight:700, color:dbr<=50?T.green:T.red }}>{dbr.toFixed(1)}% {dbr<=50?"✅ Eligible":"❌ Exceeds 50% cap"}</span>
                            </div>
                            <div style={{ height:6, borderRadius:3, background:T.border }}>
                              <div style={{ height:"100%", width:`${Math.min(dbr,100)}%`, background:dbr<=50?T.green:T.red, borderRadius:3 }} />
                            </div>
                            <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>Max affordable payment: AED {Math.round(mortIncome * 0.5).toLocaleString()}/month</div>
                          </div>
                        </div>

                        {/* Loan breakdown */}
                        <div className="chart-box" style={{ padding:18 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Loan Summary</div>
                          {[
                            { label:"Loan Amount",     val:"AED "+(loanAmount/1000000).toFixed(2)+"M",      color:T.white  },
                            { label:"Down Payment",    val:"AED "+(downPayment/1000000).toFixed(2)+"M ("+mortDown+"%)", color:T.gold },
                            { label:"Total Repayment", val:"AED "+(totalRepay/1000000).toFixed(2)+"M",      color:"#F97316"},
                            { label:"Total Interest",  val:"AED "+(totalInterest/1000000).toFixed(2)+"M",   color:T.red    },
                            { label:"Interest/Price",  val:((totalInterest/mortPrice)*100).toFixed(0)+"%",  color:T.red    },
                          ].map((r,i) => (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                              <span style={{ fontSize:12, color:T.textMuted }}>{r.label}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:r.color }}>{r.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total cash to buy */}
                        <div className="chart-box" style={{ padding:18 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Total Cash Needed to Buy</div>
                          {[
                            { label:"Down Payment ("+mortDown+"%)",    val:"AED "+Math.round(downPayment/1000)+"K",    color:T.white  },
                            { label:"DLD Fee (4%)",                     val:"AED "+Math.round(dldFee/1000)+"K",        color:"#F97316"},
                            { label:"Agency Fee (2%)",                  val:"AED "+Math.round(agencyFee/1000)+"K",     color:"#F97316"},
                            { label:"Mortgage Reg (0.25%)",             val:"AED "+Math.round(mortReg/1000)+"K",       color:"#F97316"},
                            { label:"Bank Processing (1%)",             val:"AED "+Math.round(processingFee/1000)+"K", color:"#F97316"},
                            { label:"Valuation Fee",                    val:"AED 3,000",                               color:"#F97316"},
                          ].map((r,i) => (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                              <span style={{ fontSize:11, color:T.textMuted }}>{r.label}</span>
                              <span style={{ fontSize:11, fontWeight:600, color:r.color }}>{r.val}</span>
                            </div>
                          ))}
                          <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:4 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:T.white }}>TOTAL CASH NEEDED</span>
                            <span style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>AED {Math.round(totalCashNeeded/1000)}K</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LTV Rules info */}
                    <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>UAE Central Bank LTV Rules</div>
                      {/* ── THIS TABLE USED TO CARRY ITS OWN COPY OF THE CAPS ──
                          And that copy was wrong. mortgageMarket.js was corrected
                          on 2026-07-29 — the expat cap above AED 5M is 70%, not
                          the pre-2020 65% — but this hardcoded duplicate was never
                          updated, so the tab kept telling an expat buying above
                          AED 5M that they needed a 35% deposit instead of 30%.
                          On a AED 6M property that is AED 300,000 of deposit that
                          the regulation does not require, quoted to a client on
                          the tab they opened to plan their financing.

                          Now read from LTV_RULES, which was already imported at
                          the top of this file and simply never used here. */}
                      <div style={{ fontSize:10.5, color:T.textMuted, marginBottom:12, lineHeight:1.6 }}>
                        Regulatory maximums under CBUAE Circular 31/2013 as amended by Board Resolution
                        31/2/2020. Individual banks lend below these caps at their own discretion — the
                        binding number is the one in the bank's offer letter, not this table.
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                        {[
                          { profile:LTV_RULES.expat.label,
                            under5m:`${LTV_RULES.expat.under5m}% LTV (${100-LTV_RULES.expat.under5m}% down)`,
                            over5m:`${LTV_RULES.expat.over5m}% LTV (${100-LTV_RULES.expat.over5m}% down)`, color:T.gold },
                          { profile:LTV_RULES.uae_national.label,
                            under5m:`${LTV_RULES.uae_national.under5m}% LTV (${100-LTV_RULES.uae_national.under5m}% down)`,
                            over5m:`${LTV_RULES.uae_national.over5m}% LTV (${100-LTV_RULES.uae_national.over5m}% down)`, color:T.green },
                          { profile:LTV_RULES.non_resident.label,
                            under5m:`${LTV_RULES.non_resident.under5m}% LTV (${100-LTV_RULES.non_resident.under5m}% down)`,
                            over5m:`${LTV_RULES.non_resident.over5m}% LTV (${100-LTV_RULES.non_resident.over5m}% down)`, color:"#3B82F6" },
                          { profile:"Second property",   under5m:`${LTV_SECOND_PROPERTY}% LTV, any value`, over5m:"Regardless of price", color:"#8B5CF6" },
                          { profile:"Max Tenure",        under5m:"25 years",           over5m:"Age cap: 70 yrs",    color:T.teal   },
                          { profile:"DBR Cap",           under5m:`${Math.round(DBR_CAP*100)}% of gross salary`, over5m:"All loans combined", color:"#F97316"},
                        ].map((r,i) => (
                          <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:11, fontWeight:700, color:r.color, marginBottom:6 }}>{r.profile}</div>
                            <div style={{ fontSize:12, color:T.white, marginBottom:3 }}>{r.under5m}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>Over AED 5M: {r.over5m}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* BANK COMPARISON VIEW */}
                {mortView === "banks" && (
                  <>
                    {/* Rate type toggle */}
                    <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                      {[
                        { key:"fixed1",   label:"Fixed 1yr"   },
                        { key:"fixed3",   label:"Fixed 3yr"   },
                        { key:"fixed5",   label:"Fixed 5yr"   },
                        { key:"variable", label:"Variable (EIBOR+margin)" },
                      ].map(t => (
                        <button key={t.key} type="button" onClick={() => setMortType(t.key)}
                          style={{ padding:"6px 14px", background:mortType===t.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${mortType===t.key?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:mortType===t.key?T.gold:T.textMuted, fontSize:11, fontWeight:mortType===t.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Provenance: indicative bank rates move often, so the
                        verification date is shown rather than left implicit. */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:12,
                      padding:"8px 12px", background:"rgba(255,255,255,0.02)", border:`1px solid ${T.border}`, borderRadius:8 }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:0.4, textTransform:"uppercase",
                        color:T.gold, background:"rgba(212,168,67,0.12)", border:"1px solid rgba(212,168,67,0.35)",
                        borderRadius:999, padding:"2px 8px" }}>
                        Indicative
                      </span>
                      <span style={{ fontSize:10, color:T.textSecondary, fontFamily:"'Outfit',sans-serif" }}>
                        Rates verified {MORTGAGE_DATA_AS_OF} · EIBOR {eiborSource} · confirm with the lender before relying on a figure
                      </span>
                      <span style={{ fontSize:9, color:T.textMuted, width:"100%" }}>{BANK_RATES_SOURCE}</span>
                    </div>

                    {/* Bank cards */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12, marginBottom:20 }}>
                      {[...BANKS].sort((a,b) => getRateForType(a) - getRateForType(b)).map((bank,i) => {
                        const rate    = getRateForType(bank);
                        const loan    = mortPrice * ((100 - mortDown) / 100);
                        const mr      = (rate/100) / 12;
                        const np      = mortYears * 12;
                        const monthly = loan > 0 && mr > 0 ? loan * (mr * Math.pow(1+mr,np)) / (Math.pow(1+mr,np)-1) : loan/np;
                        const isBest  = i === 0;

                        return (
                          <div key={i} className="chart-box" style={{ padding:0, overflow:"hidden", border:isBest?`1px solid ${T.gold}`:`1px solid ${T.border}`, position:"relative" }}>
                            {isBest && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T.gold},#B8922A)` }} />}
                            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <div>
                                  {isBest && <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:0.8, marginBottom:3 }}>★ BEST RATE</div>}
                                  <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{bank.bank}</div>
                                  <div style={{ display:"flex", gap:6, marginTop:4 }}>
                                    {bank.islamic && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(139,92,246,0.15)", color:"#8B5CF6", fontWeight:700 }}>Islamic</span>}
                                    {bank.salaryTransfer && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(212,168,67,0.1)", color:T.gold, fontWeight:700 }}>Salary Transfer</span>}
                                    <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(16,185,129,0.1)", color:T.green, fontWeight:700 }}>LTV {bank.maxLTV}%</span>
                                  </div>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:isBest?T.gold:T.white, lineHeight:1 }}>{rate.toFixed(2)}%</div>
                                  <div style={{ fontSize:10, color:T.textMuted }}>p.a.</div>
                                </div>
                              </div>
                            </div>
                            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                              {[
                                { label:"Monthly",    val:"AED "+Math.round(monthly).toLocaleString(), color:isBest?T.gold:T.white },
                                { label:"Processing", val:bank.processingFee+"% fee",                  color:T.textMuted },
                                { label:"Min Salary", val:"AED "+bank.minSalary.toLocaleString(),      color:T.textMuted },
                              ].map((m,j) => (
                                <div key={j}>
                                  <div style={{ fontSize:9, color:T.textMuted, marginBottom:3 }}>{m.label}</div>
                                  <div style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.val}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ padding:"10px 14px" }}>
                              <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.6 }}>{bank.note}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Comparison tips */}
                    <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Smart Mortgage Tips 2026</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                        {[
                          { icon:"\uD83D\uDCA1", tip:"Salary Transfer Discount", detail:"Most banks offer 0.25% rate reduction for transferring salary. On AED 1M loan = AED 2,500 saved per year." },
                          { icon:"\uD83D\uDD12", tip:"Lock 3-Year Fixed Now", detail:"EIBOR at 3.59%. Fixed 3yr at 4.19-4.25% protects against any rate upticks. Most advisors recommend 3yr in 2026." },
                          { icon:"\uD83E\uDDEE", tip:"DBR 50% Hard Cap", detail:"All loans + proposed mortgage cannot exceed 50% of gross monthly income. Central Bank strictly enforces this." },
                          { icon:"\uD83D\uDCCB", tip:"Pre-Approval First", detail:"Get mortgage pre-approval before searching. Takes 2-5 days. Sellers take you seriously. Locks rate for 60-90 days." },
                          { icon:"\uD83C\uDFE6", tip:"Compare 3+ Banks",  detail:"Same profile can get rates varying 0.5-1%. On AED 2M loan over 25 years that's AED 60,000+ difference." },
                          { icon:"\uD83D\uDCC4", tip:"Islamic Alternative",detail:"Dubai Islamic Bank Murabaha avoids interest entirely. Profit rate is similar but Sharia-compliant. Popular with Gulf investors." },
                        ].map((t,i) => (
                          <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:16, marginBottom:5 }}>{t.icon}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:4 }}>{t.tip}</div>
                            <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{t.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["UAE Central Bank 2026","EIBOR Feb 2026","Emirates NBD","FAB","ADCB","Mashreq","DIB","HSBC UAE","ricadimortgages.com"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default MortgageTab;
