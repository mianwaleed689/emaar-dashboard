import React from "react";
import { T } from "../../../styles/theme";

/**
 * GoldenVisaTab — UAE Golden Visa eligibility calculator + qualifying projects
 */
const GoldenVisaTab = ({
  activeProjects,
  setSelectedProject,
  setTab,
  gvPropPrice, setGvPropPrice,
  gvPaymentPlan, setGvPaymentPlan,
  gvNationality, setGvNationality,
  gvSelectedProj, setGvSelectedProj,
  TabSources,
}) => {
  const propPrice = gvPropPrice;
  const setPropPrice = setGvPropPrice;
  const paymentPlan = gvPaymentPlan;
  const setPaymentPlan = setGvPaymentPlan;
  const nationality = gvNationality;
  const setNationality = setGvNationality;

  const THRESHOLD = 2000000;
  const eligible = propPrice >= THRESHOLD;
  const gap = Math.max(0, THRESHOLD - propPrice);

  const minDownPct = (nationality === "uae" || nationality === "gcc") ? 15 : 20;
  const isAlreadyResident = nationality === "uae";
  const dldExemption = nationality === "uae";

  const govFees = Math.round(propPrice * (dldExemption ? 0.02 : 0.04) + 580 + 4020 + 2000);
  const visaFee = isAlreadyResident ? 0 : 3780 + 1220;
  const downPayment = Math.round(propPrice * (minDownPct / 100));
  const totalUpfront = paymentPlan === "cash"
    ? propPrice + govFees + visaFee
    : downPayment + govFees + visaFee;

  const qualifyingProjects = activeProjects.filter(p => (p.price || 0) >= THRESHOLD).sort((a, b) => (a.price || 0) - (b.price || 0));
  const nearProjects = activeProjects.filter(p => { const pr = p.price || 0; return pr >= 1500000 && pr < THRESHOLD; }).sort((a, b) => (a.price || 0) - (b.price || 0));

  const benefits = [
    { icon: "✅", title: "10-Year Residency", desc: "Live, work and study in UAE. Renewable indefinitely." },
    { icon: "👨‍👩‍👧", title: "Sponsor Your Family", desc: "Spouse, children of any age, and parents included." },
    { icon: "💼", title: "No Sponsor Needed", desc: "Full independence — no employer or local sponsor required." },
    { icon: "🏦", title: "UAE Bank Accounts", desc: "Open accounts, get credit cards, build UAE credit history." },
    { icon: "✈️", title: "Travel Freely", desc: "Re-enter UAE after 6+ months abroad without visa reset." },
    { icon: "💰", title: "0% Income Tax", desc: "No personal income tax on rental income or capital gains." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))", borderRadius: 16, border: "1px solid rgba(212,168,67,0.3)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, marginBottom: 4 }}>UAE Golden Visa Calculator</div>
          <div style={{ fontSize: 13, color: T.textSecondary }}>Find out if your Emaar investment qualifies for a 10-year UAE residency visa</div>
        </div>
        <div style={{ background: "rgba(212,168,67,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)" }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>MINIMUM INVESTMENT</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold }}>AED 2,000,000</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Real estate (title deed value)</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Left: Calculator */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Your Property</div>

            {/* Price slider */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Property Price</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                  <input type="number" value={propPrice} min={500000} max={15000000} step={50000}
                    onChange={e => { const v = parseInt(e.target.value) || 0; if (v >= 0) setPropPrice(v); }}
                    onBlur={e => { const v = parseInt(e.target.value) || 500000; setPropPrice(Math.min(15000000, Math.max(500000, v))); }}
                    style={{ width: 130, padding: "5px 10px", borderRadius: 8, border: "1px solid " + (eligible ? T.green : T.gold), background: T.surfaceAlt, color: eligible ? T.green : T.gold, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", textAlign: "right", outline: "none" }} />
                </div>
              </div>
              <input type="range" min={500000} max={15000000} step={50000} value={Math.min(15000000, Math.max(500000, propPrice))} onChange={e => setPropPrice(+e.target.value)} style={{ width: "100%", accentColor: eligible ? T.green : T.gold }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: T.textMuted }}>AED 500K</span>
                <span style={{ fontSize: 10, color: T.textMuted }}>AED 15M</span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Payment Method</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["cash", "Full Cash"], ["mortgage", "Mortgage"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPaymentPlan(v)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid " + (paymentPlan === v ? T.gold : T.border), background: paymentPlan === v ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: paymentPlan === v ? T.gold : T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                ))}
              </div>
              {paymentPlan === "mortgage" && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, color: T.blue }}>
                  {nationality === "uae" || nationality === "gcc"
                    ? `UAE/GCC nationals: minimum ${minDownPct}% down payment required.`
                    : "Expats: minimum 20% down payment. Title deed must be clear for Golden Visa eligibility."}
                </div>
              )}
            </div>

            {/* Nationality */}
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Your Nationality</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[["uae", "UAE National"], ["gcc", "GCC National"], ["other", "Other"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setNationality(v)}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + (nationality === v ? T.teal : T.border), background: nationality === v ? "rgba(45,212,191,0.1)" : T.surfaceAlt, color: nationality === v ? T.teal : T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Eligibility result card */}
          <div style={{ background: eligible ? "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))" : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.04))", borderRadius: 14, border: "1px solid " + (eligible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"), padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 28 }}>{isAlreadyResident ? "🇦🇪" : eligible ? "✅" : "❌"}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isAlreadyResident ? T.gold : eligible ? T.green : "#EF4444" }}>
                  {isAlreadyResident ? "You Already Have UAE Residency" : eligible ? "You Qualify for the Golden Visa!" : "Not Eligible Yet"}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                  {isAlreadyResident ? "You can still use this investment to sponsor family for Golden Visa" : eligible ? "Your investment meets the AED 2M threshold" : "AED " + gap.toLocaleString() + " more needed to qualify"}
                </div>
              </div>
            </div>

            {!eligible && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Progress to eligibility</span>
                  <span style={{ fontSize: 11, color: T.gold }}>{Math.round(propPrice / THRESHOLD * 100)}%</span>
                </div>
                <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: Math.min(100, propPrice / THRESHOLD * 100) + "%", background: `linear-gradient(90deg,${T.gold},#B8912F)`, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Property Value", "AED " + propPrice.toLocaleString(), eligible ? T.green : T.gold],
                ["Min Down Payment", minDownPct + "% = AED " + downPayment.toLocaleString(), T.teal],
                ["DLD Fees", (dldExemption ? "2%" : "4%") + " = AED " + Math.round(propPrice * (dldExemption ? 0.02 : 0.04)).toLocaleString(), T.textSecondary],
                ["Visa Fees", isAlreadyResident ? "Not required" : "AED " + visaFee.toLocaleString(), isAlreadyResident ? T.textMuted : T.textSecondary],
                ["Total Day-1 Cost", "AED " + totalUpfront.toLocaleString(), T.gold],
                ["Visa Duration", isAlreadyResident ? "N/A (citizen)" : "10 Years", T.teal],
              ].map(([l, v, c]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Benefits + projects */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>What You Get</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.white, marginBottom: 2 }}>{b.title}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualifying projects */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Emaar Projects That Qualify</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>{qualifyingProjects.length} projects at AED 2M+</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {qualifyingProjects.slice(0, 12).map(p => (
                <div key={p.id} onClick={() => { setSelectedProject(p); setTab("Projects"); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: T.surfaceAlt, border: "1px solid transparent", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.borderColor = T.green; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = "transparent"; }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>AED {p.price ? (p.price / 1e6).toFixed(2) + "M" : "2M+"}</div>
                      <div style={{ fontSize: 10, color: T.gold }}>✓ Eligible</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              ))}
            </div>

            {nearProjects.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + T.border }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Almost There (AED 1.5M–2M)</div>
                {nearProjects.slice(0, 4).map(p => (
                  <div key={p.id} onClick={() => { setSelectedProject(p); setTab("Projects"); }}
                    style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: T.surfaceAlt, cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.08)"; e.currentTarget.style.borderColor = T.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = "transparent"; }}>
                    <div>
                      <div style={{ fontSize: 11, color: T.white }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.gold }}>AED {p.price ? (p.price / 1e6).toFixed(2) + "M" : "TBC"}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{p.price ? "AED " + ((THRESHOLD - p.price) / 1000).toFixed(0) + "K short" : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div style={{ background: T.surface, borderRadius: 12, border: "1px solid " + T.border, padding: "14px 20px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {[
          ["📅", "Visa Duration", "10 years, renewable indefinitely"],
          ["🏠", "Property Type", "Residential & commercial — off-plan or ready"],
          ["💳", "Mortgage OK?", "Yes — but title deed must show AED 2M+ value"],
          ["⏳", "Processing Time", "Approx. 30 days after title deed issuance"],
          ["👥", "Family", "Spouse + children of any age included"],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 160, flex: 1 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{title}</div>
              <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <TabSources sources={[
        { label: "UAE ICP — Golden Visa", url: "https://icp.gov.ae" },
        { label: "GDRFA Dubai", url: "https://gdrfad.gov.ae" },
        { label: "Federal Authority for Identity (ICP)", url: "https://icp.gov.ae" },
        { label: "Emaar.com — Project prices" },
        { label: "Dubai Economy & Tourism", url: "https://www.visitdubai.com" },
      ]} />
    </div>
  );
};

export default GoldenVisaTab;
