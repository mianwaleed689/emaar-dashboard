import React from "react";
import { T } from "../../../styles/theme";

const LaunchCalendarTab = ({ getInvestmentScore, TabSources }) => {
  const launches = [
    { name: "Palmiera 2 — The Oasis", community: "The Oasis", date: "Q1 2026", status: "launched", expectedPrice: 4200000, type: "Villa", beds: "4–6 BR", paymentPlan: "80/20", goldenVisa: true, notes: "Second phase of The Oasis mega-project. Lagoon-facing plots." },
    { name: "Savanna — Arabian Ranches III", community: "Arabian Ranches III", date: "Q1 2026", status: "launched", expectedPrice: 2100000, type: "Townhouse", beds: "3–4 BR", paymentPlan: "80/20", goldenVisa: true, notes: "Final townhouse phase in AR3. Near community centre." },
    { name: "Address Residences — Dubai Creek", community: "Dubai Creek Harbour", date: "Q2 2026", status: "upcoming", expectedPrice: 3500000, type: "Apartment", beds: "1–3 BR", paymentPlan: "70/30", goldenVisa: true, notes: "Branded Address tower at Creek Marina. Expected May 2026." },
    { name: "Grove — Creek Harbour", community: "Dubai Creek Harbour", date: "Q2 2026", status: "upcoming", expectedPrice: 1800000, type: "Apartment", beds: "Studio–2 BR", paymentPlan: "80/20", goldenVisa: false, notes: "Affordable entry into Creek Harbour. High rental demand community." },
    { name: "The Valley Phase 3", community: "The Valley", date: "Q2 2026", status: "upcoming", expectedPrice: 1600000, type: "Townhouse", beds: "3–5 BR", paymentPlan: "80/20", goldenVisa: false, notes: "Next phase of The Valley. Expected strong demand from end-users." },
    { name: "Seascape — Emaar Beachfront", community: "Emaar Beachfront", date: "Q3 2026", status: "rumoured", expectedPrice: 4800000, type: "Apartment", beds: "2–4 BR", paymentPlan: "60/40", goldenVisa: true, notes: "New beachfront tower. Expected to sell out within days of launch." },
    { name: "Grand Bleu Tower 3", community: "Emaar Beachfront", date: "Q3 2026", status: "rumoured", expectedPrice: 6500000, type: "Apartment", beds: "2–4 BR", paymentPlan: "70/30", goldenVisa: true, notes: "Elie Saab branded. Ultra-premium pricing expected." },
    { name: "Hills Park 2 — Dubai Hills", community: "Dubai Hills Estate", date: "Q3 2026", status: "rumoured", expectedPrice: 1400000, type: "Apartment", beds: "1–3 BR", paymentPlan: "80/20", goldenVisa: false, notes: "Adjacent to Hills Park 1. Park-facing units expected to sell fast." },
    { name: "The Heights — Dubai Hills", community: "Dubai Hills Estate", date: "Q4 2026", status: "rumoured", expectedPrice: 2800000, type: "Villa", beds: "3–5 BR", paymentPlan: "80/20", goldenVisa: true, notes: "Premium villas in DHE. Limited supply expected." },
    { name: "Riverside — The Oasis", community: "The Oasis", date: "Q4 2026", status: "rumoured", expectedPrice: 5200000, type: "Villa", beds: "5–6 BR", paymentPlan: "70/30", goldenVisa: true, notes: "Ultra-luxury riverside plots. AED 5M+ bracket." },
    { name: "Creek Crescent Phase 2", community: "Dubai Creek Harbour", date: "Q1 2027", status: "pipeline", expectedPrice: 2200000, type: "Apartment", beds: "1–3 BR", paymentPlan: "TBD", goldenVisa: true, notes: "Expansion of Creek Crescent. Strong resale market expected." },
    { name: "Downtown Hills", community: "Dubai Hills Estate", date: "Q2 2027", status: "pipeline", expectedPrice: 3100000, type: "Apartment", beds: "2–4 BR", paymentPlan: "TBD", goldenVisa: true, notes: "Premium mid-rise adjacent to DHE Mall. High occupancy expected." },
  ];
  const statusColors = { launched: "#10B981", upcoming: T.gold, rumoured: "#8B5CF6", pipeline: T.textMuted };
  const statusLabels = { launched: "Launched", upcoming: "Upcoming", rumoured: "Rumoured", pipeline: "Pipeline" };
  const groups = ["launched", "upcoming", "rumoured", "pipeline"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Off-Plan Launch Calendar</div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Upcoming Emaar launches · 2026–2027 · Updated weekly</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {groups.map(s => (
              <div key={s} style={{ padding: "5px 12px", borderRadius: 8, background: `${statusColors[s]}15`, border: `1px solid ${statusColors[s]}40`, fontSize: 11, fontWeight: 600, color: statusColors[s] }}>
                {statusLabels[s]} · {launches.filter(l => l.status === s).length}
              </div>
            ))}
          </div>
        </div>
      </div>

      {groups.map(status => {
        const items = launches.filter(l => l.status === status);
        if (!items.length) return null;
        return (
          <div key={status} style={{ background: T.surface, borderRadius: 16, border: `1px solid ${statusColors[status]}30`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", background: `${statusColors[status]}08`, borderBottom: `1px solid ${statusColors[status]}20`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColors[status] }} />
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: statusColors[status] }}>{statusLabels[status]}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{items.length} project{items.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {items.map((l, i) => {
                const inv = getInvestmentScore({ price: l.expectedPrice, paymentPlan: l.paymentPlan, handover: null, ppsf: null, gross: null });
                return (
                  <div key={i} style={{ padding: "16px 20px", borderRight: "1px solid " + T.border, borderBottom: "1px solid " + T.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 2 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{l.community}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: statusColors[status] }}>{l.date}</div>
                        {l.goldenVisa && <div style={{ fontSize: 9, color: T.gold, fontWeight: 600, marginTop: 2 }}>GV Eligible</div>}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      {[
                        { l: "FROM", v: l.expectedPrice ? "AED " + (l.expectedPrice / 1e6).toFixed(1) + "M" : "TBD" },
                        { l: "TYPE", v: l.type + " · " + l.beds },
                        { l: "PAYMENT", v: l.paymentPlan },
                      ].map(k => (
                        <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 6, padding: "6px 8px" }}>
                          <div style={{ fontSize: 8, color: T.textMuted, marginBottom: 2 }}>{k.l}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{l.notes}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: `${inv.color}15`, border: `1px solid ${inv.color}30` }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: inv.color }}>{inv.score}/10</span>
                      <span style={{ fontSize: 9, color: inv.color }}>* {inv.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ padding: "12px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMuted }}>
        Launch dates and prices are estimates based on market intelligence. Always verify with official Emaar sources before making investment decisions.
      </div>
      <TabSources sources={[
        { label: "Emaar Press Releases", url: "https://www.emaar.com/en/media/press-releases/" },
        { label: "Property Finder New Launches", url: "https://www.propertyfinder.ae" },
        { label: "DLD Oqood Off-Plan Registry", url: "https://oqood.dubailand.gov.ae" },
        { label: "Zawya Real Estate News", url: "https://www.zawya.com" },
      ]} />
    </div>
  );
};

export default LaunchCalendarTab;
