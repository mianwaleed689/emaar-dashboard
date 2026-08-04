/* eslint-disable */
/**
 * ACCESS — THE IT ADMINISTRATOR'S CONSOLE.
 *
 * WHY IT EXISTS
 * ─────────────
 * The IT department holds "none" on every business area in org.js — leads,
 * deals, listings, people, money, compliance — and that is correct. IT has no
 * business reading a client's phone number or an agent's salary. But it had
 * been implemented as "no product at all": an IT administrator signed in, was
 * offered two tabs, and could do nothing with either.
 *
 * Administering ACCOUNTS is a different axis from reading DATA. This screen
 * answers the three questions an IT administrator is actually asked — who has
 * access, what can they reach, and what is broken — and returns none of the
 * company's data while doing it. Everything comes from src/crm/model/access.js,
 * tested to 38 assertions, and the permission matrix is computed with the same
 * scopeFor the product itself uses, so this screen cannot describe behaviour
 * the product does not have.
 *
 * WHAT IT DELIBERATELY CANNOT SHOW
 * ────────────────────────────────
 * Pay, personal documents, clients, or the contents of any deal. The model
 * hands back names, departments and scopes; there is nothing else in it to
 * render. An access console that quietly becomes a way to read the company is
 * worse than no access console.
 */
import React, { useMemo, useState } from "react";
import { T } from "../data";
import { effectiveAccess, accountHealth, accessSummary } from "../crm/model/access";

const card  = { background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 12 };
const muted = { fontSize: 9.5, fontWeight: 700, color: T.textMuted, letterSpacing: .7, textTransform: "uppercase" };
const SEV   = { high: "#EF4444", medium: "#F59E0B", low: T.textMuted };
const SCOPE = { org: T.green, team: T.gold, own: "#60A5FA", none: T.textMuted };
const AREAS = ["leads", "deals", "listings", "people", "money", "compliance"];

