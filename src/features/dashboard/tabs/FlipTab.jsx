import React from "react";
import { T } from "../../../styles/theme";

/**
 * FlipTab — Buy-at-launch / sell-at-handover profit calculator with full fee breakdown
 */
const FlipTab = ({
  activeProjects,
  flipProjId,    setFlipProjId,
  flipBuyPrice,  setFlipBuyPrice,
  flipSellPrice, setFlipSellPrice,
  flipPaymentPlan, setFlipPaymentPlan,
  flipHoldYears,   setFlipHoldYears,
  flipIncludeRental, setFlipIncludeRental,
  flipRentalYield,   setFlipRentalYield,
  TabSources,
}) => {
  const selectedFlipProj = activeProjects.find(p => p.id === flipProjId) || activeProjects[0] || null;
  const buyPrice    = flipBuyPrice;
  const setBuyPrice = setFlipBuyPrice;
  const sellPrice   = flipSellPrice;
  const setSellPrice = setFlipSellPrice;
  const paymentPlan  = flipPaymentPlan;
  const setPaymentPlan = setFlipPaymentPlan;
  const holdYears    = flipHoldYears;
  const setHoldYears = setFlipHoldYears;
  const includeRental = flipIncludeRental;
  const setIncludeRental = setFlipIncludeRental;
  const rentalYield  = flipRentalYield;
  const setRentalYield = setFlipRentalYield;

  const handleProjSelect = (p) => {
    setFlipProjId(p.id);
    setFlipBuyPrice(p.price || 2000000);
    setFlipSellPrice(Math.round((p.price || 2000000) * 1.25));
  };

  const planConfigs = {
    "80_20": { name: "80/20 Plan", downPct: 20,  duringConst: 60, onHandover: 20, label: "20% now, 60% during, 20% on handover" },
    "60_40": { name: "60/40 Plan", downPct: 10,  duringConst: 50, onHandover: 40, label: "10% now, 50% during, 40% on handover" },
    "cash":  { name: "Full Cash",  downPct: 100, duringConst: 0,  onHandover: 0,  label: "100% upfront" },
  };
  const plan = planConfigs[paymentPlan];

  const downPayment   = Math.round(buyPrice * plan.downPct / 100);
  const dldBuy        = Math.round(buyPrice * 0.04);
  const agencyBuy     = Math.round(buyPrice * 0.02);
  const adminFees     = 4200 + 580;
  const totalCashIn   = downPayment + dldBuy + agencyBuy + adminFees;
  const agencySell    = Math.round(sellPrice * 0.02);
  const noc           = 5000;
  const transferFee   = 4200;
  const totalSellCost = agencySell + noc + transferFee;
  const annualRent    = includeRental ? Math.round(sellPrice * rentalYield / 100) : 0;
  const totalRent     = Math.round(annualRent * holdYears * 0.85);
  const grossProfit   = sellPrice - buyPrice;
  const netProfit     = grossProfit - dldBuy - agencyBuy - adminFees - totalSellCost + totalRent;
  const roi           = (netProfit / totalCashIn) * 100;
  const annualizedRoi = (Math.pow(1 + roi / 100, 1 / holdYears) - 1) * 100;
  const isProfit      = netProfit > 0;

  const fmt  = (n) => "AED " + Math.abs(Math.round(n)).toLocaleString();
  const fmtM = (n) => Math.abs(n) >= 1000000 ? (n / 1000000).toFixed(2) + "M" : Math.abs(n) >= 1000 ? (n / 1000).toFixed(0) + "K" : n.toString();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Hero summary bar */}
      <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))", borderRadius: 16, border: "1px solid rgba(59,130,246,0.25)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.blue, marginBottom: 4 }}>Flip Profit Calculator</div>
          <div style={{ fontSize: 13, color: T.textSecondary }}>Buy at launch. Sell at handover. See your exact profit after every fee.</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["Buy", fmt(totalCashIn), T.gold], ["Sell", fmt(sellPrice), T.green], ["Net", (isProfit ? "+" : "-") + fmt(netProfit), isProfit ? T.green : "#EF4444"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 16px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* LEFT: Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Project + prices */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Select Project</div>
            <select value={selectedFlipProj?.id || ""} onChange={e => { const p = activeProjects.find(x => x.id === e.target.value); if (p) handleProjSelect(p); }}
              style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", marginBottom: 12 }}>
              {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.community}</option>)}
            </select>

            {[["Buy Price (Launch)", buyPrice, setBuyPrice, T.gold], ["Sell Price (Target)", sellPrice, setSellPrice, T.green]].map(([label, val, setter, col]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.textSecondary }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                    <input type="number" value={val} min={500000} max={20000000} step={50000}
                      onChange={e => { const v = parseInt(e.target.value.replace(/,/g, "")) || 0; if (v >= 0) setter(v); }}
                      onBlur={e => { const v = parseInt(e.target.value) || 500000; setter(Math.min(20000000, Math.max(500000, v))); }}
                      style={{ width: 130, padding: "5px 10px", borderRadius: 8, border: "1px solid " + col, background: T.surfaceAlt, color: col, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", textAlign: "right", outline: "none" }} />
                  </div>
                </div>
                <input type="range" min={500000} max={20000000} step={50000} value={Math.min(20000000, Math.max(500000, val))} onChange={e => setter(+e.target.value)} style={{ width: "100%", accentColor: col }} />
              </div>
            ))}

            <div style={{ padding: "8px 12px", borderRadius: 8, background: sellPrice > buyPrice ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid " + (sellPrice > buyPrice ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>Price appreciation</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: sellPrice > buyPrice ? T.green : "#EF4444" }}>
                {sellPrice > buyPrice ? "+" : ""}{(((sellPrice - buyPrice) / buyPrice) * 100).toFixed(1)}% = {sellPrice > buyPrice ? "+" : ""}{fmt(sellPrice - buyPrice)}
              </span>
            </div>
          </div>

          {/* Deal structure */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Deal Structure</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Payment Plan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(planConfigs).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setPaymentPlan(k)}
                    style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid " + (paymentPlan === k ? T.blue : T.border), background: paymentPlan === k ? "rgba(59,130,246,0.1)" : T.surfaceAlt, color: paymentPlan === k ? T.blue : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                    <span style={{ fontWeight: 700 }}>{v.name}</span>
                    <span style={{ color: T.textMuted, marginLeft: 8 }}>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Hold Period</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>{holdYears} year{holdYears > 1 ? "s" : ""}</span>
              </div>
              <input type="range" min={1} max={7} step={1} value={holdYears} onChange={e => setHoldYears(+e.target.value)} style={{ width: "100%", accentColor: T.teal }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border }}>
              <div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>Include rental income?</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>Rent it out while waiting to sell</div>
              </div>
              <button type="button" onClick={() => setIncludeRental(v => !v)}
                style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: includeRental ? T.green : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: includeRental ? 21 : 3, transition: "left 0.2s" }} />
              </button>
            </div>

            {includeRental && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: T.textSecondary }}>Gross Rental Yield</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{rentalYield}%</span>
                </div>
                <input type="range" min={3} max={12} step={0.5} value={rentalYield} onChange={e => setRentalYield(+e.target.value)} style={{ width: "100%", accentColor: T.green }} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Big result */}
          <div style={{ background: isProfit ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))" : "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.04))", borderRadius: 14, border: "1px solid " + (isProfit ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"), padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Your Result</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                ["Cash You Put In", fmt(totalCashIn), T.gold, "Down payment + all buy fees"],
                ["You Sell For", fmt(sellPrice), T.green, "Your target exit price"],
                ["All Fees", fmt(dldBuy + agencyBuy + adminFees + totalSellCost), "#EF4444", "DLD + agency + NOC + transfer"],
                includeRental ? ["Rental Income", "+" + fmt(totalRent), T.teal, holdYears + " yrs × " + rentalYield + "% net 85%"] : ["Gross Profit", fmt(grossProfit), T.blue, "Sell price minus buy price"],
              ].map(([l, v, c, sub]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c, fontFamily: "'Fraunces',serif" }}>{v}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>NET PROFIT AFTER ALL FEES</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 900, color: isProfit ? T.green : "#EF4444" }}>
                {isProfit ? "+" : "-"}{fmt(netProfit)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.textMuted }}>ROI on cash invested</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isProfit ? T.green : "#EF4444" }}>{roi.toFixed(1)}%</div>
                </div>
                <div style={{ width: 1, background: T.border }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.textMuted }}>Annualized return</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>{annualizedRoi.toFixed(1)}% / yr</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee breakdown */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Full Fee Breakdown</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>When You Buy</div>
            {[
              ["Down Payment (" + plan.downPct + "%)", fmt(downPayment), T.gold],
              ["DLD Transfer Fee (4%)", fmt(dldBuy), T.textSecondary],
              ["Agency Fee (2%)", fmt(agencyBuy), T.textSecondary],
              ["Admin + Trustee", "AED 4,780", T.textSecondary],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + T.border }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{v}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>When You Sell</div>
            {[
              ["DLD (paid by buyer)", "AED 0", T.green],
              ["Agency Fee (2%)", fmt(agencySell), T.textSecondary],
              ["NOC from Developer", "AED 5,000", T.textSecondary],
              ["Transfer Fee", "AED 4,200", T.textSecondary],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + T.border }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.white }}>Total Fees</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>{fmt(dldBuy + agencyBuy + adminFees + totalSellCost)}</span>
            </div>
          </div>

          {/* Smart tip */}
          <div style={{ background: "rgba(212,168,67,0.06)", borderRadius: 12, border: "1px solid rgba(212,168,67,0.2)", padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 4 }}>Smart Tip</div>
            <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
              {paymentPlan === "80_20"
                ? `80/20 plan maximizes your leverage — you control ${fmt(buyPrice)} of property with only ${fmt(downPayment)} cash. Flip before handover to avoid paying the final 20%.`
                : paymentPlan === "60_40"
                ? "On a 60/40 plan, flip before handover to avoid the 40% balloon payment. Buyer takes over your SPA and pays you the profit."
                : "Full cash gives you the cleanest title deed and fastest resale — no developer approval needed for transfer."}
            </div>
          </div>
        </div>
      </div>

      <TabSources sources={[
        { label: "DLD Transaction Records",       url: "https://dubailand.gov.ae" },
        { label: "REIDIN Price Index",            url: "https://reidin.com" },
        { label: "Property Monitor" },
        { label: "DXB Interact Flip Analysis",    url: "https://dxbinteract.com" },
        { label: "fam Properties Research",       url: "https://famproperties.com" },
      ]} />
    </div>
  );
};

export default FlipTab;
