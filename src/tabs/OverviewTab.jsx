/* eslint-disable */
/**
 * DXB ANALYTICS — OVERVIEW
 * Redesigned 2026-07-30.
 *
 * ── WHAT WAS WRONG ──────────────────────────────────────────────────────────
 *
 * The previous Overview stated market figures as literal strings inside the
 * component: "Avg yield 6.55%", "Q1 2026: AED 252B (+31% YoY)", "EIBOR 3.59%",
 * "Q1 2026 avg PPSF: AED 1,759", "228 developers active", "Off-plan now 70-80%
 * of market". Written in April 2026 and still on screen in July, with no as-of
 * date and no way for a reader to judge their age. Several had already moved.
 *
 * It also opened with claims rather than with what the platform knows, so a
 * client's first screen was assertion, not evidence.
 *
 * ── HOW IT IS BUILT NOW ─────────────────────────────────────────────────────
 *
 * Inverted pyramid, the structure analytics dashboards converge on: headline
 * numbers first, the drivers beneath them, detail below that. The summary tier
 * is held to five KPIs — past roughly seven, a dashboard becomes a database —
 * and every number carries context, either a sample size or a source and date.
 *
 *   1  COVERAGE     what we hold. Computed from live data, so it cannot go
 *                   stale, and each figure states the sample it rests on.
 *   2  CONFIDENCE   how much of it is DLD-verified versus estimated. Stated
 *                   plainly rather than implied by a green badge.
 *   3  MARKET       Dubai's numbers. Sourced and dated, never retyped into
 *                   the view. Where the market has not settled a figure, that
 *                   is said rather than smoothed over.
 *   4  RETURNS      where the yields are, computed net of costs.
 *   5  ROUTES       role-based navigation into the depth of the product.
 *
 * The role selector survives because wayfinding by role is genuinely useful.
 * What it no longer does is assert market conditions; it decides which parts of
 * the product to point at.
 */

import React, { useState, useMemo } from "react";
import { T } from "../data";
import { MARKET_FACTS, H1_2026_RANGE } from "../data/marketFacts";
import SourceBadge from "../components/SourceBadge";
import { classifyProvenance, PROVENANCE } from "../utils/provenance";
import { Card, SectionTitle, Kpi } from "../components/ui/DataDisplay";
import {
  computeCoverage,
  topByNetYield,
  computeFreshness,
  formatAED,
  formatPct,
} from "../utils/overviewStats";

/* ── ROLES ─────────────────────────────────────────────────────────────────
   Navigation only. These decide where a user is pointed, never what the market
   is doing — that comes from data, further down. */
const ROLES = [
  {
    key: "Investor",
    color: "#D4A843",
    desc: "Yield, ROI and entry timing",
    routes: [
      { label: "Highest net yields by community", tab: "Yields" },
      { label: "Supply risk before you commit", tab: "Risk" },
      { label: "Model a purchase end to end", tab: "DXB Estimate" },
      { label: "Compare against ready stock", tab: "Neighbourhoods" },
    ],
  },
  {
    key: "Agent",
    color: "#63B3ED",
    desc: "Listings, leads and volume",
    routes: [
      { label: "Browse the project catalogue", tab: "Projects" },
      { label: "Transaction volume by community", tab: "DLD Volumes" },
      { label: "Upcoming launches", tab: "Launch Calendar" },
      { label: "Community intelligence", tab: "Neighbourhoods" },
    ],
  },
  {
    key: "Developer",
    color: "#FC8181",
    desc: "Pipeline, supply and competition",
    routes: [
      { label: "What competitors are launching", tab: "Competitors" },
      { label: "Supply pipeline and absorption", tab: "Risk" },
      { label: "Developer track records", tab: "Developer Health" },
      { label: "Financing and escrow", tab: "Banking" },
    ],
  },
  {
    key: "Buyer",
    color: "#68D391",
    desc: "Pricing, mortgage and value",
    routes: [
      { label: "What a property is worth", tab: "DXB Estimate" },
      { label: "Mortgage and affordability", tab: "Mortgage" },
      { label: "Compare communities", tab: "Neighbourhoods" },
      { label: "Golden Visa eligibility", tab: "Golden Visa" },
    ],
  },
];

/* ── SMALL PRESENTATIONAL PIECES ───────────────────────────────────────────── */

/* Card, SectionTitle and Kpi previously lived here with their own padding and
   type scale, while MarketTab defined near-identical ones with different values.
   Both now render through the shared design system, so the two tabs stop looking
   like separate products. Kpi there requires a `context` — a sample size, source
   or date — which is why every figure on this page carries one. */