function AccessTab({ teamMembers = [], myLeads = [], deals = [], listings = [], orgName }) {
  const [section, setSection] = useState("problems");
  const [q, setQ] = useState("");

  const rows     = useMemo(() => teamMembers.map(effectiveAccess), [teamMembers]);
  const problems = useMemo(
    () => accountHealth(teamMembers, { leads: myLeads, deals, listings }),
    [teamMembers, myLeads, deals, listings]);
  const summary  = useMemo(() => accessSummary(teamMembers, problems), [teamMembers, problems]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(needle) ||
      r.email.toLowerCase().includes(needle) ||
      r.departmentLabel.toLowerCase().includes(needle));
  }, [rows, q]);

  if (!teamMembers.length) return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: T.textSecondary,
                  fontSize: 12.5, lineHeight: 1.8, maxWidth: 480, margin: "0 auto" }}>
      No accounts on record yet. Once people are added in Team, this shows who can
      sign in, what each of them can reach, and anything that will cause a support call.
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: "14px 4px 12px", borderBottom: `1px solid ${T.border}` }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>
          Access{orgName ? ` — ${orgName}` : ""}
        </h2>
        <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.7, margin: "8px 0 0", maxWidth: 760 }}>
          Who can sign in, what each of them can reach, and what is broken.
          {summary.highSeverity > 0
            ? ` ${summary.highSeverity} account${summary.highSeverity === 1 ? " is" : "s are"} holding live work while disabled.`
            : " Nothing urgent."}
        </p>
        <div style={{ marginTop: 9, fontSize: 11, lineHeight: 1.6, color: T.textMuted }}>
          <span style={{ fontWeight: 700 }}>Not covered</span> — pay, personal documents,
          client details and the contents of deals. This console administers accounts; it is
          not a way to read the company.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "14px 4px" }}>
        {[["Accounts", summary.accounts, `${summary.active} active · ${summary.suspended} disabled`],
          ["Needs attention", summary.problems, summary.highSeverity ? `${summary.highSeverity} urgent` : "nothing urgent"],
          ["No department", summary.noDepartment, summary.noDepartment ? "access is being guessed" : "all set"],
          ["Never signed in", summary.neverSignedIn, "seats paid for and unused"],
        ].map(([label, value, note]) => (
          <div key={label} style={{ ...card, padding: "12px 15px", flex: "1 1 180px", minWidth: 160 }}>
            <div style={muted}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.white,
                          fontFamily: "'Fraunces',serif", margin: "4px 0 2px" }}>{value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, padding: "0 4px" }}>
        {[["problems", `What is broken${problems.length ? ` (${problems.length})` : ""}`],
          ["accounts", `Accounts (${rows.length})`]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setSection(k)}
            style={{ padding: "9px 14px", border: "none", background: "transparent",
                     borderBottom: `2px solid ${section === k ? T.gold : "transparent"}`,
                     color: section === k ? T.gold : T.textMuted, fontSize: 12,
                     fontWeight: section === k ? 700 : 500, cursor: "pointer",
                     fontFamily: "'Outfit',sans-serif" }}>{l}</button>
        ))}
      </div>

      {section === "problems" && (
        <div style={{ padding: "14px 4px" }}>
          {!problems.length ? (
            <div style={{ ...card, padding: "34px 20px", textAlign: "center",
                          fontSize: 12.5, color: T.textSecondary, lineHeight: 1.7 }}>
              Every account has a department, a reporting line and has been used.
              Nothing here needs fixing.
            </div>
          ) : problems.map((p, i) => (
            <div key={i} style={{ ...card, padding: "11px 14px", marginBottom: 8,
                                  borderLeft: `3px solid ${SEV[p.severity]}` }}>
              <div style={{ display: "flex", gap: 9, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: SEV[p.severity],
                               textTransform: "uppercase", letterSpacing: .6 }}>{p.severity}</span>
                <span style={{ fontSize: 12.5, color: T.white, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: T.textSecondary }}>— {p.what}</span>
              </div>
              <div style={{ fontSize: 11.5, color: T.textSecondary, marginTop: 4, lineHeight: 1.6 }}>
                {p.detail}
              </div>
              <div style={{ fontSize: 11, color: T.gold, marginTop: 3 }}>{p.fix}</div>
            </div>
          ))}
        </div>
      )}

      {section === "accounts" && (
        <div style={{ padding: "12px 4px" }}>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search a name, an email or a department…"
            style={{ width: "100%", maxWidth: 420, padding: "8px 12px", marginBottom: 12,
                     background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                     borderRadius: 8, color: T.white, fontSize: 12,
                     fontFamily: "'Outfit',sans-serif", outline: "none" }}/>

          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1fr repeat(6, 62px)",
                          gap: 6, padding: "9px 13px", borderBottom: `1px solid ${T.border}`,
                          background: "rgba(255,255,255,0.02)" }}>
              <div style={muted}>Person</div>
              <div style={muted}>Department</div>
              <div style={muted}>Level</div>
              {AREAS.map(a => <div key={a} style={{ ...muted, textAlign: "center" }}>{a.slice(0, 5)}</div>)}
            </div>

            {shown.map(r => (
              <div key={r.uid} style={{ borderBottom: `1px solid ${T.border}40` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1fr repeat(6, 62px)",
                              gap: 6, padding: "9px 13px", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: r.suspended ? T.textMuted : T.white,
                                  fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis",
                                  whiteSpace: "nowrap" }}>
                      {r.name}{r.suspended && <span style={{ color: "#EF4444", fontSize: 9.5 }}> · disabled</span>}
                    </div>
                    <div style={{ fontSize: 9.5, color: T.textMuted, overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{r.departmentLabel}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{r.seniorityLabel}</div>
                  {AREAS.map(a => (
                    <div key={a} title={`${a}: ${r.areas[a]}`}
                      style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700,
                               color: SCOPE[r.areas[a]] }}>
                      {r.areas[a] === "none" ? "—" : r.areas[a]}
                    </div>
                  ))}
                </div>
                <div style={{ padding: "0 13px 9px", fontSize: 10, color: T.textMuted }}>{r.reach}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 10.5, color: T.textMuted, lineHeight: 1.7 }}>
            Scopes are computed with the same rules the product enforces, so what this says a
            person can reach is what they actually reach. Change a department or a reporting
            line in Team and it changes here.
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessTab;
