import React from "react";
import { T } from "../../../styles/theme";

const BANK_SPREAD = 1.50;

/**
 * MortgageTab — Interactive mortgage calculator with live EIBOR rates,
 * project picker, 4 plain-English answers, and bank rate comparison table.
 */
const MortgageTab = ({
  activeProjects,
  emaarCommunities,
  liveMortgageRates,
  db,
  getDoc,
  doc,
  Section,
  TabSources,
}) => {
  const MortgageCalc = () => {
    const [selectedProjectId, setSelectedProjectId] = React.useState("");
    const [propPrice, setPropPrice] = React.useState(2000000);
    const [downPct, setDownPct] = React.useState(20);
    const EIBOR_RATES = { on: 3.473, "1w": 3.577, "1m": 3.635, "3m": 3.593, "6m": 3.676, "1y": 3.674, asOf: "27 Feb 2026" };
    const [rate, setRate] = React.useState(parseFloat((EIBOR_RATES["3m"] + BANK_SPREAD).toFixed(2)));
    const [liveEibor, setLiveEibor] = React.useState(EIBOR_RATES);
    const [eiborSource, setEiborSource] = React.useState("CBUAE · " + EIBOR_RATES.asOf);
    const [years, setYears] = React.useState(25);
    const [isUAENational, setIsUAENational] = React.useState(false);
    const [grossYieldPct, setGrossYieldPct] = React.useState(6.9);

    React.useEffect(() => {
      getDoc(doc(db, "tabData", "eiborRates")).then(snap => {
        if (snap.exists()) {
          const e = snap.data();
          if (e["3m"] && e["3m"] > 1) {
            setLiveEibor(e);
            setEiborSource((e.source || "CBUAE") + " · " + (e.asOf || ""));
            setRate(parseFloat((e["3m"] + BANK_SPREAD).toFixed(2)));
          }
        }
      }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
      if (!selectedProjectId) return;
      const p = activeProjects.find(x => String(x.id) === selectedProjectId);
      if (p && p.price) setPropPrice(p.price);
      if (p) {
        const comm = emaarCommunities.find(c => c.name === p.community);
        if (comm && comm.avgYield) setGrossYieldPct(comm.avgYield);
      }
    }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

    const downAmt = propPrice * downPct / 100;
    const loanAmt = propPrice - downAmt;
    const mr = rate / 100 / 12;
    const np = years * 12;
    const monthly = loanAmt * (mr * Math.pow(1 + mr, np)) / (Math.pow(1 + mr, np) - 1);
    const dldFee = propPrice * 0.04;
    const agencyFee = propPrice * 0.02;
    const totalUpfront = downAmt + dldFee + agencyFee + 4200 + 580;
    const monthlyRent = propPrice * grossYieldPct / 100 / 12;
    const monthlyExpenses = (propPrice * 0.015 / 12) + (monthlyRent * 0.08);
    const netRent = monthlyRent - monthlyExpenses;
    const cashflow = netRent - monthly;
    const cashOnCash = (cashflow * 12 / totalUpfront) * 100;
    const fmt = n => "AED " + Math.round(n).toLocaleString();
    const fmtM = n => "AED " + (n / 1e6).toFixed(2) + "M";

    const answers = [
      { q: "Can I afford this?", icon: "1️⃣", answer: fmt(monthly) + " / month", detail: "That's your mortgage payment every month for " + years + " years. Based on " + downPct + "% down at " + rate + "% interest.", color: T.gold, bg: "rgba(212,168,67,0.08)", border: "rgba(212,168,67,0.25)" },
      { q: "Will rent cover my mortgage?", icon: "2️⃣", answer: cashflow >= 0 ? "Yes — you pocket " + fmt(cashflow) + "/mo" : "No — you top up " + fmt(Math.abs(cashflow)) + "/mo", detail: "Estimated rent is " + fmt(monthlyRent) + "/mo. After service charges, management fees, and your mortgage, you " + (cashflow >= 0 ? "make a profit of " + fmt(cashflow) + " every month." : "need to cover a shortfall of " + fmt(Math.abs(cashflow)) + " per month."), color: cashflow >= 0 ? T.green : "#EF4444", bg: cashflow >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: cashflow >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)" },
      { q: "What's my actual return on cash?", icon: "3️⃣", answer: cashOnCash.toFixed(1) + "% per year", detail: "You put in " + fmtM(totalUpfront) + " of your own money (down payment + fees). Your annual return on that specific cash is " + cashOnCash.toFixed(1) + "%. A savings account gives ~4%. Dubai average is 5–8%.", color: cashOnCash >= 5 ? T.green : cashOnCash >= 0 ? T.gold : "#EF4444", bg: cashOnCash >= 5 ? "rgba(16,185,129,0.08)" : "rgba(212,168,67,0.08)", border: cashOnCash >= 5 ? "rgba(16,185,129,0.25)" : "rgba(212,168,67,0.25)" },
      { q: "How much do I need on day one?", icon: "4️⃣", answer: fmtM(totalUpfront), detail: "Down payment " + fmtM(downAmt) + " + DLD transfer fee " + fmt(dldFee) + " (4%) + agency fee " + fmt(agencyFee) + " (2%) + mortgage registration AED 4,200 + valuation AED 580. Have this ready before you sign.", color: T.blue, bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* EIBOR Live Rate Card */}
        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 16, padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: 1, textTransform: "uppercase" }}>EIBOR · {eiborSource}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Emirates Interbank Offered Rate · UAE Central Bank benchmark</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["1M", liveEibor?.["1m"]], ["3M", liveEibor?.["3m"]], ["6M", liveEibor?.["6m"]], ["1Y", liveEibor?.["1y"]]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: label === "3M" ? "#10B981" : T.white }}>{val ? val.toFixed(3) : "—"}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "12px 16px", textAlign: "center", minWidth: 140 }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>3M EIBOR + {BANK_SPREAD}% spread</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: "#10B981" }}>{(liveEibor?.["3m"] + BANK_SPREAD).toFixed(2)}%</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Typical variable rate</div>
              <button type="button" onClick={() => setRate(parseFloat((liveEibor?.["3m"] + BANK_SPREAD).toFixed(2)))}
                style={{ marginTop: 8, padding: "4px 12px", borderRadius: 6, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Apply to Calculator ↓
              </button>
            </div>
          </div>
        </div>

        {/* Project picker */}
        <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Step 1 — Pick a project (or set price manually below)</div>
          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 10, color: selectedProjectId ? T.white : T.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
            <option value="">— Choose a project to auto-fill price —</option>
            {activeProjects.filter(p => p.price).map(p => (
              <option key={p.id} value={String(p.id)}>{p.name} · {p.community} · AED {(p.price / 1e6).toFixed(2)}M</option>
            ))}
          </select>
        </div>

        {/* Sliders */}
        <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 18 }}>Step 2 — Adjust your numbers</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
            {[
              { label: "Property Price", value: propPrice, set: setPropPrice, min: 500000, max: 20000000, step: 100000, disp: fmtM(propPrice) },
              { label: "Down Payment", value: downPct, set: setDownPct, min: isUAENational ? 15 : 20, max: 80, step: 1, disp: downPct + "% = " + fmtM(downAmt) },
              { label: "Interest Rate", value: rate, set: setRate, min: 2, max: 12, step: 0.1, disp: rate + "% per year" },
              { label: "Loan Term", value: years, set: setYears, min: 5, max: 25, step: 1, disp: years + " years" },
              { label: "Expected Rental Yield", value: grossYieldPct, set: setGrossYieldPct, min: 3, max: 12, step: 0.1, disp: grossYieldPct + "% per year" },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: T.textSecondary }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{f.disp}</span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={e => f.set(Number(e.target.value))} style={{ width: "100%", accentColor: T.gold, cursor: "pointer" }} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.textSecondary }}>
                <input type="checkbox" checked={isUAENational} onChange={e => { setIsUAENational(e.target.checked); if (e.target.checked && downPct < 15) setDownPct(15); }} style={{ accentColor: T.gold, width: 16, height: 16 }} />
                I am a UAE National (15% min down)
              </label>
            </div>
          </div>
        </div>

        {/* 4 answers */}
        <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase" }}>Step 3 — Your answers</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {answers.map((a, i) => (
            <div key={i} style={{ background: a.bg, borderRadius: 16, border: "1px solid " + a.border, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{a.q}</span>
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 900, color: a.color, marginBottom: 10 }}>{a.answer}</div>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{a.detail}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Section title="Mortgage Calculator" sub="4 questions every Dubai property buyer needs answered">
        <MortgageCalc />
      </Section>

      {liveMortgageRates.length > 0 && (
        <Section title="Bank Rate Comparison" sub="Updated via Admin · Live rates from UAE banks">
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Bank", "Rate (p.a.)", "Max LTV", "Processing Fee", "Min Salary", "Notes"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: h === "Bank" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...liveMortgageRates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)).map((b, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 12px", color: i === 0 ? T.gold : T.white, fontWeight: 600 }}>
                      {b.bank}{i === 0 && <span style={{ marginLeft: 6, fontSize: 9, color: T.green, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.1)" }}>BEST</span>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: i === 0 ? T.green : T.textSecondary, fontWeight: 600, fontFamily: "'Fraunces',serif" }}>{b.rate}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>{b.maxLTV}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>{b.processingFee}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>AED {parseInt(b.minSalary || 0).toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, color: T.textMuted }}>{b.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <TabSources sources={[
        { label: "CBUAE — UAE Base Rate", url: "https://www.cbuae.gov.ae" },
        { label: "EIBOR 3M: 3.593% (Feb 2026) · CBUAE", url: "https://www.centralbank.ae/en/forex-eibor/eibor-rates/" },
        { label: "DLD Fee Schedule (4%)", url: "https://dubailand.gov.ae" },
        { label: "UAE Mortgage Law (No. 14 of 2008)" },
        { label: "Property Finder Mortgage Rates", url: "https://www.propertyfinder.ae" },
      ]} />
    </>
  );
};

export default MortgageTab;
