/* eslint-disable */
/**
 * PEOPLE — THE WHOLE COMPANY, NOT THE SALES TEAM.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * ───────────────
 * The owner asked how a company runs its HR through this system, and pointed
 * out that HR is used by every department, not only sales. Before this tab
 * there was nothing: a grep of src/ for payroll, annual leave, sick leave,
 * attendance, visa expiry, labour card, gratuity, end of service, employment
 * contract and appraisal returned nothing at all. The Team tab creates user
 * accounts — name, email, phone, temporary password — and shows a sales
 * scoreboard. That is user administration, not HR.
 *
 * WHAT IT SHOWS, AND TO WHOM
 * ──────────────────────────
 * Scope comes from src/crm/model/org.js, so this one component is four screens:
 *
 *   an employee in any department  sees themselves — leave, documents, pay
 *   a manager in any department    sees their team's absence and expiries
 *   HR and Admin/PRO               see everyone in the company
 *   the owner and directors        see everyone
 *
 * A sales manager may see their team's absence but NOT their pay, because they
 * manage performance rather than salary. That gate is canSeePay().
 *
 * THE RULES ARE NOT IN THIS FILE
 * ──────────────────────────────
 * Every calculation — 30 days annual leave, sick leave in bands of 15 full / 30
 * half / 45 unpaid, probation capped at six months, notice of 30 to 90 days,
 * gratuity at 21 days a year for five years then 30 capped at two years' pay —
 * lives in src/crm/model/hr.js with 146 assertions behind it. This file draws
 * what that returns and never re-implements any of it, because the arithmetic
 * is somebody's money.
 *
 * WHAT IT DELIBERATELY DOES NOT DO YET
 * ────────────────────────────────────
 * No payroll run and no WPS SIF file. Payroll carries real liability when it is
 * wrong, and generating a bank file is not something to ship alongside four
 * other things in one pass. The leave, document and offboarding halves are the
 * ones that fail quietly and expensively today, so they come first.
 */
import React, { useState, useMemo } from "react";
import { T } from "../data";
import {
  DEPARTMENTS, SENIORITY, scopeFor, canSeePay, intentFor, rankOf,
} from "../crm/model/org";
import {
  LAW, SICK_TOTAL_DAYS, LEAVE_TYPES, TRACKED_EXPIRIES, OFFBOARDING_STEPS,
  annualLeaveBalance, sickLeaveEntitlement, probationStatus, noticePeriod,
  gratuity, finalSettlement, complianceRegister, canBroker, serviceYears,
} from "../crm/model/hr";

const card  = { background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 12 };
const muted = { fontSize: 9.5, fontWeight: 700, color: T.textMuted, letterSpacing: .7, textTransform: "uppercase" };
const aed   = n => `AED ${Math.round(Number(n) || 0).toLocaleString("en-AE")}`;

const LEVEL_COLOUR = { expired: "#EF4444", urgent: "#EF4444", soon: "#F59E0B", watch: "#3B82F6" };

