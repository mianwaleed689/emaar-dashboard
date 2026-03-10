import React from "react";
import { T } from "../../../styles/theme";

/**
 * HandoverTab — Handover tracker with ready/upcoming/future project groupings
 */
const HandoverTab = ({
  activeProjects,
  setSelectedProject,
  getHandoverCountdown,
  getInvestmentScore,
  TabSources,
}) => {
  const allHandover = activeProjects
    .map(p => ({ ...p, _cd: getHandoverCountdown(p.handover), _score: getInvestmentScore(p) }))
    .filter(p => p.handover)
    .sort((a, b) => {
      const getMs = p => { const cd = p._cd; if (!cd) return Infinity; if (cd.passed) return -1; return cd.days || 99999; };
      return getMs(a) - getMs(b);
    });

  const delivering = allHandover.filter(p => p._cd && (p._cd.passed || p._cd.months <= 12));
  const nextYear = allHandover.filter(p => p._cd && !p._cd.passed && p._cd.months > 12 && p._cd.months <= 24);
  const beyond = allHandover.filter(p => p._cd && !p._cd.passed && p._cd.months > 24);
  const avgConstruction = allHandover.length ? Math.round(allHandover.reduce((a, p) => a + (p.construction || 0), 0) / allHandover.length) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Ready / Overdue", value: delivering.length, color: "#10B981", sub: "Keys available" },
          { label: "Next 12 Months", value: delivering.filter(p => p._cd && !p._cd.passed).length + " soon", color: T.gold, sub: "Upcoming handovers" },
          { label: "Avg Construction", value: avgConstruction + "%", color: T.blue, sub: "Across all projects" },
          { label: "Total Tracked", value: allHandover.length, color: T.textSecondary, sub: "With handover dates" },
        ].map(k => (
          <div key={k.label} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Ready / Overdue */}
      {delivering.length > 0 && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid rgba(16,185,129,0.25)`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "rgba(16,185,129,0.06)", borderBottom: `1px solid rgba(16,185,129,0.15)`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: "#10B981" }}>Ready for Handover</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{delivering.length} project{delivering.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {delivering.map((p, i) => (
              <div key={p.id} onClick={() => setSelectedProject(p)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < delivering.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke={T.border} strokeWidth="3" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#10B981" strokeWidth="3"
                      strokeDasharray={`${(p.construction || 100) / 100 * 113} 113`}
                      strokeLinecap="round" transform="rotate(-90 22 22)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#10B981" }}>{p.construction || 100}%</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: T.white, fontSize: 13, fontFamily: "'Fraunces', serif", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{p.community} · {p.handover}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{p.price ? "AED " + (p.price / 1e6).toFixed(1) + "M" : "TBD"}</div>
                  <div style={{ fontSize: 10, color: "#10B981", fontWeight: 600, marginTop: 2 }}>✓ Ready</div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 8, background: `${p._score.color}18`, border: `1px solid ${p._score.color}40`, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: p._score.color, fontFamily: "'Fraunces', serif" }}>{p._score.score}</div>
                  <div style={{ fontSize: 9, color: p._score.color }}>★ Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next 12–24 months */}
      {nextYear.length > 0 && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid rgba(212,168,67,0.2)`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "rgba(212,168,67,0.05)", borderBottom: `1px solid rgba(212,168,67,0.12)`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>Delivering in 12–24 Months</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{nextYear.length} project{nextYear.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {nextYear.map((p, i) => (
              <div key={p.id} onClick={() => setSelectedProject(p)}
                style={{ padding: "14px 20px", borderBottom: i < nextYear.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.white, fontSize: 13, fontFamily: "'Fraunces', serif" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{p.community} · {p.handover}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ padding: "4px 10px", borderRadius: 8, background: `${p._score.color}18`, border: `1px solid ${p._score.color}40`, textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: p._score.color, fontFamily: "'Fraunces', serif" }}>{p._score.score}</span>
                      <span style={{ fontSize: 9, color: p._score.color }}>/10</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{p.price ? "AED " + (p.price / 1e6).toFixed(1) + "M" : "TBD"}</div>
                      <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>⏱ {p._cd?.label}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.surfaceAlt, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.construction || 0}%`, borderRadius: 3, background: T.gold, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0, minWidth: 32 }}>{p.construction || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beyond 24 months */}
      {beyond.length > 0 && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.textMuted }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.textSecondary }}>24+ Months Away</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{beyond.length} project{beyond.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, padding: 16 }}>
            {beyond.map(p => (
              <div key={p.id} onClick={() => setSelectedProject(p)}
                style={{ background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, padding: "12px 14px", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.gold + "60"}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.white, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p._score.color, padding: "3px 7px", borderRadius: 6, background: `${p._score.color}15` }}>{p._score.score}★</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: T.textMuted }}>{p.handover}</span>
                  <span style={{ color: T.textSecondary }}>{p._cd?.label}</span>
                </div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p.construction || 0}%`, background: T.textMuted, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TabSources sources={[
        { label: "DLD Oqood", url: "https://oqood.dubailand.gov.ae" },
        { label: "Emaar Handover Centre" },
        { label: "Emaar IR", url: "https://www.emaar.com/en/investor-relations/" },
        { label: "Property Monitor" },
      ]} />
    </div>
  );
};

export default HandoverTab;
