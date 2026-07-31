import React, { useMemo } from "react";
import { T } from "../../data";
import { Card, SectionTitle } from "../ui/DataDisplay";
import { summariseTeam } from "../../utils/overviewRoles";
import { PRICING_LABELS } from "../../config/pricing";

/**
 * THE AGENCY VIEW — for the person holding the card.
 *
 * An agency owner logs in weekly or monthly with one question: is the AED 500 a
 * month earning its keep? Nothing on the previous Overview answered it. They saw
 * "193 communities · 31% verified", which tells them about the product's data
 * and nothing about their business.
 *
 * ── ON SHOWING UNUSED SEATS ─────────────────────────────────────────────────
 *
 * An agency paying for ten seats and using three is shown exactly that. It is a
 * number that could prompt a downgrade, and it is shown anyway, because they
 * will work it out at renewal regardless — and finding it themselves, having not
 * been told, is what makes people cancel rather than negotiate.
 *
 * The same figure is also the argument for adding agents, which is the more
 * likely outcome when it is put in front of someone rather than hidden.
 */
export default function AgencyDesk({
  teamMembers = [], org = null, orgName = "",
  myLeads = [], deals = [], listings = [],
  handleTabChange = () => {},
}) {
  const muted = T.textMuted || "#8A94A6";
  const text = T.textSecondary || "#C9D1D9";
  const white = T.white || "#fff";
  const border = T.border || "rgba(255,255,255,0.08)";
  const gold = T.gold || "#D4A843";

  const team = useMemo(() => summariseTeam({ teamMembers, org }), [teamMembers, org]);
  const len = v => (Array.isArray(v) ? v.length : 0);

  const seatWarning =
    team.utilisationPct !== null && team.utilisationPct < 50 && team.seatsIncluded > 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── SEATS — the money question, answered first ────────────────── */}
      <div>
        <SectionTitle hint="what you pay for, and what you are using">
          {orgName ? `${orgName} — your plan` : "Your plan"}
        </SectionTitle>

        <Card>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", color: muted, marginBottom: 5 }}>
                Seats in use
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Fraunces,serif", color: seatWarning ? "#F59E0B" : white }}>
                {team.seatsUsed ?? "—"}
                {team.seatsIncluded ? <span style={{ fontSize: 15, color: muted }}> / {team.seatsIncluded}</span> : null}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", color: muted, marginBottom: 5 }}>
                Team members
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Fraunces,serif", color: white }}>
                {team.memberCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", color: muted, marginBottom: 5 }}>
                Plan
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Fraunces,serif", color: gold }}>
                {PRICING_LABELS[org?.plan] || PRICING_LABELS.enterprise}
              </div>
            </div>

            {team.seatsFree > 0 && (
              <div style={{ flex: "1 1 220px", fontSize: 11, color: text, lineHeight: 1.6 }}>
                <strong style={{ color: seatWarning ? "#F59E0B" : text }}>
                  {team.seatsFree} seat{team.seatsFree === 1 ? "" : "s"} unused.
                </strong>{" "}
                {seatWarning
                  ? "You are paying for capacity you are not using — either add agents or move to a smaller plan."
                  : "Invite another agent at no extra cost."}
                {" "}
                <button type="button" onClick={() => handleTabChange("Team")}
                  style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    color: gold, fontSize: 11, fontWeight: 600, textDecoration: "underline",
                    fontFamily: "'Outfit',sans-serif",
                  }}>Manage team</button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── TEAM PIPELINE ───────────────────────────────────────────────
          Three zeroes side by side read as a broken panel rather than an empty
          one. The agent view already hides its counters until there is
          something in them and says what to do instead; this now matches. */}
      <div>
        <SectionTitle hint="what your team is working right now">Pipeline</SectionTitle>
        {(len(myLeads) + len(deals) + len(listings)) === 0 ? (
          <Card>
            <div style={{ fontSize: 12.5, color: text, lineHeight: 1.6 }}>
              Nothing in the pipeline yet. Once your agents add leads, open deals or publish
              listings, the totals appear here — and per-agent breakdowns on the Team tab.
            </div>
            <button type="button" onClick={() => handleTabChange("Team")}
              style={{
                marginTop: 11, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${gold}55`, background: "transparent",
                color: gold, fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
              }}>Invite an agent</button>
          </Card>
        ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Open leads", count: len(myLeads), tab: "My Leads", color: "#63B3ED" },
            { label: "Deals in progress", count: len(deals), tab: "Pipeline", color: gold },
            { label: "Live listings", count: len(listings), tab: "Listings", color: "#68D391" },
          ].map(k => (
            <button key={k.label} type="button" onClick={() => handleTabChange(k.tab)}
              style={{
                flex: "1 1 160px", minWidth: 150, cursor: "pointer", textAlign: "left",
                padding: "13px 15px", borderRadius: 10, border: `1px solid ${border}`,
                background: T.card || "rgba(255,255,255,0.03)", fontFamily: "'Outfit',sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = k.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontFamily: "Fraunces,serif", lineHeight: 1 }}>
                {k.count}
              </div>
              <div style={{ fontSize: 10, color: muted, marginTop: 6, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                {k.label}
              </div>
            </button>
          ))}
        </div>
        )}
        {/* Honest about scope: these are the signed-in manager's records, not a
            roll-up across every agent. Implying otherwise would overstate what
            the number covers. */}
        {(len(myLeads) + len(deals) + len(listings)) > 0 && (
          <div style={{ fontSize: 10, color: muted, marginTop: 8, lineHeight: 1.5 }}>
            Counts reflect records visible to your account. Per-agent breakdowns are on the Team tab.
          </div>
        )}
      </div>

      {/* ── THE TEAM ──────────────────────────────────────────────────── */}
      {team.memberCount > 0 && (
        <div>
          <SectionTitle hint="who is on your plan">Your agents</SectionTitle>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {teamMembers.slice(0, 10).map((m, i) => (
              <div key={m.uid || m.id || i}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                  borderBottom: i < Math.min(teamMembers.length, 10) - 1 ? `1px solid ${border}` : "none",
                }}
              >
                <span style={{ fontSize: 12, color: white, flex: 1 }}>{m.name || m.email || "Agent"}</span>
                <span style={{ fontSize: 10, color: muted }}>{m.orgRole || "agent"}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: String(m.status || "active").toLowerCase() === "active" ? "#10B981" : muted,
                }}>
                  {String(m.status || "active").toUpperCase()}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
