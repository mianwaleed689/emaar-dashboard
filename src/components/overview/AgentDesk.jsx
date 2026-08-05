import React, { useMemo } from "react";
import { T } from "../../data";
import { colour as C, type as TY, space as S, radius as R, state as ST, surface } from "../../design/system";
import { Btn, Chip, DataList } from "../../design/ui";
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

  /* These five counts used to be blue, gold, green, purple and red. Nothing
     about a watchlist is purple and nothing about a portfolio is red — the
     colours were there so the row would look like something. A count is a
     count; see design/system.js rule 2. */
  const work = [
    { label: "Leads to work",  count: len(myLeads),     tab: "My Leads" },
    { label: "Deals open",     count: len(deals),       tab: "Pipeline" },
    { label: "My listings",    count: len(listings),    tab: "Listings" },
    { label: "Watchlist",      count: len(watchlist),   tab: "Projects" },
    { label: "Portfolio",      count: len(myPortfolio), tab: "Portfolio" },
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
          <div style={{ display: "grid", gap: S.md,
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            {work.map(w => (
              <button
                key={w.label}
                type="button"
                className="ds-btn ds-focus"
                title={`Open ${w.tab}`}
                onClick={() => handleTabChange(w.tab)}
                style={{
                  ...surface(), cursor: "pointer", textAlign: "left",
                  padding: `${S.md}px ${S.base}px`, minHeight: 76,
                  fontFamily: TY.body.fontFamily,
                }}
              >
                <div style={{ ...TY.figureSm, color: w.count ? C.text : C.textFaint }}>{w.count}</div>
                <div style={{ ...TY.label, color: C.textMuted, marginTop: 6 }}>{w.label}</div>
              </button>
            ))}
          </div>
        ) : (
          /* An empty desk is a real state, not an error — say what to do next
             rather than showing five zeroes. */
          <Card>
            <div style={{ ...TY.small, color: C.textMuted }}>
              Nothing in your pipeline yet. Add a lead, save a listing, or put a project on
              your watchlist and it will appear here.
            </div>
            <div style={{ display: "flex", gap: S.sm, marginTop: S.base, flexWrap: "wrap" }}>
              {[["Add a lead", "My Leads"], ["Browse projects", "Projects"], ["Find communities", "Neighbourhoods"]].map(([l, tab]) => (
                <Btn key={tab} onClick={() => handleTabChange(tab)}>{l}</Btn>
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
                    display: "flex", alignItems: "center", gap: S.md, padding: `${S.md}px ${S.lg}px`, minHeight: 44, cursor: "pointer",
                    borderBottom: i < Math.min(mine.length, 8) - 1 ? `1px solid ${border}` : "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ ...TY.smallStrong, color: C.text, flex: 1, textTransform: "capitalize" }}>
                    {String(c.name || c.id || "").replace(/-/g, " ")}
                  </span>
                  <Chip tone={verified ? "positive" : "warning"}
                    title={verified ? "Filed with the Land Department." : "An estimate, not a filed figure."}>
                    {verified ? "DLD" : "EST"}
                  </Chip>
                  <span style={{ ...TY.numeric, fontSize: 13, color: C.textMuted, width: 96, textAlign: "right" }}>
                    {Number(ppsf) > 0 ? `${Number(ppsf).toLocaleString()}/sqft` : ""}
                  </span>
                  <span style={{ ...TY.numeric, fontSize: 14, color: C.text, width: 58, textAlign: "right" }}>
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
                <div style={{ ...TY.bodyStrong, color: C.text }}>
                  {p.name || "Project"}
                </div>
                <div style={{ ...TY.small, color: C.textMuted, marginTop: 4 }}>
                  {p.developerActual || p.developer} · {p.community}
                </div>
                {/* Cards without a price left a visible gap where the gold line
                    sits on every other card, which reads as a rendering fault
                    rather than missing data. Saying so keeps the cards the same
                    height and tells an agent to ask the developer. */}
                {p.priceMin > 0 ? (
                  <div style={{ ...TY.numeric, fontSize: 14, color: C.text, marginTop: 6 }}>
                    From AED {(p.priceMin / 1e6).toFixed(2)}M
                  </div>
                ) : (
                  <div style={{ ...TY.small, color: C.textFaint, marginTop: 6 }}>
                    Price not published yet
                  </div>
                )}
                {(p.reraNo || p.projectNumber) && (
                  <div style={{ ...TY.small, color: C.textFaint, marginTop: 6 }}>
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
