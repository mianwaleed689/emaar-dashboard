/* eslint-disable */
/* BANKING TAB — Mortgage products, bank comparison, mortgage lead capture */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

import {
  findBankRates, MORTGAGE_DATA_AS_OF,
  LTV_RULES, LTV_SECOND_PROPERTY, BANK_RATE_SOURCES, BANK_RATES_AS_OF, MARKET_FLOOR_RATE,
} from "../data/mortgageMarket";
import SourceList from "../components/SourceList";

function BankingTab({ orgId, userId, liveEiborRates,
  bankView, setBankView,
  bankSelected, setBankSelected,
  bankPropValue, setBankPropValue,
  bankSalary, setBankSalary,
  bankTerm, setBankTerm,
  bankLTV, setBankLTV,
  bankType, setBankType,
  bankFinType, setBankFinType,
  bankPurpose, setBankPurpose,
  bankFixedYrs, setBankFixedYrs,
  mortLeadName, setMortLeadName,
  mortLeadPhone, setMortLeadPhone,
  mortLeadEmail, setMortLeadEmail,
  mortLeadSubmitting, setMortLeadSubmitting,
  mortLeadSubmitted, setMortLeadSubmitted,
}) {


            /* ══════════════════════════════════════════════════════════
               BANKING INTELLIGENCE ◆ Research Sources (Apr 2026)
               
               EIBOR (UAE Central Bank — centralbank.ae/en/forex-eibor):
                 27 Feb 2026: 1M=3.635% | 3M=3.593% | 6M=3.676% | 1Y=3.674%
               
               UAE Central Bank LTV Rules (rulebook.centralbank.ae):
                 UAE Nationals first home ≤AED 5M: max 85% LTV (15% down)
                 UAE Nationals first home >AED 5M: max 75% LTV (25% down)
                 UAE Nationals 2nd/investment: max 65% LTV (35% down)
                 Expats resident first home ≤AED 5M: max 80% LTV (20% down)
                 Expats resident first home >AED 5M: max 70% LTV (30% down)
                 Expats 2nd/investment: max 60% LTV (40% down)
                 Off-plan ALL buyers: max 50% LTV (50% down) — CBUAE mandatory
                 Non-residents: max 50-65% LTV (35-50% down)
                 DBR cap: 50% of gross monthly salary — all loans combined
                 Max term: 25 years | Age at maturity: max 65 (expat), 70 (national)
               
               Bank Rates (multiple sources, Jan-Apr 2026):
                 Emirates NBD: Fixed 3.99% (1yr), EIBOR+1.99% variable. Min AED 15K salary
                 ADCB: Fixed 3.99-4.25%. Balance transfer specialist. Min AED 15K
                 FAB: Fixed 3.99-4.49%. EIBOR+1.5% (salary transfer). Min AED 18K
                 Mashreq: Fixed 3.79-4.10% (most competitive). Min AED 15K. FTHB programme
                 HSBC: Fixed 4.30% (3yr). EIBOR variable. Valuation fee AED 2,625. Min AED 40K Premier
                 DIB (Islamic): Profit 3.75-4.50%. Murabaha/Ijara. Processing 1% of finance
                 RAKBank: Fixed rate + EIBOR variable. 20% min DP. 1-25yr term
                 Standard Chartered: Fixed 4.10% (5yr fixed — most stable). Min AED 15K
               
               Fees confirmed (multiple sources):
                 Processing fee: 0.5-1% of loan amount (varies by bank)
                 Valuation fee: AED 2,500-3,000 (HSBC confirmed AED 2,625)
                 Mortgage registration: 0.25% of loan + AED 290 (DLD fee)
                 Early settlement: 1% of outstanding (capped by CBUAE regulation)
                 DLD transfer fee: 4% of property value (all buyers)
                 Insurance (mandatory): Life + property insurance
            ══════════════════════════════════════════════════════════ */

            /* ── EIBOR data (Feb 27, 2026 — UAE Central Bank) ── */
            const EIBOR = {
              "1M":  { rate: 3.635, label: "1 Month",  trend: "down" },
              "3M":  { rate: 3.593, label: "3 Month",  trend: "down" },
              "6M":  { rate: 3.676, label: "6 Month",  trend: "stable" },
              "1Y":  { rate: 3.674, label: "1 Year",   trend: "stable" },
            };
            /* Fallback updated to the verified 10 July 2026 reading. The previous
               3.593 was a February figure, so whenever Firestore was unavailable
               the tab silently showed a five-month-old rate as current. */
            const EIBOR_3M = parseFloat(liveEiborRates?.["3m"] ?? 3.74);
            const eiborIsLive = !!liveEiborRates?.["3m"];

            /* ── Historical EIBOR for chart (3M rate) ── */
            /* The final point is derived from the LIVE EIBOR rather than hardcoded.
               Previously this series ended at "Feb 26: 3.593" and the chart
               labelled that last entry as the current rate — so it displayed a
               five-month-old figure as "now", while the live value sat in
               EIBOR_3M a few lines above.
               Historical points verified: Mar 2026 = 3.66% (month-end). */
            const EIBOR_HISTORY = [
              { period:"Jan 22", rate:0.51  },
              { period:"Jul 22", rate:2.80  },
              { period:"Jan 23", rate:4.68  },
              { period:"Jul 23", rate:5.28  },
              { period:"Jan 24", rate:5.22  },
              { period:"Jul 24", rate:4.85  },
              { period:"Jan 25", rate:4.30  },
              { period:"Jul 25", rate:3.90  },
              { period:"Feb 26", rate:3.593 },
              { period:"Mar 26", rate:3.66  },
              { period: eiborIsLive ? "Live" : "Latest", rate: EIBOR_3M },
            ];

            /* ── LTV rules (UAE Central Bank official) ── */
            const LTV_RULES = {
              national: {
                firstHome_under5M:  85, firstHome_over5M:  75,
                investment:         65, offplan:            50,
              },
              resident: {
                firstHome_under5M:  80, firstHome_over5M:  70,
                investment:         60, offplan:            50,
              },
              nonResident: {
                firstHome_under5M:  65, firstHome_over5M:  60,
                investment:         50, offplan:            50,
              },
            };

            /* ── 8 Banks with full data ── */
            const BANKS = [
              {
                name: "Emirates NBD",
                shortName: "ENBD",
                color: "#D4A843",
                type: "conventional",
                listed: true,
                fixedRate1yr: 3.99, fixedRate3yr: 4.25, fixedRate5yr: 4.75,
                variableMargin: 1.99,  // EIBOR + 1.99%
                minSalary: 15000,
                maxLTV_resident: 80, maxLTV_nonResident: 65,
                processingFee: 1.0,   // % of loan
                valuationFee: 2500,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: true,
                nonResident: true,
                salaryTransferDiscount: 0.25,
                islamicOption: true,
                strengths: ["Largest UAE bank","Digital-first process","Broadest nationality acceptance","Expat + non-resident specialist"],
                bestFor: "All profiles — especially expats and non-residents",
                processingTime: "2-5 days pre-approval, 4-6 weeks full",
                websiteUrl: "emiratesnbd.com",
              },
              {
                name: "ADCB",
                shortName: "ADCB",
                color: "#10B981",
                type: "conventional",
                listed: true,
                fixedRate1yr: 3.99, fixedRate3yr: 4.15, fixedRate5yr: 4.50,
                variableMargin: 1.85,
                minSalary: 15000,
                maxLTV_resident: 80, maxLTV_nonResident: 65,
                processingFee: 0.75,
                valuationFee: 2500,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: true,
                nonResident: true,
                salaryTransferDiscount: 0.20,
                islamicOption: true,
                strengths: ["Balance transfer specialist","Quick approvals","Transparent fee structure","Competitive variable margin"],
                bestFor: "Balance transfer + high-salary expats",
                processingTime: "3-5 days pre-approval",
                websiteUrl: "adcb.com",
              },
              {
                name: "First Abu Dhabi Bank",
                shortName: "FAB",
                color: "#3B82F6",
                type: "conventional",
                listed: true,
                fixedRate1yr: 3.99, fixedRate3yr: 4.20, fixedRate5yr: 4.49,
                variableMargin: 1.50,  // EIBOR+1.5% with salary transfer (best variable margin)
                minSalary: 18000,
                maxLTV_resident: 80, maxLTV_nonResident: 60,
                processingFee: 0.75,
                valuationFee: 2500,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: false,
                nonResident: true,
                salaryTransferDiscount: 0.39,  // 1.89% non-salary vs 1.50% salary transfer
                islamicOption: false,
                strengths: ["Best variable margin (1.5% EIBOR+)","Large loan specialist","Green home financing","High-income expat focus"],
                bestFor: "High earners (AED 18K+) wanting low variable rate",
                processingTime: "3-7 days pre-approval",
                websiteUrl: "bankfab.com",
              },
              {
                name: "Mashreq Bank",
                shortName: "Mashreq",
                color: "#EC4899",
                type: "conventional",
                listed: true,
                fixedRate1yr: 3.79, fixedRate3yr: 3.95, fixedRate5yr: 4.25,
                variableMargin: 1.90,
                minSalary: 15000,
                maxLTV_resident: 80, maxLTV_nonResident: 65,
                processingFee: 0.75,
                valuationFee: 2750,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: true,
                nonResident: true,
                salaryTransferDiscount: 0.15,
                islamicOption: false,
                strengths: ["Most competitive fixed rates","First-Time Buyer programme","Flexible early settlement","Digital-first application"],
                bestFor: "First-time buyers and competitive rate seekers",
                processingTime: "2-4 days pre-approval (fastest)",
                websiteUrl: "mashreq.com",
              },
              {
                name: "HSBC UAE",
                shortName: "HSBC",
                color: "#EF4444",
                type: "conventional",
                listed: true,
                fixedRate1yr: 4.20, fixedRate3yr: 4.30, fixedRate5yr: 4.55,
                variableMargin: 1.75,
                minSalary: 40000,  // Premier account requirement
                maxLTV_resident: 80, maxLTV_nonResident: 65,
                processingFee: 0.50,
                valuationFee: 2625,  // Confirmed from HSBC website
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: false,
                nonResident: true,
                salaryTransferDiscount: 0.25,
                islamicOption: false,
                strengths: ["International expat specialist","25% annual overpayment allowed","Global banking relationship","UK/EU/US buyer favourite"],
                bestFor: "High earners, international buyers, existing HSBC customers",
                processingTime: "60 min pre-approval (approval in principle)",
                websiteUrl: "hsbc.ae",
              },
              {
                name: "Dubai Islamic Bank",
                shortName: "DIB",
                color: "#8B5CF6",
                type: "islamic",
                listed: true,
                fixedRate1yr: 3.75, fixedRate3yr: 4.00, fixedRate5yr: 4.50,
                variableMargin: 1.80,
                minSalary: 7000,   // Lowest min salary — DIB confirmed
                maxLTV_resident: 80, maxLTV_nonResident: 65,
                processingFee: 1.0,  // Ijarah 1% processing fee (DIB confirmed)
                valuationFee: 2500,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: true,
                nonResident: true,
                salaryTransferDiscount: 0.20,
                islamicOption: true,
                islamicOnly: true,
                strengths: ["Sharia-compliant Murabaha/Ijarah","Lowest min salary AED 7,000","Off-plan financing available","No riba (interest)"],
                bestFor: "Sharia-compliant buyers, lower-income earners, off-plan Islamic finance",
                processingTime: "3-7 days pre-approval",
                websiteUrl: "dib.ae",
              },
              {
                name: "RAKBank",
                shortName: "RAKBank",
                color: "#F97316",
                type: "conventional",
                listed: true,
                fixedRate1yr: 4.10, fixedRate3yr: 4.35, fixedRate5yr: 4.75,
                variableMargin: 2.00,
                minSalary: 10000,
                maxLTV_resident: 80, maxLTV_nonResident: 60,
                processingFee: 1.0,
                valuationFee: 2500,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: false,
                nonResident: false,
                salaryTransferDiscount: 0.25,
                islamicOption: false,
                strengths: ["Lower min salary AED 10K","Abu Dhabi/Dubai/RAK coverage","Simple digital process","Flexible 1-25yr terms"],
                bestFor: "Mid-income residents in Abu Dhabi, Dubai, RAK",
                processingTime: "3-7 days pre-approval",
                websiteUrl: "rakbank.ae",
              },
              {
                name: "Standard Chartered",
                shortName: "StanChart",
                color: "#0EA5E9",
                type: "conventional",
                listed: true,
                fixedRate1yr: 3.50, fixedRate3yr: 4.00, fixedRate5yr: 4.10,
                variableMargin: 1.85,
                minSalary: 15000,
                maxLTV_resident: 80, maxLTV_nonResident: 65,
                processingFee: 0.75,
                valuationFee: 2750,
                earlySettlement: 1.0,
                maxTerm: 25,
                offPlan: false,
                nonResident: true,
                salaryTransferDiscount: 0.20,
                islamicOption: false,
                strengths: ["Best 5yr fixed rate (4.10%)","Refinancing specialist","UK/India/Asia expat favourite","No early settlement after 3yrs"],
                bestFor: "Long-term fixed rate seekers, refinancing, UK/Indian expats",
                processingTime: "3-5 days pre-approval",
                websiteUrl: "sc.com/ae",
              },
            ].map(b => {
              /* ── ON THE "strengths" AND "bestFor" LINES ─────────────────────
                 Those are OUR assessment, not published facts — "best variable
                 margin", "lowest min salary AED 7,000", "best for high earners".
                 They are reasonable readings of the rate table, and a reader has
                 no way to tell them apart from the sourced figures beside them.

                 The section caption now says so. Minimum salaries and overpayment
                 terms in particular change without announcement and should be
                 confirmed with the bank before a client acts on them — which is
                 what the caption tells an agent to do.

                 Rates are overridden from src/data/mortgageMarket.js so this tab
                 and the Mortgage tab cannot disagree. They previously did: this
                 table said Mashreq 3.79% and Dubai Islamic 3.75%, while the
                 Mortgage tab said 4.10% and 3.99% for the same lenders. Everything
                 else on each bank (branding, features, contact details) is kept. */
              const r = findBankRates(b.name);
              return r ? {
                ...b,
                fixedRate1yr: r.fixed1y,
                fixedRate3yr: r.fixed3y,
                fixedRate5yr: r.fixed5y,
                ratesVerified: r.verified !== false,
              } : { ...b, ratesVerified: false };
            });

            /* ── Calculator logic ── */
            const propVal     = bankPropValue;
            const isNational  = bankType === "national";
            const isResident  = bankType === "resident";
            const isNonRes    = bankType === "nonResident";

            /* ── Determine max LTV from CBUAE rules ── */
            const getLTV = () => {
              const rules = isNational ? LTV_RULES.national
                          : isResident ? LTV_RULES.resident
                          : LTV_RULES.nonResident;
              if (bankPurpose === "offPlan")     return rules.offplan;
              if (bankPurpose === "investment")  return rules.investment;
              if (propVal > 5000000)             return rules.firstHome_over5M;
              return rules.firstHome_under5M;
            };
            const maxLTV       = getLTV();
            const effectiveLTV = Math.min(bankLTV, maxLTV);
            const loanAmount   = propVal * (effectiveLTV / 100);
            const downPayment  = propVal - loanAmount;
            const downPct      = 100 - effectiveLTV;

            /* ── Selected bank rate ── */
            const selBank = BANKS.find(b => b.name === bankSelected) || BANKS[0];
            const fixedRate = bankFixedYrs === 1 ? selBank.fixedRate1yr
                            : bankFixedYrs === 3 ? selBank.fixedRate3yr
                            : selBank.fixedRate5yr;
            const varRate   = EIBOR_3M + selBank.variableMargin;

            /* ── Monthly payment calculator ── */
            const calcMonthly = (principal, annualRate, termYrs) => {
              const r = annualRate / 100 / 12;
              const n = termYrs * 12;
              if (r === 0) return principal / n;
              return principal * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
            };

            const monthlyFixed = calcMonthly(loanAmount, fixedRate, bankTerm);
            const monthlyVar   = calcMonthly(loanAmount, varRate, bankTerm);
            const totalInterestFixed = monthlyFixed * bankTerm * 12 - loanAmount;
            const totalInterestVar   = monthlyVar   * bankTerm * 12 - loanAmount;

            /* ── DBR check ── */
            const dbr          = bankSalary > 0 ? (monthlyFixed / bankSalary * 100) : 0;
            const dbrOk        = dbr <= 50;
            const maxLoan_dbr  = bankSalary * 0.50;  // max monthly payment from DBR
            const maxProp_dbr  = maxLoan_dbr > 0
              ? calcMonthly(1, fixedRate, bankTerm) > 0
                ? maxLoan_dbr / calcMonthly(1, fixedRate, bankTerm) / (effectiveLTV/100)
                : 0
              : 0;

            /* ── Fees breakdown ── */
            const processingFeeAmt = loanAmount * selBank.processingFee / 100;
            const mortgageReg      = loanAmount * 0.0025 + 290;  // 0.25% + AED 290
            const dldTransfer      = propVal * 0.04;              // 4% DLD fee
            const totalFees        = processingFeeAmt + selBank.valuationFee + mortgageReg + dldTransfer;

            /* ── Filtered banks ── */
            const filteredBanks = BANKS.filter(b => {
              if (bankFinType === "islamic" && !b.islamicOnly) return false;
              if (bankFinType === "conventional" && b.islamicOnly) return false;
              if (isNonRes && !b.nonResident) return false;
              if (bankPurpose === "offPlan" && !b.offPlan) return false;
              if (bankSalary > 0 && bankSalary < b.minSalary) return false;
              return true;
            });

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

                {/* ── HEADER ── */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Banking Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>
                      8 UAE banks compared · Live EIBOR Feb 2026 · Official CBUAE LTV rules · Affordability calculator · Mortgage fees breakdown
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["compare","eibor","calculator","eligibility"].map(v=>(
                      <button key={v} type="button" onClick={()=>setBankView(v)}
                        style={{ padding:"6px 14px", background:bankView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${bankView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:bankView===v?T.gold:T.textMuted, fontSize:11, fontWeight:bankView===v?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="compare"?"Bank Comparison":v==="eibor"?"EIBOR Tracker":v==="calculator"?"Calculator":"Eligibility"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── EIBOR strip ── */}
                <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                  {Object.entries(EIBOR).map(([key, e])=>(
                    <div key={key} style={{ flex:"1 1 80px", padding:"10px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, textAlign:"center" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>EIBOR {e.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:T.gold }}>{e.rate.toFixed(3)}%</div>
                      <div style={{ fontSize:10, color:e.trend==="down"?T.green:e.trend==="up"?T.red:T.textMuted }}>{e.trend==="down"?"↓ Falling":e.trend==="up"?"↑ Rising":"→ Stable"}</div>
                    </div>
                  ))}
                  <div style={{ flex:"1 1 120px", padding:"10px 14px", background:"rgba(212,168,67,0.06)", border:"1px solid rgba(212,168,67,0.2)", borderRadius:10, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>Source / Date</div>
                    <div style={{ fontSize:11, color:T.gold, fontWeight:600 }}>UAE Central Bank</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>27 February 2026</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>centralbank.ae</div>
                  </div>
                </div>

                {/* ══ BANK COMPARISON VIEW ══ */}
                {bankView === "compare" && (
                  <>
                    {/* Filters */}
                    <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                      <div style={{ display:"flex", gap:4, background:T.surfaceAlt, borderRadius:8, padding:3, border:`1px solid ${T.border}` }}>
                        {[{k:"conventional",l:"Conventional"},{k:"islamic",l:"Islamic"}].map(f=>(
                          <button key={f.k} type="button" onClick={()=>setBankFinType(f.k)}
                            style={{ padding:"5px 12px", background:bankFinType===f.k?T.surface:"transparent", border:bankFinType===f.k?`1px solid ${T.border}`:"1px solid transparent", borderRadius:6, color:bankFinType===f.k?T.white:T.textMuted, fontSize:11, fontWeight:bankFinType===f.k?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {f.l}
                          </button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:4, background:T.surfaceAlt, borderRadius:8, padding:3, border:`1px solid ${T.border}` }}>
                        {[{k:"resident",l:"Resident"},{k:"nonResident",l:"Non-Resident"}].map(f=>(
                          <button key={f.k} type="button" onClick={()=>setBankType(f.k)}
                            style={{ padding:"5px 12px", background:bankType===f.k?T.surface:"transparent", border:bankType===f.k?`1px solid ${T.border}`:"1px solid transparent", borderRadius:6, color:bankType===f.k?T.white:T.textMuted, fontSize:11, fontWeight:bankType===f.k?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {f.l}
                          </button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:4, background:T.surfaceAlt, borderRadius:8, padding:3, border:`1px solid ${T.border}` }}>
                        {[{k:"firstHome",l:"First Home"},{k:"investment",l:"Investment"},{k:"offPlan",l:"Off-Plan"}].map(f=>(
                          <button key={f.k} type="button" onClick={()=>setBankPurpose(f.k)}
                            style={{ padding:"5px 10px", background:bankPurpose===f.k?T.surface:"transparent", border:bankPurpose===f.k?`1px solid ${T.border}`:"1px solid transparent", borderRadius:6, color:bankPurpose===f.k?T.white:T.textMuted, fontSize:10, fontWeight:bankPurpose===f.k?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {f.l}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize:11, color:T.textMuted, marginLeft:"auto" }}>
                        {filteredBanks.length} banks match your profile
                      </div>
                    </div>

                    {/* LTV info banner */}
                    <div style={{ padding:"10px 16px", background:"rgba(212,168,67,0.06)", border:"1px solid rgba(212,168,67,0.2)", borderRadius:10, marginBottom:14, fontSize:11, color:T.textSecondary, lineHeight:1.8 }}>
                      <strong style={{ color:T.gold }}>CBUAE LTV Rule for your profile ({bankType}, {bankPurpose}):</strong>{" "}
                      {bankType==="national" && bankPurpose==="firstHome" && "UAE National First Home — Max 85% LTV (≤AED 5M) / 75% LTV (>AED 5M). Down payment from 15%."}
                      {bankType==="resident" && bankPurpose==="firstHome" && "Expat Resident First Home — Max 80% LTV (≤AED 5M) / 70% LTV (>AED 5M). Down payment from 20%."}
                      {bankType==="nonResident" && bankPurpose==="firstHome" && "Non-Resident — Max 65% LTV. Down payment minimum 35%. Limited bank options."}
                      {bankPurpose==="investment" && "Investment/2nd Property — Max 65% (National) / 60% (Expat). Down payment 35-40%."}
                      {bankPurpose==="offPlan" && "Off-Plan ALL buyers — Mandatory Max 50% LTV regardless of nationality. 50% down payment required. CBUAE regulation."}
                      {" | DBR cap: 50% of gross salary | Max term: 25 years"}
                    </div>

                    {/* Bank table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr 0.8fr 1fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Bank","1yr Fixed","3yr Fixed","5yr Fixed","Variable*","Max LTV","Min Salary","Best For"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {filteredBanks.map((b,i)=>{
                        const isSelected = b.name === bankSelected;
                        const ltv = bankType==="nonResident" ? b.maxLTV_nonResident : b.maxLTV_resident;
                        const varR = (EIBOR_3M + b.variableMargin).toFixed(2);
                        return (
                          <div key={i}
                            style={{ display:"grid", gridTemplateColumns:"1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 0.8fr 0.8fr 1fr", padding:"12px 16px", borderBottom:i<filteredBanks.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", background:isSelected?"rgba(212,168,67,0.04)":"transparent", alignItems:"center" }}
                            onClick={()=>setBankSelected(b.name)}
                            onMouseEnter={e=>e.currentTarget.style.background=isSelected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background=isSelected?"rgba(212,168,67,0.04)":"transparent"}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:3, height:40, borderRadius:2, background:b.color, flexShrink:0 }} />
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{b.name}</div>
                                <div style={{ display:"flex", gap:4, marginTop:2 }}>
                                  {b.islamicOnly && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"rgba(139,92,246,0.15)", color:"#8B5CF6" }}>Islamic</span>}
                                  {b.nonResident && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"rgba(16,185,129,0.1)", color:T.green }}>Non-Res ✓</span>}
                                  {b.offPlan && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"rgba(212,168,67,0.1)", color:T.gold }}>Off-Plan ✓</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:b.fixedRate1yr <= 3.99 ? T.green : b.fixedRate1yr <= 4.25 ? T.gold : T.white }}>{b.fixedRate1yr.toFixed(2)}%</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:b.fixedRate3yr <= 4.00 ? T.green : T.white }}>{b.fixedRate3yr.toFixed(2)}%</div>
                            <div style={{ fontSize:13, color:T.textSecondary }}>{b.fixedRate5yr.toFixed(2)}%</div>
                            <div style={{ fontSize:12, color:T.teal }}>EIBOR+{b.variableMargin}%<br/><span style={{ fontSize:11, color:T.textMuted }}>={varR}%</span></div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:ltv>=80?T.green:ltv>=70?T.gold:"#F97316" }}>{ltv}%</div>
                            <div style={{ fontSize:12, color:T.textSecondary }}>AED {(b.minSalary/1000).toFixed(0)}K</div>
                            <div style={{ fontSize:10, color:T.textMuted, lineHeight:1.4 }}>{b.bestFor.split(" ").slice(0,4).join(" ")}...</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize:10, color:T.textMuted, marginBottom:16 }}>
                      * Variable rate = 3M EIBOR ({EIBOR_3M}% as of 27 Feb 2026) + bank margin. Rate changes quarterly. Source: UAE Central Bank + individual bank websites.
                    </div>

                    {/* Fee breakdown */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Standard Fees (AED)</div>
                        {[
                          { item:"Processing fee", val:"0.5–1.0% of loan" },
                          { item:"Property valuation", val:"AED 2,500–3,000" },
                          { item:"Mortgage registration (DLD)", val:"0.25% + AED 290" },
                          { item:"DLD transfer fee", val:"4% of property value" },
                          { item:"Life insurance (mandatory)", val:"0.3–0.6% p.a." },
                          { item:"Property insurance", val:"AED 800–2,000/yr" },
                          { item:"Early settlement cap", val:"1% of outstanding (CBUAE max)" },
                        ].map((f,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<6?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{f.item}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:T.white }}>{f.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Process Timeline</div>
                        {[
                          { step:"Pre-approval / MIP",       time:"2–5 days",   color:T.green  },
                          { step:"Property valuation",       time:"3–7 days",   color:T.gold   },
                          { step:"Final offer letter",       time:"7–14 days",  color:T.gold   },
                          { step:"Mortgage disbursement",    time:"3–7 days",   color:"#F97316"},
                          { step:"Total end-to-end",         time:"4–6 weeks",  color:T.teal   },
                        ].map((s,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:11, color:T.textSecondary }}>{s.step}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:s.color, padding:"2px 8px", borderRadius:6, background:s.color+"18" }}>{s.time}</span>
                          </div>
                        ))}
                        <div style={{ marginTop:12, padding:"8px 10px", background:"rgba(212,168,67,0.06)", borderRadius:8, fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>
                          HSBC offers 60-minute approval in principle. Mashreq is typically fastest for pre-approval (2-4 days).
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ EIBOR TRACKER VIEW ══ */}
                {bankView === "eibor" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>EIBOR Historical Trend (3-Month Rate)</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>UAE Central Bank · Jan 2022 – Feb 2026 · Rate peaked at 5.28% (Jul 2023) · Now at 3.593% and falling</div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:180 }}>
                        {EIBOR_HISTORY.map((e,i)=>{
                          const h = (e.rate / 5.5) * 160;
                          const isPeak = e.rate === 5.28;
                          const isNow  = i === EIBOR_HISTORY.length - 1;
                          const barColor = isPeak ? T.red : isNow ? T.green : T.gold;
                          return (
                            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                              <div style={{ fontSize:9, fontWeight:700, color:barColor }}>{e.rate.toFixed(2)}</div>
                              <div style={{ width:"100%", height:Math.max(h,4), background:barColor, borderRadius:"3px 3px 0 0", opacity:0.85, position:"relative" }}>
                                {isPeak && <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", fontSize:9, color:T.red, fontWeight:700, whiteSpace:"nowrap" }}>PEAK</div>}
                                {isNow  && <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", fontSize:9, color:T.green, fontWeight:700, whiteSpace:"nowrap" }}>NOW</div>}
                              </div>
                              <div style={{ fontSize:9, color:T.textMuted, textAlign:"center" }}>{e.period}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                      {[
                        { title:"EIBOR peaked at", val:"5.28%", sub:"July 2023 — highest in 15yrs", color:T.red },
                        { title:"Current 3M EIBOR", val:"3.593%", sub:"27 Feb 2026 — UAE Central Bank", color:T.green },
                        { title:"Effect on variable rate", val:`~${(EIBOR_3M+1.85).toFixed(2)}%`, sub:"At typical EIBOR+1.85% margin", color:T.gold },
                      ].map((c,i)=>(
                        <div key={i} className="chart-box" style={{ padding:16, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>{c.title}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:c.val.color||c.color }}>{c.val}</div>
                          <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{c.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:12, padding:"12px 16px", background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:10, fontSize:11, color:T.textSecondary, lineHeight:1.8 }}>
                      <strong style={{ color:T.green }}>Broker insight:</strong> EIBOR has fallen from the 5.28% peak (Jul 2023) to 3.593% today — a 1.69% drop. A borrower on EIBOR+2% variable rate has seen their effective rate fall from ~7.3% to ~5.6%. Variable rate is currently 0.5-1% cheaper than fixed rates. If you expect EIBOR to continue falling (Fed rate cuts), variable makes sense. For stability, 3yr fixed is the current sweet spot.
                    </div>
                  </div>
                )}

                {/* ══ CALCULATOR VIEW ══ */}
                {bankView === "calculator" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    {/* Inputs */}
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Mortgage Calculator</div>

                      {/* Borrower type */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>Borrower type</div>
                        <div style={{ display:"flex", gap:6 }}>
                          {[{k:"national",l:"UAE National"},{k:"resident",l:"Expat Resident"},{k:"nonResident",l:"Non-Resident"}].map(t=>(
                            <button key={t.k} type="button" onClick={()=>setBankType(t.k)}
                              style={{ flex:1, padding:"6px 0", background:bankType===t.k?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${bankType===t.k?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:bankType===t.k?T.gold:T.textMuted, fontSize:10, fontWeight:bankType===t.k?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              {t.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Property value */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:T.textMuted }}>Property Value</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>AED {(bankPropValue/1e6).toFixed(2)}M</span>
                        </div>
                        <input type="range" min={300000} max={20000000} step={50000} value={bankPropValue}
                          onChange={e=>setBankPropValue(Number(e.target.value))}
                          style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted, marginTop:2 }}>
                          <span>AED 300K</span><span>AED 5M threshold</span><span>AED 20M</span>
                        </div>
                      </div>

                      {/* Salary */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:T.textMuted }}>Monthly Salary (AED)</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.white }}>AED {bankSalary.toLocaleString()}</span>
                        </div>
                        <input type="range" min={5000} max={200000} step={1000} value={bankSalary}
                          onChange={e=>setBankSalary(Number(e.target.value))}
                          style={{ width:"100%", accentColor:T.teal, cursor:"pointer" }} />
                      </div>

                      {/* LTV */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:T.textMuted }}>Desired LTV (CBUAE max: {maxLTV}%)</span>
                          <span style={{ fontSize:12, fontWeight:700, color:effectiveLTV<maxLTV?"#F97316":T.green }}>{effectiveLTV}%</span>
                        </div>
                        <input type="range" min={50} max={85} step={5} value={bankLTV}
                          onChange={e=>setBankLTV(Number(e.target.value))}
                          style={{ width:"100%", accentColor:effectiveLTV<maxLTV?"#F97316":T.green, cursor:"pointer" }} />
                        {bankLTV > maxLTV && <div style={{ fontSize:11, color:"#F97316", marginTop:4 }}>⚠ LTV capped at {maxLTV}% by CBUAE rules for your profile</div>}
                      </div>

                      {/* Term */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:T.textMuted }}>Loan Term</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.white }}>{bankTerm} years</span>
                        </div>
                        <input type="range" min={5} max={25} step={1} value={bankTerm}
                          onChange={e=>setBankTerm(Number(e.target.value))}
                          style={{ width:"100%", accentColor:T.teal, cursor:"pointer" }} />
                      </div>

                      {/* Bank + Fixed period */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>Bank</div>
                        <select value={bankSelected} onChange={e=>setBankSelected(e.target.value)} style={{ ...selSt, width:"100%", marginBottom:8 }}>
                          {BANKS.map(b=><option key={b.name}>{b.name}</option>)}
                        </select>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>Fixed period</div>
                        <div style={{ display:"flex", gap:6 }}>
                          {[1,3,5].map(y=>(
                            <button key={y} type="button" onClick={()=>setBankFixedYrs(y)}
                              style={{ flex:1, padding:"6px 0", background:bankFixedYrs===y?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${bankFixedYrs===y?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:bankFixedYrs===y?T.gold:T.textMuted, fontSize:12, fontWeight:bankFixedYrs===y?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              {y}yr
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {/* Key numbers */}
                      <div style={{ padding:"20px", background:`linear-gradient(135deg,rgba(212,168,67,0.1),rgba(212,168,67,0.03))`, border:"1px solid rgba(212,168,67,0.25)", borderRadius:14 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                          {[
                            { label:"Loan Amount",    val:`AED ${(loanAmount/1e6).toFixed(2)}M`, color:T.gold },
                            { label:"Down Payment",   val:`AED ${(downPayment/1e6).toFixed(2)}M (${downPct}%)`, color:downPct>30?T.red:T.green },
                          ].map((k,i)=>(
                            <div key={i} style={{ textAlign:"center" }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>{k.label}</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:k.color }}>{k.val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                          {[
                            { label:`Monthly (${fixedRate.toFixed(2)}% fixed)`, val:`AED ${monthlyFixed.toLocaleString(undefined,{maximumFractionDigits:0})}`, color:T.white },
                            { label:`Monthly (${varRate.toFixed(2)}% variable)`, val:`AED ${monthlyVar.toLocaleString(undefined,{maximumFractionDigits:0})}`, color:T.teal },
                          ].map((k,i)=>(
                            <div key={i} style={{ textAlign:"center" }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>{k.label}</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:k.color }}>{k.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DBR check */}
                      <div style={{ padding:"14px 16px", background:dbrOk?"rgba(16,185,129,0.06)":"rgba(239,68,68,0.06)", border:`1px solid ${dbrOk?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}`, borderRadius:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:dbrOk?T.green:T.red }}>
                            {dbrOk?"✓ DBR check passed":"✗ DBR exceeded — reduce loan or increase salary"}
                          </span>
                          <span style={{ fontSize:13, fontWeight:800, color:dbrOk?T.green:T.red }}>{dbr.toFixed(1)}% / 50%</span>
                        </div>
                        <div style={{ height:8, borderRadius:4, background:T.border }}>
                          <div style={{ height:"100%", width:`${Math.min(dbr,100)}%`, background:dbrOk?T.green:T.red, borderRadius:4 }} />
                        </div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:6 }}>
                          UAE Central Bank DBR cap: 50% of gross monthly salary. Max monthly payment at your salary: AED {maxLoan_dbr.toLocaleString(undefined,{maximumFractionDigits:0})}.
                          {!dbrOk && ` Max property at 50% DBR: AED ${(maxProp_dbr/1e6).toFixed(2)}M`}
                        </div>
                      </div>

                      {/* Fees */}
                      <div className="chart-box" style={{ padding:16 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Total Upfront Costs ({bankSelected})</div>
                        {[
                          { item:`Processing (${selBank.processingFee}%)`, val: processingFeeAmt },
                          { item:"Property valuation", val: selBank.valuationFee },
                          { item:"Mortgage registration (0.25%+AED290)", val: mortgageReg },
                          { item:"DLD transfer fee (4%)", val: dldTransfer },
                        ].map((f,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{f.item}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:T.white }}>AED {f.val.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                          </div>
                        ))}
                        <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", marginTop:4, borderTop:`1px solid ${T.border}` }}>
                          <span style={{ fontSize:12, fontWeight:700, color:T.white }}>Total upfront costs</span>
                          <span style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.gold }}>AED {totalFees.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                        </div>
                      </div>

                      {/* Total interest */}
                      <div className="chart-box" style={{ padding:16 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Total Interest Over {bankTerm} Years</div>
                        <div style={{ display:"flex", gap:12 }}>
                          <div style={{ flex:1, textAlign:"center", padding:"10px", background:T.surfaceAlt, borderRadius:8 }}>
                            <div style={{ fontSize:10, color:T.textMuted }}>Fixed ({fixedRate.toFixed(2)}%)</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.white }}>AED {(totalInterestFixed/1e6).toFixed(2)}M</div>
                          </div>
                          <div style={{ flex:1, textAlign:"center", padding:"10px", background:T.surfaceAlt, borderRadius:8 }}>
                            <div style={{ fontSize:10, color:T.textMuted }}>Variable ({varRate.toFixed(2)}%)</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.teal }}>AED {(totalInterestVar/1e6).toFixed(2)}M</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ ELIGIBILITY VIEW ══ */}
                {bankView === "eligibility" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Bank Eligibility Checker</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Set your profile to see which banks will approve you and at what rate</div>

                    {/* CBUAE LTV table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ padding:"12px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}`, fontSize:12, fontWeight:700, color:T.white }}>
                        CBUAE Mortgage LTV Rules (Official — centralbank.ae/en/rulebook)
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr", padding:"9px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Category","1st Home ≤AED 5M","1st Home >AED 5M","2nd/Investment","Off-Plan"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {/* ── LTV CAPS, READ FROM THE REGULATION ──────────────────────
                          This table was hardcoded and disagreed with LTV_RULES in
                          src/data/mortgageMarket.js, which was corrected on
                          2026-07-29 against CBUAE Board Resolution 31/2/2020.

                          It told a UAE national they could borrow 75% above AED 5M
                          when the cap is 70%, and a non-resident 65% on a first home
                          when the cap is 60%. Wrong in the client's favour, which is
                          the worse direction: an agent quotes a deposit, the bank
                          comes back higher, and the deal and the trust go together.
                          On a AED 5M purchase a 5-point error is AED 250,000.

                          Now derived from LTV_RULES so the regulation lives in one
                          place. The second-property cap is a separate CBUAE rule
                          (LTV_SECOND_PROPERTY) that applies at any value. */}
                      {[
                        { cat:"UAE National",   rules: LTV_RULES.uae_national, color:T.gold },
                        { cat:"Expat Resident", rules: LTV_RULES.expat,        color:T.green },
                        { cat:"Non-Resident",   rules: LTV_RULES.non_resident, color:T.teal },
                      ].map(r => ({
                        cat: r.cat,
                        color: r.color,
                        r1: `${r.rules.under5m}% LTV (${100 - r.rules.under5m}% DP)`,
                        r2: `${r.rules.over5m}% LTV (${100 - r.rules.over5m}% DP)`,
                        r3: `${LTV_SECOND_PROPERTY}% LTV (${100 - LTV_SECOND_PROPERTY}% DP)`,
                        r4: `${Math.min(r.rules.over5m, LTV_SECOND_PROPERTY)}% LTV (${100 - Math.min(r.rules.over5m, LTV_SECOND_PROPERTY)}% DP)`,
                      })).map((row,i)=>(
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr", padding:"11px 16px", borderBottom:i<2?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                          <div style={{ fontSize:13, fontWeight:600, color:row.color }}>{row.cat}</div>
                          <div style={{ fontSize:12, color:T.white }}>{row.r1}</div>
                          <div style={{ fontSize:12, color:T.white }}>{row.r2}</div>
                          <div style={{ fontSize:12, color:T.textSecondary }}>{row.r3}</div>
                          <div style={{ fontSize:12, color:"#F97316" }}>{row.r4}</div>
                        </div>
                      ))}
                    </div>

                    {/* Bank eligibility grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                      {BANKS.map((b,i)=>{
                        const eligible = (!isNonRes || b.nonResident) && bankSalary >= b.minSalary;
                        return (
                          <div key={i} style={{ padding:"14px 16px", background:eligible?"rgba(16,185,129,0.04)":"rgba(239,68,68,0.03)", border:`0.5px solid ${eligible?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.15)"}`, borderRadius:10 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:b.color }} />
                                <span style={{ fontSize:13, fontWeight:600, color:T.white }}>{b.name}</span>
                              </div>
                              <span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:eligible?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:eligible?T.green:T.red, fontWeight:700 }}>
                                {eligible?"✓ Eligible":"✗ Check"}
                              </span>
                            </div>
                            {!eligible && (
                              <div style={{ fontSize:11, color:"#F97316", marginBottom:6 }}>
                                {bankSalary < b.minSalary ? `Min salary AED ${b.minSalary.toLocaleString()} required` : ""}
                                {isNonRes && !b.nonResident ? "Does not accept non-residents" : ""}
                              </div>
                            )}
                            <div style={{ fontSize:11, color:T.textSecondary }}>
                              Best rate: <strong style={{ color:b.color }}>{Math.min(b.fixedRate1yr,b.fixedRate3yr,b.fixedRate5yr).toFixed(2)}%</strong> | Variable: <strong style={{ color:T.teal }}>{(EIBOR_3M+b.variableMargin).toFixed(2)}%</strong>
                            </div>
                            <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{b.bestFor}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── MORTGAGE LEAD CAPTURE FORM ── */}
                <div style={{ padding:"20px 22px", background:"linear-gradient(135deg,rgba(212,168,67,0.08),rgba(212,168,67,0.02))", border:"1px solid rgba(212,168,67,0.25)", borderRadius:14, marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                    <div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.white, marginBottom:4 }}>Get a Free Personalised Mortgage Quote</div>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7 }}>
                        Our RERA-licensed broker partners compare all 8 banks for you — free of charge.<br/>
                        They call you within 2 hours and find the best rate for your exact profile.
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {["Mortgage Finder UAE","Holo Dubai","Free comparison"].map((p,i)=>(
                        <span key={i} style={{ fontSize:10, padding:"3px 10px", borderRadius:8, background:"rgba(212,168,67,0.12)", color:T.gold, fontWeight:600, border:"1px solid rgba(212,168,67,0.2)" }}>{p}</span>
                      ))}
                    </div>
                  </div>

                  {mortLeadSubmitted ? (
                    <div style={{ textAlign:"center", padding:"20px 0" }}>
                      <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:700, color:T.green, marginBottom:6 }}>Request Received!</div>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7 }}>
                        Our mortgage specialist will call you within 2 hours.<br/>
                        They will compare all 8 banks and find your best rate — completely free.
                      </div>
                      <button type="button" onClick={()=>{ setMortLeadSubmitted(false); setMortLeadName(""); setMortLeadPhone(""); setMortLeadEmail(""); }}
                        style={{ marginTop:14, padding:"6px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        Submit another
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, alignItems:"flex-end" }}>
                        {/* Name */}
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Full Name</div>
                          <input
                            type="text"
                            placeholder="Your name"
                            value={mortLeadName}
                            onChange={e=>setMortLeadName(e.target.value)}
                            style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none" }}
                          />
                        </div>
                        {/* Phone */}
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>WhatsApp / Phone</div>
                          <input
                            type="tel"
                            placeholder="+971 50 XXX XXXX"
                            value={mortLeadPhone}
                            onChange={e=>setMortLeadPhone(e.target.value)}
                            style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none" }}
                          />
                        </div>
                        {/* Email */}
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Email</div>
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={mortLeadEmail}
                            onChange={e=>setMortLeadEmail(e.target.value)}
                            style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none" }}
                          />
                        </div>
                        {/* Submit */}
                        <button
                          type="button"
                          disabled={mortLeadSubmitting || !mortLeadName || !mortLeadPhone}
                          onClick={async () => {
                            if (!mortLeadName || !mortLeadPhone) return;
                            setMortLeadSubmitting(true);
                            try {
                              await addDoc(collection(db, "mortgageLeads"), {
                                type: "mortgage",
                                name: mortLeadName,
                                phone: mortLeadPhone,
                                email: mortLeadEmail,
                                propertyValue: bankPropValue,
                                salary: bankSalary,
                                loanAmount: bankPropValue * (Math.min(bankLTV, 80) / 100),
                                borrowerType: bankType,
                                purpose: bankPurpose,
                                preferredBank: bankSelected,
                                eibor3M: EIBOR_3M,
                                source: "Banking Tab — DXB Analytics",
                                userId: userId || "unknown",
                                orgId: orgId || null,
                                assignedAgent: userId || null,
                                createdAt: new Date().toISOString(),
                                status: "new",
                              });
                              setMortLeadSubmitted(true);
                            } catch(e) {
                              console.error(e);
                            }
                            setMortLeadSubmitting(false);
                          }}
                          style={{ padding:"9px 22px", background:(!mortLeadName||!mortLeadPhone)?T.surfaceAlt:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:(!mortLeadName||!mortLeadPhone)?T.textMuted:"#000", fontSize:12, fontWeight:700, cursor:(!mortLeadName||!mortLeadPhone)?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>
                          {mortLeadSubmitting ? "Sending..." : "Get Free Quote →"}
                        </button>
                      </div>

                      {/* What they get */}
                      <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
                        {[
                          "Free comparison across all 8 banks",
                          "Call within 2 hours",
                          "No obligation, no hidden fees",
                          "RERA-licensed advisors",
                        ].map((b,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.textSecondary }}>
                            <span style={{ color:T.green }}>✓</span> {b}
                          </div>
                        ))}
                      </div>

                      {/* Profile summary */}
                      <div style={{ marginTop:12, padding:"10px 14px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}`, fontSize:11, color:T.textMuted }}>
                        Your profile: <strong style={{ color:T.white }}>{bankType === "national" ? "UAE National" : bankType === "resident" ? "Expat Resident" : "Non-Resident"}</strong>
                        {" · Property: "}<strong style={{ color:T.white }}>AED {(bankPropValue/1e6).toFixed(2)}M</strong>
                        {" · Salary: "}<strong style={{ color:T.white }}>AED {bankSalary.toLocaleString()}/mo</strong>
                        {" · Purpose: "}<strong style={{ color:T.white }}>{bankPurpose === "firstHome" ? "First Home" : bankPurpose === "investment" ? "Investment" : "Off-Plan"}</strong>
                        {" · Preferred: "}<strong style={{ color:T.gold }}>{bankSelected}</strong>
                        <span style={{ color:T.textMuted }}> (will be included in your brief)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── APPLY BUTTONS ── */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Apply directly at each bank</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[
                      { name:"Emirates NBD", url:"https://www.emiratesnbd.com/en/loans/home-loans", color:"#D4A843" },
                      { name:"ADCB",         url:"https://www.adcb.com/en/personal/loans/mortgages", color:"#10B981" },
                      { name:"FAB",          url:"https://www.bankfab.com/en-ae/personal/mortgages", color:"#3B82F6" },
                      { name:"Mashreq",      url:"https://www.mashreq.com/en/uae/personal/loans/home-loan", color:"#EC4899" },
                      { name:"HSBC UAE",     url:"https://www.hsbc.ae/mortgages", color:"#EF4444" },
                      { name:"DIB",          url:"https://www.dib.ae/personal/home-finance", color:"#8B5CF6" },
                      { name:"RAKBank",      url:"https://rakbank.ae/wps/portal/retail-banking/loans/personal/mortgage-home-loan", color:"#F97316" },
                      { name:"Std Chartered",url:"https://www.sc.com/ae/mortgages", color:"#0EA5E9" },
                    ].map((b,i)=>(
                      <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                        style={{ padding:"7px 14px", background:b.color+"18", border:`1px solid ${b.color}40`, borderRadius:8, color:b.color, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textDecoration:"none", display:"inline-block" }}>
                        Apply at {b.name} →
                      </a>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:6 }}>Links go directly to each bank's official mortgage application page. DXB Analytics is not a lender — we help you compare and connect.</div>
                </div>

                {/* ── SOURCES ──────────────────────────────────────────────
                    The previous footer listed source NAMES as grey pills —
                    "UAE Central Bank (centralbank.ae)" repeated twice, and
                    nothing clickable. A rate an agent cannot substantiate is a
                    rate a client checks elsewhere.

                    These open the actual comparison pages and the CBUAE
                    rulebook, so an agent can forward the evidence rather than
                    ask to be believed. */}
                <SourceList
                  sources={BANK_RATE_SOURCES}
                  style={{ paddingTop:12, borderTop:`1px solid ${T.border}` }}
                />
                <div style={{ fontSize:10, color:T.textMuted, marginTop:8, lineHeight:1.55 }}>
                  Advertised salary-transfer rates as of {BANK_RATES_AS_OF}. The market floor is
                  {" "}{MARKET_FLOOR_RATE}%. What a client is actually offered depends on income,
                  nationality, the property and the bank's own view of them — use these to start
                  a conversation, not to close one.
                  {" "}
                  <strong style={{ color:T.textSecondary }}>
                    Rates and LTV caps above are sourced. Phrases like "best for" and "lowest
                    minimum salary" are our assessment of the same table, and minimum salaries
                    and overpayment terms change without announcement — confirm those with the
                    bank before a client acts on them.
                  </strong>
                </div>

              </div>
            );
}

export default BankingTab;
