import React, { useMemo } from "react";
import { T } from "../../data";
import { colour as C, type as TY, space as S, state as ST, surface } from "../../design/system";
import { Btn, Chip } from "../../design/ui";
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
          <div style={{ display: "flex", gap: S.xxl, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div style={{ ...TY.label, color: C.textMuted, marginBottom: 6 }}>
                Seats in use
              </div>
              <div style={{ ...TY.figure, color: seatWarning ? ST.warning.fg : C.text }}>
                {team.seatsUsed ?? "—"}
                {team.seatsIncluded ? <span style={{ ...TY.numeric, fontSize: 17, color: C.textMuted }}> / {team.seatsIncluded}</span> : null}
              </div>
            </div>

            <div>
              <div style={{ ...TY.label, color: C.textMuted, marginBottom: 6 }}>
                Team members
              </div>
              <div style={{ ...TY.figure, color: C.text }}>
                {team.memberCount}
              </div>
            </div>

            <div>
              <div style={{ ...TY.label, color: C.textMuted, marginBottom: 6 }}>
                Plan
              </div>
              <div style={{ ...TY.figureSm, color: C.accent }}>
                {PRICING_LABELS[org?.plan] || PRICING_LABELS.enterprise}
              </div>
            </div>

            {team.seatsFree > 0 && (
              <div style={{ flex: "1 1 240px", ...TY.small, color: C.textMuted }}>
                <strong style={{ color: seatWarning ? ST.warning.fg : C.text }}>
                  {team.seatsFree} seat{team.seatsFree === 1 ? "" : "s"} unused.
                </strong>{" "}
                {seatWarning
                  ? "You are paying for capacity you are not using — either add agents or move to a smaller plan."
                  : "Invite another agent at no extra cost."}
                {" "}
                <button type="button" onClick={() => handleTabChange("Team")} className="ds-focus"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                           color: C.accent, ...TY.smallStrong, textDecoration: "underline" }}>Manage team</button>
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
            <div style={{ ...TY.small, color: C.textMuted }}>
              Nothing in the pipeline yet. Once your agents add leads, open deals or publish
              listings, the totals appear here — and per-agent breakdowns on the Team tab.
            </div>
            <div style={{ marginTop: S.base }}>
              <Btn onClick={() => handleTabChange("Team")}>Invite an agent</Btn>
            </div>
          </Card>
        ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            /* Blue, gold and green for no reason anybody could state. */
            { label: "Open leads", count: len(myLeads), tab: "My Leads" },
            { label: "Deals in progress", count: len(deals), tab: "Pipeline" },
            { label: "Live listings", count: len(listings), tab: "Listings" },
          ].map(k => (
            <button key={k.label} type="button" onClick={() => handleTabChange(k.tab)}
              className="ds-btn ds-focus" title={`Open ${k.tab}`}
              style={{
                ...surface(), flex: "1 1 170px", minWidth: 156, cursor: "pointer", textAlign: "left",
                padding: `${S.md}px ${S.base}px`, minHeight: 76, fontFamily: TY.body.fontFamily,
              }}
            >
              <div style={{ ...TY.figureSm, color: k.count ? C.text : C.textFaint }}>{k.count}</div>
              <div style={{ ...TY.label, color: C.textMuted, marginTop: 6 }}>{k.label}</div>
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
                  display: "flex", alignItems: "center", gap: S.md,
                  padding: `${S.sm}px ${S.lg}px`, minHeight: 40,
                  borderBottom: i < Math.min(teamMembers.length, 10) - 1 ? `1px solid ${C.line}` : "none",
                }}
              >
                <span style={{ ...TY.small, color: C.text, flex: 1 }}>{m.name || m.email || "Agent"}</span>
                <span style={{ ...TY.small, color: C.textMuted }}>{m.orgRole || "agent"}</span>
                {/* Active is the normal state and does not need a colour; it is
                    a person who is NOT active that somebody has to act on. */}
                {String(m.status || "active").toLowerCase() === "active"
                  ? <span style={{ ...TY.small, color: C.textFaint }}>Active</span>
                  : <Chip tone="warning">{String(m.status)}</Chip>}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