export default function PeopleTab({
  teamMembers = [], firebaseUser, orgRole, userRole, orgName, orgId, userName,
}) {
  const me = useMemo(() => ({
    id: firebaseUser?.uid || "",
    orgRole, platformAdmin: userRole === "admin" || userRole === "superAdmin",
    department: undefined, seniority: undefined,   // inferred from orgRole for now
  }), [firebaseUser, orgRole, userRole]);

  const scope  = scopeFor(me, "people");
  const intent = intentFor(me, "people");
  const [section, setSection] = useState("directory");
  const [selected, setSelected] = useState(null);
  const [dept, setDept] = useState("all");
  const [showHelp, setShowHelp] = useState(false);

  /* Everyone this person may see. Existing accounts carry no department, so
     one is inferred rather than showing an empty company. */
  const people = useMemo(() => (teamMembers || []).map(m => ({
    ...m,
    id: m.uid || m.id,
    name: m.name || m.email || "Unnamed",
    department: m.department || (m.orgRole === "owner" || m.orgRole === "director" ? "management" : "sales"),
    seniority: m.seniority || (m.orgRole === "manager" ? "manager" : m.orgRole === "director" ? "director"
                              : m.orgRole === "owner" ? "owner" : "staff"),
    expiries: m.expiries || {},
  })), [teamMembers]);

  const visible = useMemo(() => {
    if (scope === "none") return [];
    if (scope === "org")  return people;
    if (scope === "team") return people.filter(p => p.managerId === me.id || p.id === me.id);
    return people.filter(p => p.id === me.id);
  }, [people, scope, me.id]);

  const shown = useMemo(
    () => dept === "all" ? visible : visible.filter(p => p.department === dept),
    [visible, dept]);

  const register = useMemo(() => complianceRegister(
    visible.map(p => ({ id: p.id, name: p.name, kind: "person", expiries: p.expiries })),
  ), [visible]);

  const byDept = useMemo(() => {
    const m = {};
    visible.forEach(p => { m[p.department] = (m[p.department] || 0) + 1; });
    return m;
  }, [visible]);

  /* Sales is the only department that needs a broker card. */
  const brokers = useMemo(() => visible.filter(p => p.department === "sales"), [visible]);
  const lapsed  = useMemo(() => brokers.filter(p => !canBroker(p).ok), [brokers]);

  if (scope === "none") {
    return (
      <div style={{ padding: "70px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 7, fontFamily: "'Fraunces',serif" }}>
          People is not part of your role
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
          Your own leave, documents and payslips will appear here once your record has
          been set up. Managing other people is handled by HR and by whoever manages
          your team.
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { k: "directory",  l: "Directory",  what: "Everyone you may see, by department." },
    { k: "compliance", l: "Expiring",   what: "Visas, Emirates IDs, labour cards, broker cards — what lapses soon." },
    { k: "leave",      l: "Leave",      what: "Annual and sick leave, with the UAE bands applied." },
    { k: "leaving",    l: "Offboarding",what: "Notice, handover, gratuity and final settlement." },
  ];

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* WHAT THIS IS */}
      <div style={{ padding: "14px 4px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>
            {intent?.title || "People"}{orgName ? ` — ${orgName}` : ""}
          </h2>
          <button type="button" onClick={() => setShowHelp(v => !v)}
            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 14, padding: "3px 11px",
                     color: showHelp ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {showHelp ? "Hide the rules" : "What are the rules?"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6, maxWidth: 800 }}>
          {intent?.question} Every department is here — sales, listings, conveyancing,
          finance, HR, admin and management — not only the people who work leads.
        </div>

        {showHelp && (
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Rules />
          </div>
        )}
      </div>

      {/* WHAT NEEDS ATTENTION */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "12px 4px" }}>
        <Figure label="People" value={visible.length} accent={T.gold}
          note={Object.entries(byDept).map(([d, n]) => `${n} ${DEPARTMENTS[d]?.label || d}`).join(" · ") || "Nobody on record yet."} />
        <Figure label="Expiring or expired" value={register.rows.length}
          accent={register.expired ? "#EF4444" : register.urgent ? "#F59E0B" : "#10B981"}
          note={register.headline} />
        <Figure label="Brokers who cannot work" value={lapsed.length}
          accent={lapsed.length ? "#EF4444" : "#10B981"}
          note={lapsed.length
            ? `${lapsed.map(p => p.name).join(", ")} — a lapsed broker card also makes every listing they hold non-compliant.`
            : brokers.length ? "Every broker card on record is current." : "No sales staff on record yet."} />
      </div>

      {/* SECTIONS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, paddingLeft: 4, overflowX: "auto" }}>
        {SECTIONS.map(s => (
          <button key={s.k} type="button" title={s.what} onClick={() => { setSection(s.k); setSelected(null); }}
            style={{ padding: "10px 15px", border: "none", background: "transparent",
                     borderBottom: section === s.k ? `2px solid ${T.gold}` : "2px solid transparent",
                     color: section === s.k ? T.white : T.textMuted, fontSize: 12,
                     fontWeight: section === s.k ? 700 : 400, cursor: "pointer",
                     whiteSpace: "nowrap", fontFamily: "'Outfit',sans-serif" }}>
            {s.l}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 4px" }}>
        {section === "directory" && (
          <Directory people={shown} all={visible} dept={dept} setDept={setDept}
                     byDept={byDept} onOpen={setSelected} me={me} />
        )}
        {section === "compliance" && <Compliance register={register} people={visible} />}
        {section === "leave"      && <Leave people={visible} me={me} />}
        {section === "leaving"    && <Leaving people={visible} me={me} />}
      </div>

      {selected && <Person person={selected} me={me} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── PARTS ─────────────────────────────────────────────────────────────────── */

function Figure({ label, value, note, accent }) {
  return (
    <div title={note} style={{ ...card, flex: "1 1 210px", minWidth: 190, padding: "13px 15px" }}>
      <div style={{ ...muted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 800, color: accent || T.white, fontFamily: "'Fraunces',serif" }}>{value}</div>
      {note && <div style={{ fontSize: 9.5, color: T.textMuted, marginTop: 5, lineHeight: 1.55 }}>{note}</div>}
    </div>
  );
}

/** The statutory rules, printed, so nobody has to take the numbers on trust. */
function Rules() {
  return (
    <>
      <div style={{ ...card, flex: "1 1 320px", minWidth: 280, padding: "12px 14px" }}>
        <div style={{ ...muted, marginBottom: 7 }}>Leave, under UAE law</div>
        <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.75 }}>
          <b style={{ color: T.white }}>Annual — {LAW.annualLeaveDays} days</b> a year once past one year of
          service. Below that it accrues month by month, so nobody books leave they have not earned.
          <br /><br />
          <b style={{ color: T.white }}>Sick — up to {SICK_TOTAL_DAYS} days</b> a year, and it is not one
          entitlement but three bands: the first <b>{LAW.sickFullPayDays} at full pay</b>, the next{" "}
          <b>{LAW.sickHalfPayDays} at half</b>, the last <b>{LAW.sickUnpaidDays} unpaid</b>. There is
          none during probation. A 40-day illness is 15 days full then 25 at half — not 40 of anything,
          which is where a hand-worked payroll goes wrong.
        </div>
      </div>
      <div style={{ ...card, flex: "1 1 320px", minWidth: 280, padding: "12px 14px" }}>
        <div style={{ ...muted, marginBottom: 7 }}>Leaving</div>
        <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.75 }}>
          <b style={{ color: T.white }}>Probation</b> is capped at {LAW.probationMaxMonths} months and
          cannot be extended or renewed.
          <br /><br />
          <b style={{ color: T.white }}>Notice</b> is {LAW.noticeMinDays} days at minimum; up to{" "}
          {LAW.noticeMaxDays} may be agreed, and then it binds both sides.
          <br /><br />
          <b style={{ color: T.white }}>Gratuity</b> is calculated on <b>basic salary only</b> —{" "}
          {LAW.gratuityDaysFirst5} days a year for the first five years, {LAW.gratuityDaysAfter5} a year
          after that, capped at {LAW.gratuityCapYears} years' pay, and nothing below one year of service.
        </div>
      </div>
      <div style={{ flex: "1 1 100%", fontSize: 10.5, color: T.textMuted, lineHeight: 1.65,
                    background: "rgba(255,255,255,0.015)", border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "11px 14px" }}>
        <b style={{ color: T.textSecondary }}>What this does not do yet.</b>{" "}
        There is no payroll run and no WPS bank file. Payroll carries real liability when it is wrong,
        and a bank file is not something to ship alongside four other things in one pass. It also does
        not file anything with MOHRE or immigration — it tells you what is due and when.
      </div>
    </>
  );
}

