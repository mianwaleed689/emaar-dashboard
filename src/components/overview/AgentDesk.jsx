import React, { useMemo } from "react";
import { T } from "../../data";
import { Card, SectionTitle } from "../ui/DataDisplay";
import { classifyProvenance, PROVENANCE } from "../../utils/provenance";
import { myCommunities } from "../../utils/overviewRoles";
import { formatPct } from "../../utils/overviewStats";

/**
 * THE AGENT'S DESK — what someone opening this between viewings needs.
 *
 * An agent's first question at 8am is "who do I call", not "how many
 * communities does this platform cover". The previous Overview led with
 * coverage statistics, which answer a question asked once on a first visit and
 * never again.
 *
 * Order here follows the morning: my work, then my patch, then what I can pitch.
 */
export default function AgentDesk({
  myLeads = [], deals = [], listings = [], myPortfolio = [], watchlist = [],
  communities = [], projects = [],
  handleTabChange = () => {},
}) {
  const muted = T.textMuted || "#8A94A6";
  const text = T.textSecondary || "#C9D1D9";
  const white = T.white || "#fff";
  const border = T.border || "rgba(255,255,255,0.08)";

  const len = v => (Array.isArray(v) ? v.length : 0);

  const work = [
    { label: "Leads to work",  count: len(myLeads),     tab: "My Leads",  color: "#63B3ED" },
    { label: "Deals open",     count: len(deals),       tab: "Pipeline",  color: T.gold || "#D4A843" },
    { label: "My listings",    count: len(listings),    tab: "Listings",  color: "#68D391" },
    { label: "Watchlist",      count: len(watchlist),   tab: "Projects",  color: "#9F7AEA" },
    { label: "Portfolio",      count: len(myPortfolio), tab: "Portfolio", color: "#FC8181" },
  ];
  const hasWork = work.some(w => w.count > 0);

  /* The communities this agent actually touches, not the top of a citywide
     list they have no connection to. */
  const mine = useMemo(
    () => myCommunities({ listings, myPortfolio, watchlist, communities }),
    [listings, myPortfolio, watchlist, communities]
  );

  /* Something to pitch: announced projects, newest first. An agent wants stock
     they can talk about this week. */
  const launches = useMemo(() => {
    const pct = v => (v === null || v === undefined || v === "" ? null : Number(v));
    return projects
      .filter(p => {
        const c = pct(p.constructionPct);
        return c !== null && c === 0;          // announced, nothing built yet
      })
      .slice(0, 6);
  }, [projects]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── 1 · MY WORK ──────────────────────────────────────────────── */}
      <div>
        <SectionTitle hint="click through to work the list">Your desk today</SectionTitle>
        {hasWork ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {work.map(w => (
              <button
                key={w.label}
                type="button"
                onClick={() => handleTabChange(w.tab)}
                style={{
                  flex: "1 1 130px", minWidth: 120, cursor: "pointer", textAlign: "left",
                  padding: "13px 15px", borderRadius: 10, border: `1px solid ${border}`,
                  background: T.card || "rgba(255,255,255,0.03)", fontFamily: "'Outfit',sans-serif",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = w.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: w.color, fontFamily: "Fraunces,serif", lineHeight: 1 }}>
                  {w.count}
                </div>
                <div style={{ fontSize: 10, color: muted, marginTop: 6, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {w.label}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* An empty desk is a real state, not an error — say what to do next
             rather than showing five zeroes. */
          <Card>
            <div style={{ fontSize: 12.5, color: text, lineHeight: 1.6 }}>
              Nothing in your pipeline yet. Add a lead, save a listing, or put a project on
              your watchlist and it will appear here.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
              {[["Add a lead", "My Leads"], ["Browse projects", "Projects"], ["Find communities", "Neighbourhoods"]].map(([l, tab]) => (
                <button key={tab} type="button" onClick={() => handleTabChange(tab)}
                  style={{
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${T.gold || "#D4A843"}55`, background: "transparent",
                    color: T.gold || "#D4A843", fontSize: 11, fontWeight: 600,
                    fontFamily: "'Outfit',sans-serif",
                  }}>{l}</button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── 2 · MY COMMUNITIES ───────────────────────────────────────── */}
      {mine.length > 0 && (
        <div>
          <SectionTitle hint="the areas you are actually working — net yield after costs">
            Your communities
          </SectionTitle>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {mine.slice(0, 8).map((c, i) => {
              const verified = classifyProvenance(c).level === PROVENANCE.VERIFIED;
              const ppsf = c.medianPPSF ?? c.avgPpsf ?? c.ppsf;
              return (
                <div key={c.id || i}
                  onClick={() => handleTabChange("Neighbourhoods")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer",
                    borderBottom: i < Math.min(mine.length, 8) - 1 ? `1px solid ${border}` : "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 12, color: white, flex: 1, textTransform: "capitalize" }}>
                    {String(c.name || c.id || "").replace(/-/g, " ")}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: verified ? "#10B981" : "#F59E0B" }}>
                    {verified ? "DLD" : "EST"}
                  </span>
                  <span style={{ fontSize: 10, color: muted, width: 88, textAlign: "right" }}>
                    {Number(ppsf) > 0 ? `${Number(ppsf).toLocaleString()}/sqft` : ""}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#68D391", width: 52, textAlign: "right", fontFamily: "Fraunces,serif" }}>
                    {formatPct(c.netYield)}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ── 3 · WHAT I CAN PITCH ─────────────────────────────────────── */}
      {launches.length > 0 && (
        <div>
          <SectionTitle hint="announced, nothing built yet — earliest entry pricing">
            New stock to pitch
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
            {launches.map((p, i) => (
              <Card key={p.id || i} onClick={() => handleTabChange("Projects")} style={{ padding: "13px 15px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: white, lineHeight: 1.35 }}>
                  {p.name || "Project"}
                </div>
                <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>
                  {p.developerActual || p.developer} · {p.community}
                </div>
                {/* Cards without a price left a visible gap where the gold line
                    sits on every other card, which reads as a rendering fault
                    rather than missing data. Saying so keeps the cards the same
                    height and tells an agent to ask the developer. */}
                {p.priceMin > 0 ? (
                  <div style={{ fontSize: 11, color: T.gold || "#D4A843", marginTop: 6, fontWeight: 600 }}>
                    From AED {(p.priceMin / 1e6).toFixed(2)}M
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: muted, marginTop: 6, fontStyle: "italic" }}>
                    Price not published yet
                  </div>
                )}
                {(p.reraNo || p.projectNumber) && (
                  <div style={{ fontSize: 9, color: muted, marginTop: 5 }}>
                    DLD #{p.reraNo || p.projectNumber} — checkable on the register
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
