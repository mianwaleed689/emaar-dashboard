import React from "react";
import { T } from "../../../styles/theme";

/**
 * ServiceChargesTab — RERA service charge database with sortable table + net yield impact
 */
const ServiceChargesTab = ({
  liveServiceCharges,
  scSort,
  setScSort,
  TabSources,
}) => {
  const scDataStatic = [
    { community: "Downtown Dubai",      type: "Apartment",   low: 28, high: 38, avg: 32,  rera: true,  notes: "Burj Khalifa zone highest at AED 38. Older towers closer to AED 28." },
    { community: "Emaar Beachfront",    type: "Apartment",   low: 24, high: 32, avg: 28,  rera: true,  notes: "Sea-facing units attract premium SC due to beach maintenance." },
    { community: "Dubai Creek Harbour", type: "Apartment",   low: 18, high: 26, avg: 22,  rera: true,  notes: "New builds with efficient infrastructure. SC expected to rise as community matures." },
    { community: "Dubai Hills Estate",  type: "Apartment",   low: 15, high: 22, avg: 18,  rera: true,  notes: "Well-maintained. Park District higher end. Maple higher than Acacia." },
    { community: "Dubai Hills Estate",  type: "Villa",       low: 3,  high: 6,  avg: 4.5, rera: true,  notes: "Villas charged per sqft of plot. Substantially lower than apartments." },
    { community: "Arabian Ranches III", type: "Townhouse",   low: 12, high: 16, avg: 14,  rera: true,  notes: "Newer community with competitive SC. Includes park maintenance." },
    { community: "The Valley",          type: "Townhouse",   low: 10, high: 14, avg: 12,  rera: false, notes: "Estimated. Community still developing. RERA registration pending." },
    { community: "The Oasis",           type: "Villa",       low: 16, high: 24, avg: 20,  rera: false, notes: "Ultra-luxury facilities and lagoon maintenance push SC higher than typical villas." },
    { community: "Address Residences",  type: "Branded Apt", low: 38, high: 55, avg: 46,  rera: true,  notes: "Branded residences command highest SC. Hotel services included in fee." },
    { community: "Vida Residences",     type: "Branded Apt", low: 30, high: 42, avg: 36,  rera: true,  notes: "Vida brand properties. Includes access to hotel amenities." },
  ];

  const scData = liveServiceCharges.length > 0
    ? liveServiceCharges.map(d => ({
        community: d.community, type: "Apartment",
        low:  parseFloat(d.chargePerSqft) * 0.85 || 0,
        high: parseFloat(d.chargePerSqft) * 1.15 || 0,
        avg:  parseFloat(d.chargePerSqft) || 0,
        rera: true,
        notes: `${d.community} · AED ${d.totalFor1BR || 0}/yr for 1BR · AED ${d.totalFor2BR || 0}/yr for 2BR`
      }))
    : scDataStatic;

  const maxSC = Math.max(...scData.map(d => d.high));
  const sorted = [...scData].sort((a, b) =>
    scSort === "avg"       ? b.avg - a.avg :
    scSort === "community" ? a.community.localeCompare(b.community) :
    b.high - a.high
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Service Charge Database</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>AED per sqft per year · RERA-regulated · Affects net yield</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["avg", "By Average"], ["high", "By Highest"], ["community", "A–Z"]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setScSort(v)}
                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${scSort === v ? T.gold : T.border}`, background: scSort === v ? "rgba(212,168,67,0.1)" : T.surfaceAlt, color: scSort === v ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
          {[
            { label: "Lowest SC",    value: "AED 3/sqft",      sub: "DHE Villas",       color: "#10B981" },
            { label: "Highest SC",   value: "AED 55/sqft",     sub: "Address Branded",  color: "#EF4444" },
            { label: "Avg Apartment", value: "AED 24/sqft",    sub: "Portfolio average", color: T.gold },
            { label: "Impact on 1BR", value: "AED 18–40K/yr",  sub: "800 sqft typical", color: T.blue },
          ].map(k => (
            <div key={k.label} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>{k.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                {["Community", "Type", "Low", "Avg", "High", "Range", "RERA", "Notes"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const barWidth = (d.avg / maxSC) * 100;
                const scColor = d.avg <= 15 ? "#10B981" : d.avg <= 25 ? T.gold : d.avg <= 35 ? "#F59E0B" : "#EF4444";
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px" }}><div style={{ fontWeight: 700, color: T.white, fontSize: 13 }}>{d.community}</div></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: T.surfaceAlt, color: T.textSecondary, fontWeight: 600 }}>{d.type}</span></td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{d.low}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: scColor, fontFamily: "'Fraunces', serif" }}>{d.avg}</span>
                      <span style={{ fontSize: 10, color: T.textMuted }}> /sqft</span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{d.high}</td>
                    <td style={{ padding: "12px 14px", minWidth: 120 }}>
                      <div style={{ height: 6, borderRadius: 3, background: T.surfaceAlt, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: barWidth + "%", background: scColor, borderRadius: 3 }} />
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, color: d.rera ? "#10B981" : T.textMuted }}>{d.rera ? "✓ RERA" : "Est."}</span></td>
                    <td style={{ padding: "12px 14px", fontSize: 11, color: T.textMuted, maxWidth: 220 }}>{d.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Net yield impact explainer */}
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid rgba(212,168,67,0.2)`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold, marginBottom: 4 }}>💡 Why Service Charges Matter</div>
        <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7 }}>
          A 7% gross yield on a AED 2M apartment = AED 140,000/year rental income. But on a 1,200 sqft unit with AED 28/sqft SC, you pay AED 33,600/year in service charges — reducing your <strong style={{ color: T.white }}>net yield to 5.3%</strong>. On a lower-SC community like Arabian Ranches (AED 14/sqft), the same calculation gives you a <strong style={{ color: "#10B981" }}>net yield of 6.2%</strong>. Always calculate net, not gross.
        </div>
      </div>

      <TabSources sources={[
        { label: "RERA Dubai (rera.gov.ae)", url: "https://www.rera.gov.ae" },
        { label: "Mollak Service Charge Database" },
        { label: "Owners Associations — Published Budgets" },
        { label: "DLD Owner Portal" },
        { label: "Asteco Facilities Management" },
      ]} />
    </div>
  );
};

export default ServiceChargesTab;