function Directory({ people, all, dept, setDept, byDept, onOpen, me }) {
  if (!all.length) {
    return (
      <div style={{ padding: "38px 20px 44px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 7, fontFamily: "'Fraunces',serif" }}>
          Nobody on record yet
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
          Add your people in the Team tab and they appear here with their department,
          documents and leave. Every department belongs here, not only sales — a finance
          clerk and a PRO have visas and leave just as an agent does.
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <Chip on={dept === "all"} onClick={() => setDept("all")}
              tip="Everyone you may see">All {all.length}</Chip>
        {Object.keys(DEPARTMENTS).filter(d => byDept[d]).map(d => (
          <Chip key={d} on={dept === d} onClick={() => setDept(d)} tip={DEPARTMENTS[d].what}>
            {DEPARTMENTS[d].label} {byDept[d]}
          </Chip>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {people.map(p => {
          const b = p.department === "sales" ? canBroker(p) : null;
          const exp = complianceRegister([{ id: p.id, name: p.name, kind: "person", expiries: p.expiries }]);
          return (
            <div key={p.id} onClick={() => onOpen(p)}
              style={{ ...card, padding: "11px 14px", cursor: "pointer", display: "flex",
                       gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.white }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 1 }}>
                  {DEPARTMENTS[p.department]?.label || p.department}
                  {" · "}{SENIORITY[p.seniority]?.label || "Staff"}
                  {p.email ? ` · ${p.email}` : ""}
                </div>
              </div>
              <div style={{ fontSize: 10.5, textAlign: "right", minWidth: 140 }}>
                {b && !b.ok
                  ? <span style={{ color: "#EF4444", fontWeight: 700 }}>Cannot broker — {b.reason.split(".")[0]}</span>
                  : exp.rows.length
                    ? <span style={{ color: LEVEL_COLOUR[exp.rows[0].level] }}>{exp.rows[0].note}</span>
                    : <span style={{ color: T.textMuted }}>Nothing expiring</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Chip = ({ on, onClick, tip, children }) => (
  <button type="button" onClick={onClick} title={tip}
    style={{ padding: "5px 12px", borderRadius: 14, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
             border: `1px solid ${on ? T.gold : T.border}`, fontSize: 11, fontWeight: on ? 700 : 500,
             background: on ? "rgba(212,168,67,0.14)" : "transparent", color: on ? T.gold : T.textMuted }}>
    {children}
  </button>
);

function Compliance({ register, people }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.65, marginBottom: 12, maxWidth: 780 }}>
        Everything that expires, worst first, warned at 90, 60 and 30 days. This is the
        screen that connects HR to the rest of the product: <b style={{ color: T.white }}>an
        agent whose broker card lapses cannot lawfully broker, and every listing they hold
        stops being compliant the same day</b> — which no standalone HR system can see and
        no standalone CRM knows about.
      </div>

      {register.rows.length === 0 ? (
        <div style={{ ...card, padding: "26px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981", marginBottom: 5 }}>
            Nothing expires in the next 90 days
          </div>
          <div style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.6, maxWidth: 440, margin: "0 auto" }}>
            {people.length
              ? "Every document on record is current. Anything without a date recorded cannot be checked — add expiry dates on each person to make this meaningful."
              : "Nobody is on record yet, so there is nothing to check."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {register.rows.map((r, i) => (
            <div key={i} style={{ ...card, padding: "11px 14px", borderColor: `${LEVEL_COLOUR[r.level]}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: LEVEL_COLOUR[r.level] }}>{r.note}</span>
                <span style={{ fontSize: 10.5, color: T.textMuted }}>{r.expiresOn}</span>
              </div>
              <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 4, lineHeight: 1.6 }}>{r.why}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card, padding: "12px 14px", marginTop: 14 }}>
        <div style={{ ...muted, marginBottom: 7 }}>What is tracked, and for whom</div>
        {TRACKED_EXPIRIES.map(t => (
          <div key={t.key} style={{ display: "flex", gap: 9, marginBottom: 5, alignItems: "baseline" }}>
            <span style={{ fontSize: 11, color: T.white, fontWeight: 600, width: 150, flexShrink: 0 }}>{t.label}</span>
            <span style={{ fontSize: 10.5, color: T.textMuted, lineHeight: 1.55 }}>
              <b style={{ color: T.textSecondary }}>
                {t.scope === "person" ? (t.key === "brn" ? "Sales only" : "Everyone") :
                 t.scope === "org" ? "The company" : "Every listing"}
              </b>{" — "}{t.why}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Leave({ people, me }) {
  const [who, setWho] = useState(people[0]?.id || "");
  const p = people.find(x => x.id === who) || people[0];
  if (!p) return <Empty what="leave" />;

  const bal = annualLeaveBalance({ joinedAt: p.joinedAt, takenDays: p.leaveTaken || 0,
                                   carriedOver: p.leaveCarried || 0 });
  const prob = p.joinedAt ? probationStatus({ joinedAt: p.joinedAt, probationMonths: p.probationMonths || LAW.probationMaxMonths }) : null;
  const sick = sickLeaveEntitlement({ daysRequested: 0, alreadyTakenThisYear: p.sickTaken || 0,
                                      onProbation: prob?.onProbation, monthlySalary: p.monthlySalary || 0 });

  return (
    <div>
      {people.length > 1 && (
        <select value={who} onChange={e => setWho(e.target.value)}
          style={{ padding: "7px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                   borderRadius: 7, color: T.white, fontSize: 12, marginBottom: 12, fontFamily: "'Outfit',sans-serif" }}>
          {people.map(x => <option key={x.id} value={x.id}>{x.name} — {DEPARTMENTS[x.department]?.label}</option>)}
        </select>
      )}

      {!p.joinedAt && (
        <div style={{ ...card, padding: "12px 14px", marginBottom: 12, borderColor: "rgba(245,158,11,0.3)" }}>
          <div style={{ fontSize: 11.5, color: "#F59E0B", lineHeight: 1.6 }}>
            No joining date is recorded for {p.name}, so leave cannot be calculated. Every
            entitlement below depends on length of service.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ ...card, flex: "1 1 300px", minWidth: 270, padding: "13px 15px" }}>
          <div style={{ ...muted, marginBottom: 6 }}>Annual leave</div>
          {/* A dash rather than "0 days" when there is no joining date. Zero is a
              number somebody will act on; not knowing is not zero. */}
          <div style={{ fontSize: 22, fontWeight: 800, color: bal.known ? T.gold : T.textMuted, fontFamily: "'Fraunces',serif" }}>
            {bal.known ? `${bal.remaining} days` : "—"}
          </div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 6, lineHeight: 1.6 }}>{bal.note}</div>
        </div>

        <div style={{ ...card, flex: "1 1 300px", minWidth: 270, padding: "13px 15px" }}>
          <div style={{ ...muted, marginBottom: 6 }}>Sick leave left this year</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>
            {Math.max(0, SICK_TOTAL_DAYS - (p.sickTaken || 0))} days
          </div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 6, lineHeight: 1.6 }}>
            {prob?.onProbation
              ? "On probation — there is no paid sick leave during probation under UAE law."
              : `Of ${SICK_TOTAL_DAYS} a year: the first ${LAW.sickFullPayDays} at full pay, the next ${LAW.sickHalfPayDays} at half, the last ${LAW.sickUnpaidDays} unpaid.`}
          </div>
        </div>

        {prob && (
          <div style={{ ...card, flex: "1 1 300px", minWidth: 270, padding: "13px 15px" }}>
            <div style={{ ...muted, marginBottom: 6 }}>Probation</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: prob.onProbation ? "#F59E0B" : "#10B981", fontFamily: "'Fraunces',serif" }}>
              {prob.onProbation ? `${prob.daysLeft} days left` : "Passed"}
            </div>
            <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 6, lineHeight: 1.6 }}>{prob.note}</div>
            {prob.warning && <div style={{ fontSize: 10.5, color: "#F59E0B", marginTop: 5, lineHeight: 1.6 }}>{prob.warning}</div>}
          </div>
        )}
      </div>

      {/* A worked example, because the bands are the thing people get wrong. */}
      <div style={{ ...card, padding: "13px 15px", marginTop: 12 }}>
        <div style={{ ...muted, marginBottom: 7 }}>If {p.name.split(" ")[0]} were off sick for 40 days</div>
        {(() => {
          const s = sickLeaveEntitlement({ daysRequested: 40, alreadyTakenThisYear: p.sickTaken || 0,
                                           onProbation: prob?.onProbation, monthlySalary: p.monthlySalary || 0 });
          return (
            <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.7 }}>
              {s.note}
              {p.monthlySalary
                ? <> That is <b style={{ color: T.white }}>{aed(s.pay)}</b> of sick pay, not 40 days of salary.</>
                : <> Record a monthly salary to see what that pays.</>}
            </div>
          );
        })()}
      </div>

      <div style={{ ...card, padding: "12px 14px", marginTop: 12 }}>
        <div style={{ ...muted, marginBottom: 7 }}>Leave types</div>
        {Object.values(LEAVE_TYPES).map(t => (
          <div key={t.key} style={{ display: "flex", gap: 9, marginBottom: 4, alignItems: "baseline" }}>
            <span style={{ fontSize: 11, color: T.white, fontWeight: 600, width: 100, flexShrink: 0 }}>{t.label}</span>
            <span style={{ fontSize: 10.5, color: T.textMuted, lineHeight: 1.55 }}>{t.what}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Leaving({ people, me }) {
  const [who, setWho] = useState(people[0]?.id || "");
  const p = people.find(x => x.id === who) || people[0];
  if (!p) return <Empty what="offboarding" />;

  const maySeePay = canSeePay(me, p.id);
  const g = p.joinedAt ? gratuity({ basicMonthlySalary: p.basicSalary || 0, joinedAt: p.joinedAt }) : null;
  const n = noticePeriod({ contractNoticeDays: p.noticeDays || LAW.noticeMinDays });
  const fs = p.joinedAt && maySeePay
    ? finalSettlement({ basicMonthlySalary: p.basicSalary || 0, monthlySalary: p.monthlySalary || 0,
                        joinedAt: p.joinedAt, unusedLeaveDays: p.leaveRemaining || 0,
                        outstandingCommission: p.outstandingCommission || 0 })
    : null;

  return (
    <div>
      {people.length > 1 && (
        <select value={who} onChange={e => setWho(e.target.value)}
          style={{ padding: "7px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                   borderRadius: 7, color: T.white, fontSize: 12, marginBottom: 12, fontFamily: "'Outfit',sans-serif" }}>
          {people.map(x => <option key={x.id} value={x.id}>{x.name} — {DEPARTMENTS[x.department]?.label}</option>)}
        </select>
      )}

      <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.65, marginBottom: 12, maxWidth: 780 }}>
        What is owed and what has to happen when {p.name} leaves. Nothing here is filed for
        you — it says what is due, in what order, and who owns each step.
      </div>

      {!p.joinedAt && (
        <div style={{ ...card, padding: "12px 14px", marginBottom: 12, borderColor: "rgba(245,158,11,0.3)" }}>
          <div style={{ fontSize: 11.5, color: "#F59E0B", lineHeight: 1.6 }}>
            No joining date is recorded for {p.name}, so gratuity and the final settlement
            cannot be calculated — both depend entirely on length of service. The notice
            period and the steps below still apply.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ ...card, flex: "1 1 260px", minWidth: 240, padding: "13px 15px" }}>
          <div style={{ ...muted, marginBottom: 6 }}>Notice</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>{n.applied} days</div>
          <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 5, lineHeight: 1.6 }}>{n.note}</div>
          {n.warning && <div style={{ fontSize: 10.5, color: "#F59E0B", marginTop: 4, lineHeight: 1.6 }}>{n.warning}</div>}
        </div>

        {g && maySeePay && (
          <div style={{ ...card, flex: "1 1 300px", minWidth: 270, padding: "13px 15px" }}>
            <div style={{ ...muted, marginBottom: 6 }}>End-of-service gratuity</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>{aed(g.amount)}</div>
            <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 5, lineHeight: 1.6 }}>{g.note}</div>
            {g.workings.length > 0 && (
              <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${T.border}` }}>
                {g.workings.map((w, i) => (
                  <div key={i} style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.65 }}>{w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {fs && (
          <div style={{ ...card, flex: "1 1 300px", minWidth: 270, padding: "13px 15px" }}>
            <div style={{ ...muted, marginBottom: 6 }}>Final settlement</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981", fontFamily: "'Fraunces',serif" }}>{aed(fs.total)}</div>
            <div style={{ marginTop: 7 }}>
              {fs.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5, lineHeight: 1.8 }}>
                  <span style={{ color: T.textMuted }}>{l.label}</span>
                  <span style={{ color: l.amount < 0 ? "#EF4444" : T.textSecondary }}>{aed(l.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!maySeePay && (
          <div style={{ ...card, flex: "1 1 300px", minWidth: 270, padding: "13px 15px" }}>
            <div style={{ ...muted, marginBottom: 6 }}>Money</div>
            <div style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.65 }}>
              Gratuity and the final settlement are not shown to you. Pay is visible to HR,
              finance and management, and to the person themselves — a manager sees
              performance and absence, not salary.
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, padding: "13px 15px" }}>
        <div style={{ ...muted, marginBottom: 8 }}>The steps, and who owns each</div>
        {OFFBOARDING_STEPS
          .filter(s => p.department === "sales" || !["leads", "listings", "deals", "brn"].includes(s.key))
          .map((s, i) => (
          <div key={s.key} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "baseline" }}>
            <span style={{ fontSize: 10, color: T.textMuted, width: 14, flexShrink: 0 }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.white }}>
                {s.label}
                <span style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 400 }}> · {s.owner}</span>
              </div>
              <div style={{ fontSize: 10.5, color: T.textMuted, lineHeight: 1.55 }}>{s.what}</div>
            </div>
          </div>
        ))}
        {p.department !== "sales" && (
          <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 8, paddingTop: 8,
                        borderTop: `1px solid ${T.border}`, lineHeight: 1.6 }}>
            The broker card, leads and listings steps are not shown — {p.name} is in{" "}
            {DEPARTMENTS[p.department]?.label} and holds none of them.
          </div>
        )}
      </div>
    </div>
  );
}

function Person({ person, me, onClose }) {
  const b = person.department === "sales" ? canBroker(person) : null;
  const yrs = person.joinedAt ? serviceYears(person.joinedAt) : null;
  const reg = complianceRegister([{ id: person.id, name: person.name, kind: "person", expiries: person.expiries }]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 2000,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0D1117", borderRadius: 14, border: `1px solid ${T.border}`,
                    width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "15px 20px", borderBottom: `1px solid ${T.border}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 900, color: T.white }}>{person.name}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              {DEPARTMENTS[person.department]?.label} · {SENIORITY[person.seniority]?.label}
              {yrs != null ? ` · ${yrs} years' service` : ""}
            </div>
          </div>
          <button type="button" onClick={onClose} title="Close"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, borderRadius: 7,
                     color: T.textMuted, width: 28, height: 28, cursor: "pointer", fontSize: 15 }}>✕</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {b && (
            <div style={{ padding: "10px 12px", borderRadius: 8,
                          background: b.ok ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                          border: `1px solid ${b.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.3)"}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: b.ok ? "#10B981" : "#EF4444", marginBottom: 3 }}>
                {b.ok ? (b.warn ? "Can broker — card expiring" : "Can broker") : "Cannot broker"}
              </div>
              <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.6 }}>
                {b.reason || "Broker card is current."}
              </div>
            </div>
          )}
          <div>
            <div style={{ ...muted, marginBottom: 7 }}>Documents</div>
            {reg.rows.length ? reg.rows.map((r, i) => (
              <div key={i} style={{ fontSize: 11, color: LEVEL_COLOUR[r.level], marginBottom: 4, lineHeight: 1.6 }}>{r.note}</div>
            )) : (
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
                Nothing recorded expires in the next 90 days. Documents with no expiry date
                on record cannot be checked at all.
              </div>
            )}
          </div>
          {!canSeePay(me, person.id) && (
            <div style={{ fontSize: 10.5, color: T.textMuted, lineHeight: 1.6, borderTop: `1px solid ${T.border}`, paddingTop: 11 }}>
              Salary and settlement figures are not shown to you. They are visible to HR,
              finance and management, and to {person.name.split(" ")[0]}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Empty = ({ what }) => (
  <div style={{ padding: "34px 20px", textAlign: "center", fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
    Nobody is on record yet, so there is no {what} to show. Add your people in the
    Team tab — every department, not only sales.
  </div>
);
