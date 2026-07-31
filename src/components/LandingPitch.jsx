import React from "react";
import { PRICING_LABELS } from "../config/pricing";

/**
 * WHAT THIS PLATFORM IS — the pitch an unauthenticated visitor sees.
 *
 * ── THE PROBLEM ─────────────────────────────────────────────────────────────
 *
 * Before this, a visitor arriving at DXB Analytics saw a product name, the
 * words "Dubai Real Estate Intelligence", and a signup form. Nothing said what
 * the platform does, who it is for, what it costs, or why it exists rather than
 * Bayut or Property Finder. Someone who did not already know had no reason to
 * create an account, and no way to find one.
 *
 * ── WHO IT IS FOR ───────────────────────────────────────────────────────────
 *
 * Agents and agencies, on a monthly subscription. That decides the copy. An
 * agent is not buying data; they are buying the ability to answer a client who
 * asks "is now a good time?" without sounding like a brochure. Everything here
 * is written to that moment.
 *
 * ── WHY THE HONESTY IS THE PITCH ────────────────────────────────────────────
 *
 * Every portal in Dubai shows rising lines. None shows a buyer that the market
 * fell 50-60% in 2008 or drifted down for five years to 2019, because none of
 * them benefits from that conversation. An agent who can show a client both
 * crashes, name what caused them, and open the source article is more credible
 * than one with a glossy deck — and that credibility is what closes.
 *
 * So the claims below are deliberately specific and checkable. Vague superlatives
 * would undercut the exact thing being sold.
 */
export default function LandingPitch({ compact = false, onGetStarted, style }) {
  const gold = "#D4A843";
  const white = "#fff";
  const text = "#C9D1D9";
  const muted = "#8A94A6";
  const border = "rgba(255,255,255,0.10)";

  const PROOF = [
    { stat: "24 years", label: "of Dubai market history — including both crashes, not just the good years" },
    { stat: "193", label: "communities with prices, yields and service charges — the same number on every screen" },
    { stat: "1,728", label: "projects tracked across every developer, not only the ones paying for placement" },
    { stat: "Every figure", label: "carries its source, its date, and a link to the original article" },
  ];

  const FOR_AGENTS = [
    {
      title: "Answer “is now a good time to buy?” properly",
      body:
        "The market fell 50–60% in 2008 and drifted down for five years to 2019. Your client can find that on Google. Being the agent who raises it first — with the numbers, the cause and the source — is worth more than any brochure.",
    },
    {
      title: "Show net yield, not the headline",
      body:
        "Portals quote gross. We compute net after service charges, 5% vacancy and 5% management, and show the working. A client who has been quoted 8% elsewhere will remember who told them the truth.",
    },
    {
      title: "Know which numbers are solid and which are estimates",
      body:
        "Some community prices are area-level figures applied downward — twelve Dubai Hills sub-communities report an identical price. We label those as estimates rather than dressing them as measurements, so you never get caught out defending one.",
    },
    {
      title: "Send a client the source, not a screenshot",
      body:
        "Every citation opens the original article. When a client pushes back, you reply with a link from Al Jazeera, the Central Bank rulebook or the DLD — not your own slide.",
    },
  ];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", ...style }}>

      {/* ── What it is, in one breath ────────────────────────────────── */}
      <div style={{ marginBottom: 26 }}>
        <div style={{
          display: "inline-block", padding: "4px 11px", borderRadius: 999,
          border: `1px solid ${gold}55`, background: `${gold}14`,
          color: gold, fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
          textTransform: "uppercase", marginBottom: 14,
        }}>
          For Dubai agents and agencies
        </div>

        <h1 style={{
          margin: 0, fontSize: compact ? 26 : 34, lineHeight: 1.15, fontWeight: 800,
          color: white, fontFamily: "Fraunces,serif", maxWidth: 560,
        }}>
          Win the conversation your client has already Googled.
        </h1>

        <p style={{ margin: "14px 0 0", fontSize: 14, color: text, lineHeight: 1.7, maxWidth: 560 }}>
          DXB Analytics is Dubai property research built for the people who have to
          answer for it. Twenty-four years of market history, 193 communities and
          1,728 projects — every number with the source it came from, and a link to
          read it yourself.
        </p>

        <p style={{ margin: "12px 0 0", fontSize: 13, color: muted, lineHeight: 1.7, maxWidth: 560 }}>
          Including the two times this market fell. No portal shows a buyer that.
          Being the agent who does is the point.
        </p>
      </div>

      {/* ── Proof, specific enough to check ──────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
        gap: 12, marginBottom: 26,
      }}>
        {PROOF.map(p => (
          <div key={p.stat} style={{
            border: `1px solid ${border}`, borderRadius: 10, padding: "13px 14px",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: gold, fontFamily: "Fraunces,serif" }}>
              {p.stat}
            </div>
            <div style={{ fontSize: 11, color: muted, marginTop: 5, lineHeight: 1.5 }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* ── What an agent actually does with it ──────────────────────── */}
      {!compact && (
        <div style={{ marginBottom: 26 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
            color: muted, marginBottom: 12,
          }}>
            What you do with it
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            {FOR_AGENTS.map(f => (
              <div key={f.title}>
                <div style={{ fontSize: 13, fontWeight: 700, color: white, marginBottom: 5, lineHeight: 1.4 }}>
                  {f.title}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: muted, lineHeight: 1.65 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Price, stated plainly ────────────────────────────────────── */}
      <div style={{
        border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px",
        background: "rgba(255,255,255,0.02)", marginBottom: 18,
      }}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: muted, marginBottom: 4 }}>
              Individual agent
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: white, fontFamily: "Fraunces,serif" }}>
              {PRICING_LABELS.pro}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: muted, marginBottom: 4 }}>
              Agency
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: gold, fontFamily: "Fraunces,serif" }}>
              {PRICING_LABELS.enterprise}
            </div>
          </div>
          <div style={{ flex: "1 1 180px", fontSize: 11, color: muted, lineHeight: 1.55 }}>
            Start on a free trial. No card required to look around.
            {" "}
            <a href="/agency/signup" style={{ color: gold, textDecoration: "none", borderBottom: `1px solid ${gold}44` }}>
              Registering an agency?
            </a>
          </div>
        </div>
      </div>

      {onGetStarted && (
        <button
          type="button"
          onClick={onGetStarted}
          style={{
            padding: "12px 22px", borderRadius: 10, cursor: "pointer",
            border: "none", background: gold, color: "#0B1017",
            fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
          }}
        >
          Start free trial
        </button>
      )}
    </div>
  );
}
