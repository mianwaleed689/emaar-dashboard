import React from "react";
import { T } from "../../../styles/theme";

/**
 * InvestmentScoreTab — AI-scored community investment ratings across 7 factors
 */
const InvestmentScoreTab = ({
  investScoreFilter, setInvestScoreFilter,
  investExpandedComm, setInvestExpandedComm,
  Section,
  TabSources,
}) => {
  const COMMUNITIES = [
    { name: "Jumeirah Village Circle", short: "JVC",  yield: 8.5, supplyRisk: 3, momentum: 7, demand: 9, goldenVisa: false, strPotential: 6,  devQuality: 8,  avgPriceSqft: 1180, note: "Highest yields in Dubai. Watch supply pipeline." },
    { name: "Dubai Hills Estate",      short: "DHE",  yield: 6.0, supplyRisk: 7, momentum: 9, demand: 9, goldenVisa: true,  strPotential: 7,  devQuality: 10, avgPriceSqft: 2050, note: "Premium family community. Strong capital appreciation." },
    { name: "Dubai Creek Harbour",     short: "DCH",  yield: 6.0, supplyRisk: 6, momentum: 8, demand: 8, goldenVisa: true,  strPotential: 7,  devQuality: 10, avgPriceSqft: 1850, note: "Emaar's flagship waterfront. Creek Tower catalyst." },
    { name: "Emaar Beachfront",        short: "EBF",  yield: 5.8, supplyRisk: 8, momentum: 9, demand: 8, goldenVisa: true,  strPotential: 10, devQuality: 10, avgPriceSqft: 2800, note: "Best STR in Dubai. Limited supply = scarcity premium." },
    { name: "Business Bay",            short: "BB",   yield: 7.0, supplyRisk: 5, momentum: 7, demand: 8, goldenVisa: true,  strPotential: 9,  devQuality: 8,  avgPriceSqft: 1650, note: "Central location. Strong short-term rental market." },
    { name: "Downtown Dubai",          short: "DT",   yield: 5.0, supplyRisk: 8, momentum: 7, demand: 9, goldenVisa: true,  strPotential: 9,  devQuality: 10, avgPriceSqft: 3200, note: "Most prestigious address. Yield compressed but rock solid." },
    { name: "Palm Jumeirah",           short: "PJ",   yield: 4.5, supplyRisk: 9, momentum: 8, demand: 7, goldenVisa: true,  strPotential: 8,  devQuality: 9,  avgPriceSqft: 4200, note: "Ultra luxury. Limited supply but yield is low." },
    { name: "The Valley",              short: "TV",   yield: 7.0, supplyRisk: 6, momentum: 8, demand: 7, goldenVisa: false, strPotential: 5,  devQuality: 10, avgPriceSqft: 1200, note: "Affordable Emaar community. Growing demand." },
    { name: "Emaar South",             short: "ES",   yield: 7.5, supplyRisk: 5, momentum: 7, demand: 7, goldenVisa: false, strPotential: 5,  devQuality: 10, avgPriceSqft: 1050, note: "Expo 2020 legacy area. Airport proximity catalyst." },
    { name: "Dubai Marina",            short: "DM",   yield: 6.0, supplyRisk: 6, momentum: 6, demand: 8, goldenVisa: true,  strPotential: 9,  devQuality: 8,  avgPriceSqft: 2100, note: "Mature market. Lifestyle premium. High STR demand." },
    { name: "Arjan / Dubailand",       short: "ARJ",  yield: 7.5, supplyRisk: 4, momentum: 7, demand: 7, goldenVisa: false, strPotential: 5,  devQuality: 7,  avgPriceSqft: 1050, note: "Budget entry point. Strong yield play." },
    { name: "Dubai South",             short: "DS",   yield: 7.8, supplyRisk: 4, momentum: 8, demand: 7, goldenVisa: false, strPotential: 4,  devQuality: 9,  avgPriceSqft: 980,  note: "Al Maktoum Airport megaproject catalyst area." },
    { name: "The Oasis by Emaar",      short: "OAS",  yield: 5.5, supplyRisk: 5, momentum: 9, demand: 8, goldenVisa: true,  strPotential: 6,  devQuality: 10, avgPriceSqft: 2600, note: "AED 20B mega development. Early buyers seeing 30%+ gains." },
    { name: "Rashid Yachts & Marina",  short: "RYM",  yield: 5.5, supplyRisk: 7, momentum: 9, demand: 7, goldenVisa: true,  strPotential: 8,  devQuality: 10, avgPriceSqft: 2400, note: "New Emaar waterfront. Marina lifestyle premium." },
    { name: "Town Square",             short: "TSQ",  yield: 7.0, supplyRisk: 4, momentum: 6, demand: 7, goldenVisa: false, strPotential: 4,  devQuality: 8,  avgPriceSqft: 900,  note: "Most affordable in portfolio. Family living." },
  ];

  const scoreComm = (c) => {
    let pts = 0;
    const factors = [];
    const yScore   = c.yield >= 8 ? 20 : c.yield >= 7 ? 16 : c.yield >= 6 ? 12 : c.yield >= 5 ? 8 : 5;
    pts += yScore; factors.push({ label: "Yield",        score: yScore,  max: 20, val: c.yield + "%",                                            icon: "📈" });
    const sScore   = c.supplyRisk <= 4 ? 15 : c.supplyRisk <= 6 ? 10 : c.supplyRisk <= 8 ? 5 : 2;
    pts += sScore; factors.push({ label: "Supply Risk",  score: sScore,  max: 15, val: c.supplyRisk <= 4 ? "Low" : c.supplyRisk <= 6 ? "Medium" : "High", icon: "🏗️" });
    const mScore   = c.momentum >= 9 ? 15 : c.momentum >= 7 ? 10 : c.momentum >= 5 ? 6 : 3;
    pts += mScore; factors.push({ label: "Momentum",     score: mScore,  max: 15, val: c.momentum + "/10",                                        icon: "🚀" });
    const dScore   = c.demand >= 9 ? 15 : c.demand >= 7 ? 10 : c.demand >= 5 ? 6 : 3;
    pts += dScore; factors.push({ label: "Demand",       score: dScore,  max: 15, val: c.demand + "/10",                                          icon: "👥" });
    const gScore   = c.goldenVisa ? 10 : 3;
    pts += gScore; factors.push({ label: "Golden Visa",  score: gScore,  max: 10, val: c.goldenVisa ? "Eligible" : "Below 2M",                    icon: "🏅" });
    const strScore = c.strPotential >= 9 ? 15 : c.strPotential >= 7 ? 10 : c.strPotential >= 5 ? 6 : 3;
    pts += strScore; factors.push({ label: "STR Potential", score: strScore, max: 15, val: c.strPotential + "/10",                                icon: "🏖️" });
    const devScore = c.devQuality >= 9 ? 10 : c.devQuality >= 7 ? 7 : 4;
    pts += devScore; factors.push({ label: "Dev Quality", score: devScore, max: 10, val: c.devQuality + "/10",                                    icon: "🏢" });

    const total       = Math.round(pts);
    const signal      = total >= 75 ? "BUY" : total >= 55 ? "HOLD" : "SELL";
    const signalColor = signal === "BUY" ? T.green : signal === "HOLD" ? T.gold : "#EF4444";
    const color       = signalColor;
    return { ...c, total, signal, signalColor, color, factors };
  };

  const scored    = COMMUNITIES.map(scoreComm).sort((a, b) => b.total - a.total);
  const filtered  = investScoreFilter === "All" ? scored : scored.filter(c => c.signal === investScoreFilter);
  const buyCount  = scored.filter(c => c.signal === "BUY").length;
  const holdCount = scored.filter(c => c.signal === "HOLD").length;
  const sellCount = scored.filter(c => c.signal === "SELL").length;
  const marketSignal = buyCount >= 8 ? "BULL" : buyCount >= 5 ? "NEUTRAL" : "CAUTION";

  return (
    <>
      <Section title="Investment Intelligence" sub="AI-scored community ratings across 7 factors · Updated Q4 2025">

        {/* Market Signal Banner */}
        <div style={{ background: marketSignal === "BULL" ? "rgba(16,185,129,0.08)" : marketSignal === "NEUTRAL" ? "rgba(212,168,67,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${marketSignal === "BULL" ? "rgba(16,185,129,0.25)" : marketSignal === "NEUTRAL" ? "rgba(212,168,67,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Overall Market Signal</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: marketSignal === "BULL" ? T.green : marketSignal === "NEUTRAL" ? T.gold : "#EF4444" }}>
              {marketSignal === "BULL" ? "🟢 BULLISH" : marketSignal === "NEUTRAL" ? "🟡 NEUTRAL" : "🔴 CAUTION"}
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
              {marketSignal === "BULL" ? "Strong buying opportunity across multiple communities" : marketSignal === "NEUTRAL" ? "Selective buying recommended — focus on high-score communities" : "Market showing stress — focus on yield over appreciation"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[{ label: "BUY", count: buyCount, color: T.green }, { label: "HOLD", count: holdCount, color: T.gold }, { label: "SELL", count: sellCount, color: "#EF4444" }].map(s => (
              <div key={s.label} onClick={() => setInvestScoreFilter(investScoreFilter === s.label ? "All" : s.label)}
                style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 20px", cursor: "pointer", border: `1px solid ${investScoreFilter === s.label ? s.color : "transparent"}`, transition: "all 0.2s" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["All", "BUY", "HOLD", "SELL"].map(f => (
            <button key={f} type="button" onClick={() => setInvestScoreFilter(f)}
              style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${investScoreFilter === f ? T.gold : T.border}`, background: investScoreFilter === f ? "rgba(212,168,67,0.12)" : "transparent", color: investScoreFilter === f ? T.gold : T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
              {f} {f === "All" ? `(${scored.length})` : f === "BUY" ? `(${buyCount})` : f === "HOLD" ? `(${holdCount})` : `(${sellCount})`}
            </button>
          ))}
        </div>

        {/* Community cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((c, i) => (
            <div key={c.short}>
              <div onClick={() => setInvestExpandedComm(investExpandedComm === c.short ? null : c.short)}
                style={{ background: T.surface, border: `1px solid ${investExpandedComm === c.short ? c.color : T.border}`, borderRadius: investExpandedComm === c.short ? "14px 14px 0 0" : 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: i < 3 ? "#04090f" : T.textMuted, flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{c.note}</div>
                </div>
                <div style={{ flex: 1, maxWidth: 180 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>Score</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.total}/100</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: c.total + "%", height: "100%", background: `linear-gradient(90deg, ${c.color}, ${c.color}88)`, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
                <div style={{ textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{c.yield}%</div>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Yield</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 72 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>AED {c.avgPriceSqft.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>/sqft</div>
                </div>
                <div style={{ minWidth: 60, textAlign: "center" }}>
                  <div style={{ display: "inline-block", padding: "5px 12px", borderRadius: 8, background: c.signal === "BUY" ? "rgba(16,185,129,0.12)" : c.signal === "HOLD" ? "rgba(212,168,67,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${c.signalColor}33`, color: c.signalColor, fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}>{c.signal}</div>
                </div>
                <div style={{ color: T.textMuted, fontSize: 14, transition: "transform 0.2s", transform: investExpandedComm === c.short ? "rotate(180deg)" : "none" }}>▾</div>
              </div>

              {investExpandedComm === c.short && (
                <div style={{ background: "rgba(14,25,45,0.95)", border: `1px solid ${c.color}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "20px" }}>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Score Breakdown — {c.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {c.factors.map((f, fi) => (
                      <div key={fi} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: T.textSecondary }}>{f.icon} {f.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{f.score}/{f.max}</div>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ width: (f.score / f.max * 100) + "%", height: "100%", background: `linear-gradient(90deg, ${T.gold}, ${T.green})`, borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: "14px 16px", background: `${c.signalColor}0D`, border: `1px solid ${c.signalColor}33`, borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.signalColor, marginBottom: 6 }}>
                      {c.signal === "BUY" ? "✅ BUY RECOMMENDATION" : c.signal === "HOLD" ? "⚡ HOLD RECOMMENDATION" : "⚠️ SELL / AVOID RECOMMENDATION"}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
                      {c.signal === "BUY"
                        ? `${c.name} scores ${c.total}/100 — strong fundamentals across yield (${c.yield}%), demand, and momentum. ${c.note} Entry at AED ${c.avgPriceSqft.toLocaleString()}/sqft offers attractive risk-adjusted returns.`
                        : c.signal === "HOLD"
                        ? `${c.name} scores ${c.total}/100 — decent yield at ${c.yield}% but some factors warrant caution. ${c.note} Existing holders should maintain positions; new buyers should wait for better entry.`
                        : `${c.name} scores ${c.total}/100 — combination of compressed yield and elevated risk factors. ${c.note} Capital could be better deployed elsewhere.`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Methodology */}
      <Section title="Scoring Methodology" sub="How Investment Scores are calculated">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          {[
            { icon: "📈", label: "Gross Yield",       weight: "20pts", desc: "Higher yield = higher score. 8%+ = full marks. Based on DLD/REIDIN data." },
            { icon: "🏗️", label: "Supply Risk",       weight: "15pts", desc: "Inverted — low pipeline risk scores highest. Based on REIDIN supply data." },
            { icon: "🚀", label: "Price Momentum",    weight: "15pts", desc: "YoY price growth trajectory. Based on Property Monitor DPI." },
            { icon: "👥", label: "Demand Score",      weight: "15pts", desc: "Transaction volume + search interest + rental absorption rate." },
            { icon: "🏅", label: "Golden Visa",       weight: "10pts", desc: "Properties ≥ AED 2M qualify for 10yr UAE Golden Visa — drives demand." },
            { icon: "🏖️", label: "STR Potential",    weight: "15pts", desc: "Short-term rental income potential based on Airbnb/Booking.com data." },
            { icon: "🏢", label: "Developer Quality", weight: "10pts", desc: "Delivery track record, S&P rating, escrow compliance, and backlog health." },
          ].map((m, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{m.icon} {m.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, background: "rgba(212,168,67,0.1)", padding: "2px 8px", borderRadius: 6 }}>{m.weight}</div>
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>{m.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
          <strong style={{ color: T.textSecondary }}>Signal thresholds:</strong> BUY = 75+/100 · HOLD = 55–74 · SELL/AVOID = below 55. Scores are recalculated quarterly using latest DLD, REIDIN, and ValuStrat data. Not financial advice — always conduct your own due diligence.
        </div>
      </Section>

      <TabSources sources={[
        { label: "Dubai Land Department",     url: "https://dubailand.gov.ae" },
        { label: "REIDIN Dec 2025",           url: "https://reidin.com" },
        { label: "Property Monitor DPI",      url: "https://propertymonitor.com" },
        { label: "ValuStrat Q4 2025" },
        { label: "Knight Frank Dubai 2025",   url: "https://www.knightfrank.com/research" },
        { label: "Bayut Annual Report 2025",  url: "https://www.bayut.com" },
      ]} />
    </>
  );
};

export default InvestmentScoreTab;