/* ── MAIN ──────────────────────────────────────────────────────────────────── */

export default function OverviewTab({
  liveNeighbourhoods = [],
  allNeighbourhoods = [],
  projects = [],
  allDevelopers = [],
  liveMarketData = null,
  liveEiborRates = null,
  /* Personal activity. These are live counts, not market claims, and each one
     is a route into the user's own work — they were dropped in the first pass
     of this redesign by accident and restored here. */
  myLeads = [],
  deals = [],
  listings = [],
  myPortfolio = [],
  watchlist = [],
  handleTabChange = () => {},
}) {
  const [role, setRole] = useState("Investor");
  const activeRole = ROLES.find(r => r.key === role) || ROLES[0];

  const coverage = useMemo(
    () => computeCoverage({
      communities: liveNeighbourhoods,
      allCommunities: allNeighbourhoods.length ? allNeighbourhoods : liveNeighbourhoods,
      projects,
      developers: allDevelopers,
    }),
    [liveNeighbourhoods, allNeighbourhoods, projects, allDevelopers]
  );

  const freshness = useMemo(
    () => computeFreshness({ communities: liveNeighbourhoods, marketData: liveMarketData, eibor: liveEiborRates }),
    [liveNeighbourhoods, liveMarketData, liveEiborRates]
  );

  const topYields = useMemo(() => topByNetYield(liveNeighbourhoods, 6), [liveNeighbourhoods]);

  const len = v => (Array.isArray(v) ? v.length : 0);
  const activity = [
    { label: "Active leads", count: len(myLeads),     tab: "My Leads",  color: "#63B3ED" },
    { label: "Active deals", count: len(deals),       tab: "Pipeline",  color: T.gold || "#D4A843" },
    { label: "My listings",  count: len(listings),    tab: "Listings",  color: "#68D391" },
    { label: "Portfolio",    count: len(myPortfolio), tab: "Portfolio", color: "#FC8181" },
    { label: "Watchlist",    count: len(watchlist),   tab: "Projects",  color: "#9F7AEA" },
  ];
  /* Only worth screen space once there is something in it — a row of zeroes
     tells a new user nothing and pushes the real content down. */
  const hasActivity = activity.some(a => a.count > 0);

  /* Live 3-month EIBOR. Read from the feed rather than restated, because the
     previous Overview printed "EIBOR 3.59%" as text and it was months old. */
  const eibor3m = liveEiborRates?.["3m"] ?? liveEiborRates?.eibor3m ?? null;
  const eiborAsOf = liveEiborRates?.asOf || null;

  const muted = T.textMuted || "#8A94A6";
  const text = T.textSecondary || "#C9D1D9";
  const gold = T.gold || "#D4A843";

  const verifiedPct = Math.round((coverage.verifiedShare || 0) * 100);

  /* Market facts shown as context. Pulled from marketFacts.js so the source and
     date travel with the number instead of being retyped here. */
  const contextFacts = [
    ["q1_2026Value", "Q1 2026 market value"],
    ["q1_2026Ppsf", "Q1 2026 price per sqft"],
    ["totalValue2025", "FY2025 total value"],
    ["totalTransactions2025", "FY2025 transactions"],
  ].map(([key, label]) => ({ key, label, fact: MARKET_FACTS[key] })).filter(x => x.fact);

  /* Cold start: before the community feed arrives, every KPI below would render
     "0 communities · median —" which reads as a broken product rather than a
     loading one. Say what is happening instead. */
  if (!liveNeighbourhoods.length) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.white || "#fff", fontFamily: "Fraunces,serif", marginBottom: 8 }}>
          Loading Dubai community data
        </div>
        <p style={{ margin: "0 auto", maxWidth: 420, fontSize: 12, color: T.textMuted || "#8A94A6", lineHeight: 1.6 }}>
          Prices, yields and service charges for 193 communities are on their way.
          If this persists, the data feed is unavailable rather than empty — nothing
          here is being hidden from you.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.white || "#fff", fontFamily: "Fraunces,serif" }}>
            Dubai property intelligence
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: muted, maxWidth: 620, lineHeight: 1.55 }}>
            Every figure below is either computed from the transaction data this
            platform holds, or carries the source and date it came from.
          </p>
        </div>
        {/* Dates the COMMUNITY records specifically, because those are what the
            coverage figures below are computed from. It previously showed the
            newest timestamp across communities, market data and EIBOR — and
            since EIBOR updates daily it read "1d ago" while the community prices
            beneath it were months old. Saying which data is being dated is the
            whole point; "Data refreshed" alone invited the wrong reading. */}
        {freshness.latest && (() => {
          const stale = typeof freshness.ageDays === "number" && freshness.ageDays > 30;
          return (
            <div style={{ fontSize: 10, color: muted, textAlign: "right", maxWidth: 230 }}>
              <div style={{ fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                Community data
              </div>
              <div style={{ color: stale ? "#F59E0B" : text, marginTop: 3, fontWeight: stale ? 700 : 400 }}>
                {freshness.latest.toISOString().slice(0, 10)}
                {typeof freshness.ageDays === "number" && (
                  <span style={{ marginLeft: 6 }}>
                    ({freshness.ageDays === 0 ? "today"
                      : freshness.ageDays === 1 ? "1 day ago"
                      : `${freshness.ageDays} days ago`})
                  </span>
                )}
              </div>
              {stale && (
                <div style={{ color: "#F59E0B", marginTop: 4, lineHeight: 1.45 }}>
                  Prices and yields below are from this date, not today.
                  Confirm before quoting a client.
                </div>
              )}
              {/* EIBOR is live and dated separately in the market row — saying so
                  here stops a reader assuming everything shares one date. */}
              <div style={{ color: muted, marginTop: 4, opacity: 0.85 }}>
                EIBOR updates daily and is dated separately below.
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── YOUR ACTIVITY ────────────────────────────────────────────────
          Personal before market: for a returning user their own pipeline is
          the most relevant thing on the screen. Hidden entirely when empty. */}
      {hasActivity && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {activity.map(a => (
            <button
              key={a.label}
              type="button"
              onClick={() => handleTabChange(a.tab)}
              style={{
                flex: "1 1 130px", minWidth: 120, cursor: "pointer", textAlign: "left",
                padding: "12px 14px", borderRadius: 10,
                border: `1px solid ${T.border || "rgba(255,255,255,0.08)"}`,
                background: T.card || "rgba(255,255,255,0.03)",
                fontFamily: "'Outfit',sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border || "rgba(255,255,255,0.08)"}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: a.color, fontFamily: "Fraunces,serif", lineHeight: 1 }}>
                {a.count}
              </div>
              <div style={{ fontSize: 10, color: muted, marginTop: 6, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                {a.label}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── 1. COVERAGE ──────────────────────────────────────────────────── */}
      <div>
        <SectionTitle hint="computed from live data — cannot go stale">
          What this platform covers
        </SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Kpi
            large
            label="Communities"
            value={coverage.communityCount.toLocaleString()}
            accent={gold}
            context={coverage.administrativeCount > 0
              ? `Residential. ${coverage.administrativeCount} DLD administrative districts held separately.`
              : "Residential communities"}
          />
          <Kpi
            large
            label="Median net yield"
            value={formatPct(coverage.medianNetYield)}
            accent="#68D391"
            context={`After service charges, 5% vacancy and 5% management. Gross ${formatPct(coverage.medianGrossYield)}. n=${coverage.netYieldSampleSize}`}
          />
          <Kpi
            large
            label="Median price"
            value={coverage.medianPPSF ? `${Number(coverage.medianPPSF).toLocaleString()}` : "—"}
            context={`AED per sqft, community medians. n=${coverage.ppsfSampleSize}`}
          />
          {/* Caption read "Tracked across all developers", which a reader takes
              as the whole catalogue. It is not: archived projects are filtered
              out upstream, so this is 1,552 of 1,728. The number was right and
              the sentence overclaimed. */}
          <Kpi
            label="Projects"
            value={coverage.projectCount.toLocaleString()}
            context="Active projects. Archived ones are excluded, so this is fewer than the full catalogue."
          />
          <Kpi
            label="Developers"
            value={coverage.developerCount.toLocaleString()}
            context="Active brands, grouped from the DLD registry"
          />
        </div>
      </div>

      {/* ── 2. CONFIDENCE ────────────────────────────────────────────────── */}
      <div>
        <SectionTitle hint="what we can stand behind, and what we cannot">
          Data confidence
        </SectionTitle>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#10B981", fontFamily: "Fraunces,serif" }}>
              {verifiedPct}%
            </div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.6, flex: "1 1 320px" }}>
              <strong>{coverage.provenance.verified}</strong> of {coverage.communityCount} communities have figures
              traceable to Dubai Land Department transactions. The remaining{" "}
              <strong>{coverage.provenance.estimate + coverage.provenance.unsourced}</strong> are estimates —
              largely area-level figures applied to sub-communities, which is why several neighbouring
              areas can report an identical price.
            </div>
          </div>

          {/* Proportional bar — verified versus everything else. */}
          <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
            <div style={{ width: `${verifiedPct}%`, background: "#10B981" }} />
            <div style={{ flex: 1, background: "#F59E0B" }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 10, color: muted }}>
            <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#10B981", marginRight: 5 }} />DLD verified {coverage.provenance.verified}</span>
            <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", marginRight: 5 }} />Estimate {coverage.provenance.estimate}</span>
            {coverage.provenance.derived > 0 && (
              <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#3B82F6", marginRight: 5 }} />Derived {coverage.provenance.derived}</span>
            )}
            <span style={{ marginLeft: "auto", fontStyle: "italic" }}>
              An estimate is still useful. It is simply not a measurement, and is never shown as one.
            </span>
          </div>
        </Card>
      </div>

      {/* ── 3. MARKET ────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle hint="Dubai-wide — sourced and dated, not computed here">
          Market context
        </SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          {/* Live EIBOR — the one market number here that updates daily, so it
              leads. Rendered only when the feed has actually delivered a rate;
              an absent value is better than a stale one presented as current. */}
          {Number(eibor3m) > 0 && (
            <Card
              style={{ flex: "1 1 200px", minWidth: 190, cursor: "pointer" }}
              onClick={() => handleTabChange("Mortgage")}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: muted, marginBottom: 7 }}>
                EIBOR 3-month
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#9F7AEA", fontFamily: "Fraunces,serif" }}>
                  {Number(eibor3m).toFixed(2)}%
                </span>
                <span style={{ fontSize: 10, color: "#68D391", fontWeight: 700 }}>live</span>
              </div>
              <div style={{ fontSize: 10, color: muted, marginTop: 6, lineHeight: 1.45 }}>
                Base for variable mortgage pricing
              </div>
              <div style={{ fontSize: 9, color: muted, marginTop: 8 }}>
                Central Bank of the UAE{eiborAsOf ? ` · as of ${eiborAsOf}` : ""}
              </div>
            </Card>
          )}
          {contextFacts.map(({ key, label, fact }) => (
            <Card key={key} style={{ flex: "1 1 200px", minWidth: 190 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: muted, marginBottom: 7 }}>
                {label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.white || "#fff", fontFamily: "Fraunces,serif" }}>
                  {fact.value}
                </span>
                {fact.change && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: String(fact.change).startsWith("+") ? "#68D391" : muted }}>
                    {fact.change}
                  </span>
                )}
              </div>
              {fact.note && (
                <div style={{ fontSize: 10, color: muted, marginTop: 6, lineHeight: 1.45 }}>{fact.note}</div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <SourceBadge row={{ source: fact.source, verified: fact.verified, asOf: fact.asOf }} compact />
                <span style={{ fontSize: 9, color: muted }}>
                  {fact.source || "No source recorded"}{fact.asOf ? ` · as of ${fact.asOf}` : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Where the market itself has not settled, say so rather than pick one. */}
        {H1_2026_RANGE && (
          <Card style={{ borderColor: "rgba(245,158,11,0.28)", background: "rgba(245,158,11,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 6 }}>
              {H1_2026_RANGE.label} — published totals disagree
            </div>
            <div style={{ fontSize: 11, color: text, lineHeight: 1.6 }}>
              {H1_2026_RANGE.low.value} deals / {H1_2026_RANGE.low.aed}{" "}
              <span style={{ color: muted }}>({H1_2026_RANGE.low.scope}, {H1_2026_RANGE.low.source})</span>
              {"  to  "}
              {H1_2026_RANGE.high.value} deals / {H1_2026_RANGE.high.aed}{" "}
              <span style={{ color: muted }}>({H1_2026_RANGE.high.scope}, {H1_2026_RANGE.high.source})</span>
            </div>
            <div style={{ fontSize: 10, color: muted, marginTop: 7, lineHeight: 1.5 }}>
              {H1_2026_RANGE.note} Yield figures for 2026 have not yet been finalised by the bodies
              that publish them, which is why the net yield above is computed here, with its method shown,
              rather than quoted.
            </div>
          </Card>
        )}
      </div>

      {/* ── 4. RETURNS ───────────────────────────────────────────────────── */}
      {topYields.length > 0 && (
        <div>
          {/* ── WHY THIS WARNS ────────────────────────────────────────────────
              Measured 2026-07-31: FOUR of the top six are estimates, and two of
              them share the same figure — Dubai Investment Park and DIP Second
              both read 1,051/sqft, gross 9.0%, net 7.3%.

              A small coloured dot was carrying that entire message. This is the
              list an agent screenshots and sends to a client as "the highest
              yields in Dubai", so the warning has to be as prominent as the
              numbers it qualifies. */}
          <SectionTitle hint="net of service charges, vacancy and management">
            Where the returns are
          </SectionTitle>

          {(() => {
            const estimates = topYields.filter(c => classifyProvenance(c).level !== PROVENANCE.VERIFIED).length;
            if (!estimates) return null;
            return (
              <div style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                padding: "9px 12px", borderRadius: 8, marginBottom: 10,
                background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", flexShrink: 0 }}>
                  {estimates} of {topYields.length}
                </span>
                <span style={{ fontSize: 10.5, color: text, lineHeight: 1.55 }}>
                  of these are <strong>estimates</strong>, not measured from transactions — the highest
                  yields in Dubai are often in areas with the thinnest transaction data. Check the badge
                  on each row before quoting one to a client.
                </span>
              </div>
            );
          })()}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {topYields.map((c, i) => (
              <div
                key={c.id || i}
                onClick={() => handleTabChange("Yields")}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px", cursor: "pointer",
                  borderBottom: i < topYields.length - 1 ? `1px solid ${T.border || "rgba(255,255,255,0.06)"}` : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 10, color: muted, width: 16 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: T.white || "#fff", flex: 1, textTransform: "capitalize" }}>
                  {String(c.name || c.id || "").replace(/-/g, " ")}
                </span>
                {/* The word, not just the dot. And where a figure is shared with
                    other communities, say how many — that is the difference
                    between "an estimate" and "this exact number also appears
                    somewhere else". */}
                {classifyProvenance(c).level === PROVENANCE.VERIFIED ? (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#10B981", letterSpacing: 0.3 }}>
                    DLD
                  </span>
                ) : (
                  <span
                    title={Number(c.valueSharedWith) > 0
                      ? `This figure also appears on ${c.valueSharedWith} other communit${Number(c.valueSharedWith) === 1 ? "y" : "ies"}`
                      : "Estimated, not measured from transactions"}
                    style={{
                      fontSize: 9, fontWeight: 700, color: "#F59E0B", letterSpacing: 0.3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    EST{Number(c.valueSharedWith) > 0 ? ` ·${c.valueSharedWith}` : ""}
                  </span>
                )}
                <SourceBadge row={c} compact />
                <span style={{ fontSize: 10, color: muted, width: 92, textAlign: "right" }}>
                  {Number(c.medianPPSF ?? c.avgPpsf ?? c.ppsf) > 0
                    ? `${Number(c.medianPPSF ?? c.avgPpsf ?? c.ppsf).toLocaleString()}/sqft`
                    : ""}
                </span>
                <span style={{ fontSize: 10, color: muted, width: 66, textAlign: "right" }}>
                  gross {formatPct(c.grossYield)}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#68D391", width: 54, textAlign: "right", fontFamily: "Fraunces,serif" }}>
                  {formatPct(c.netYield)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── 5. ROUTES ────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle hint="pick a role to see the most useful screens first">
          Where to go next
        </SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {ROLES.map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              style={{
                padding: "7px 14px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${role === r.key ? r.color : (T.border || "rgba(255,255,255,0.08)")}`,
                background: role === r.key ? `${r.color}18` : "transparent",
                color: role === r.key ? r.color : muted,
                fontSize: 12, fontWeight: role === r.key ? 700 : 500,
                fontFamily: "'Outfit',sans-serif",
              }}
            >{r.key}</button>
          ))}
          <span style={{ alignSelf: "center", fontSize: 10, color: muted, marginLeft: 4 }}>
            {activeRole.desc}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {activeRole.routes.map(r => (
            <button
              key={r.tab}
              type="button"
              onClick={() => handleTabChange(r.tab)}
              style={{
                flex: "1 1 220px", minWidth: 200, textAlign: "left", cursor: "pointer",
                padding: "13px 15px", borderRadius: 10,
                border: `1px solid ${T.border || "rgba(255,255,255,0.08)"}`,
                background: T.card || "rgba(255,255,255,0.03)",
                color: T.white || "#fff", fontSize: 12, fontWeight: 600,
                fontFamily: "'Outfit',sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = activeRole.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border || "rgba(255,255,255,0.08)"}
            >
              {r.label}
              <span style={{ display: "block", fontSize: 10, color: muted, marginTop: 4, fontWeight: 500 }}>
                {r.tab}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
