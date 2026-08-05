/**
 * THE WORKFLOW — whose turn it is, what they must do, and what they recorded.
 *
 * The owner's brief: every individual's work defined, everyone knowing what to
 * do, and nobody walking over to ask where a deal is. That only holds if EVERY
 * stage of EVERY journey has an owner and an instruction — one gap and there is
 * a step nobody owns, which is the exact failure this is meant to prevent.
 *
 *     node scripts/test/workflow.test.mjs
 */
import { JOURNEYS, stagesOf, canAdvance } from "../../src/crm/model/journeys.js";
import {
  RESPONSIBILITY, responsibilityFor, whoseTurn, myWork, workByDepartment,
  stepRecord, stepQuality, dealTimeline, stageDurations,
} from "../../src/crm/model/workflow.js";
import { DEPARTMENTS } from "../../src/crm/model/org.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);
const NOW = Date.now();
const ago = n => new Date(NOW - n * 86400000).toISOString();

/* ── NO STEP WITHOUT AN OWNER ─────────────────────────────────────────────── */
head("EVERY STAGE HAS AN OWNER AND AN INSTRUCTION");

let missing = [];
Object.entries(JOURNEYS).forEach(([jk, j]) => {
  j.stages.forEach(s => {
    const r = responsibilityFor(jk, s.key);
    if (!r) missing.push(`${jk}/${s.key}`);
  });
});
ok("no stage in any journey is unowned", missing.length === 0, missing);

let noInstruction = [], badDept = [], noRecord = [];
Object.entries(RESPONSIBILITY).forEach(([jk, stages]) => {
  Object.entries(stages).forEach(([sk, r]) => {
    if (!r.does || r.does.length < 30) noInstruction.push(`${jk}/${sk}`);
    if (!DEPARTMENTS[r.department]) badDept.push(`${jk}/${sk}=${r.department}`);
    if (!r.records || r.records.length < 10) noRecord.push(`${jk}/${sk}`);
  });
});
ok("every step is written as a real instruction", noInstruction.length === 0, noInstruction);
ok("every owner is a real department",            badDept.length === 0, badDept);
ok("every step says what must be written down",   noRecord.length === 0, noRecord);

ok("the instructions are instructions, not labels",
   /Ask the developer for the NOC/.test(RESPONSIBILITY.secondary.noc.does),
   RESPONSIBILITY.secondary.noc.does);
ok("  and warn about the thing that bites",
   /expires in about thirty/.test(RESPONSIBILITY.secondary.noc.does));

/* ── WHOSE TURN ───────────────────────────────────────────────────────────── */
head("WHOSE TURN IS IT");

const atNoc = { journey: "secondary", stage: "noc", agentId: "ag1", documents: {} };
const t1 = whoseTurn(atNoc, NOW);
ok("an NOC stage belongs to conveyancing", t1.department === "conveyancing", t1.department);
ok("  and names what they must do",  /Ask the developer/.test(t1.does));
ok("  it is blocked, and says why",  t1.blocked === true && /Land Department will not transfer/.test(t1.blockedBy));
ok("  but it is still THEIR turn — blocked is not unowned",
   t1.department === "conveyancing", t1);

const atPermit = { journey: "secondary", stage: "permit", documents: { FORM_A: { receivedAt: ago(2) } } };
ok("a Trakheesi permit belongs to sales admin",
   whoseTurn(atPermit, NOW).department === "salesAdmin", whoseTurn(atPermit, NOW).department);

/* Reaching "Commission received" is a TARGET, not an accomplished fact. If
   arriving there counted as finished, Accounts' work — raise the invoice, chase
   it, pay the agent — would drop off every desk the moment it became due. */
const atPaid = { journey: "secondary", stage: "paid", documents: {},
                 commissionLines: [{ base: 3e6, ratePct: 2, state: "invoiced" }] };
ok("a deal at the final stage with money outstanding is NOT finished",
   whoseTurn(atPaid, NOW).done === false, whoseTurn(atPaid, NOW));
ok("  it is on Accounts' desk",   whoseTurn(atPaid, NOW).department === "finance");
ok("  told to raise the invoice and chase it",
   /Raise the tax invoice/.test(whoseTurn(atPaid, NOW).does));

const settled = { ...atPaid, commissionLines: [{ base: 3e6, ratePct: 2, state: "paid" }] };
ok("once the money is in AND the agent paid, it is finished",
   whoseTurn(settled, NOW).done === true);
ok("  and says so",  /agent has been paid/.test(whoseTurn(settled, NOW).summary));

const noLines = { journey: "secondary", stage: "paid", documents: {} };
ok("a deal with no commission recorded is not silently closed",
   whoseTurn(noLines, NOW).done === false, whoseTurn(noLines, NOW));

ok("an Ejari registration belongs to sales admin",
   whoseTurn({ journey: "rental", stage: "ejari", documents: {} }, NOW).department === "salesAdmin");
ok("an Oqood registration belongs to conveyancing",
   whoseTurn({ journey: "offplan", stage: "oqood", documents: {} }, NOW).department === "conveyancing");

/* ── WHAT IS ON MY DESK ───────────────────────────────────────────────────── */
head("WHAT IS ON MY DESK — the list that replaces asking");

const DEALS = [
  { id: "d1", journey: "secondary", stage: "noc",    agentId: "ag1", documents: {} },
  { id: "d2", journey: "secondary", stage: "permit", agentId: "ag1", documents: { FORM_A: { receivedAt: ago(3) } } },
  { id: "d3", journey: "secondary", stage: "viewings", agentId: "ag1", documents: {} },
  { id: "d4", journey: "secondary", stage: "viewings", agentId: "ag2", documents: {} },
  { id: "d5", journey: "secondary", stage: "paid",   agentId: "ag1", documents: {},
    commissionLines: [{ base: 2e6, ratePct: 2, state: "paid" }] },
];

const coordWork = myWork(DEALS, { id: "c1", department: "conveyancing" }, NOW);
ok("conveyancing sees the NOC deal",       coordWork.total === 1 && coordWork.items[0].deal.id === "d1");
ok("  and is told it is blocked",          coordWork.blocked === 1, coordWork.headline);

const adminWork = myWork(DEALS, { id: "sa", department: "salesAdmin" }, NOW);
ok("sales admin sees the permit deal",     adminWork.total === 1 && adminWork.items[0].deal.id === "d2");

const agentWork = myWork(DEALS, { id: "ag1", department: "sales" }, NOW);
ok("an agent sees only THEIR viewings deal", agentWork.total === 1 && agentWork.items[0].deal.id === "d3",
   agentWork.items.map(i => i.deal.id));
ok("  not another agent's",                !agentWork.items.some(i => i.deal.id === "d4"));

const fin = myWork(DEALS, { id: "f", department: "finance" }, NOW);
ok("a fully settled deal is on nobody's desk", fin.total === 0, fin.total);
ok("  but an unpaid one lands on Accounts",
   myWork([{ id: "x", journey: "secondary", stage: "paid", documents: {},
             commissionLines: [{ base: 1e6, ratePct: 2, state: "received" }] }],
          { id: "f", department: "finance" }, NOW).total === 1);

const hrWork = myWork(DEALS, { id: "h", department: "hr" }, NOW);
ok("HR has no deal work at all",           hrWork.total === 0);
ok("  and is told so plainly",             /Nothing is waiting on you/.test(hrWork.headline));

/* ── THE WHOLE COMPANY AT A GLANCE ────────────────────────────────────────── */
head("WHERE EVERY DEAL IS SITTING — the owner's view");

const byDept = workByDepartment(DEALS, NOW);
ok("work is grouped by department",  byDept.length === 3, byDept.map(d => d.label));
ok("  blocked departments come first", byDept[0].blocked > 0, byDept[0]);
ok("  each carries a readable label", byDept.every(d => d.label && d.label.length > 2));

/* ── THE RECORD ───────────────────────────────────────────────────────────── */
head("WHAT WAS DONE — so nobody has to ask");

const step = stepRecord(atNoc, "trustee",
  { id: "c1", name: "Amira", department: "conveyancing" },
  "NOC received from Emaar on the 3rd, fee AED 5,250 paid. It expires on the 2nd of next month, so the trustee booking has to be inside that.",
  [{ name: "noc.pdf", url: "https://x/noc.pdf", size: 91000, type: "application/pdf" }]);

ok("a step records who moved it",        step.byName === "Amira" && step.byDepartment === "conveyancing");
ok("  from which stage to which",        step.fromStage === "noc" && step.toStage === "trustee");
ok("  with the file attached",           step.files.length === 1 && step.files[0].name === "noc.pdf");
ok("  and what they were ASKED to record, kept beside what they wrote",
   /date it was issued and the date it expires/.test(step.wasAskedToRecord), step.wasAskedToRecord);
ok("a proper note passes",               stepQuality(step).ok === true);

ok("an empty note is refused",           stepQuality({ note: "" }).ok === false);
ok("  saying the next person will have to ask",
   /has to ask what happened/.test(stepQuality({ note: "" }).why));
ok("a one-word note is refused",         stepQuality({ note: "done" }).ok === false);
ok("  quoting it back",                  /"done"/.test(stepQuality({ note: "done" }).why),
   stepQuality({ note: "done" }).why);

/* ── THE TIMELINE ─────────────────────────────────────────────────────────── */
head("THE TIMELINE, AND WHERE DEALS STALL");

const worked = {
  journey: "secondary", stage: "trustee", createdAt: ago(30),
  steps: [
    { at: ago(25), fromStage: "form_a", fromLabel: "Form A signed", toStage: "permit", toLabel: "Permit issued",
      byName: "Layla", byDepartment: "sales", note: "Owner signed at 2%, non-exclusive.", files: [] },
    { at: ago(20), fromStage: "permit", fromLabel: "Permit issued", toStage: "published", toLabel: "Published",
      byName: "Sara", byDepartment: "salesAdmin", note: "Permit 71-2026-4412, expires in 90 days.", files: [] },
    { at: ago(4),  fromStage: "noc", fromLabel: "NOC received", toStage: "trustee", toLabel: "Trustee booked",
      byName: "Amira", byDepartment: "conveyancing", note: "ok", files: [] },
  ],
};

const tl = dealTimeline(worked);
ok("the timeline is newest first",   tl[0].byName === "Amira", tl.map(t => t.byName));
ok("  each line reads as a sentence", /Layla moved it from Form A signed to Permit issued/.test(tl[2].summary), tl[2].summary);
ok("  and a thin note is FLAGGED as thin", tl[0].quality.ok === false, tl[0].quality);
ok("  while a real one is not",            tl[1].quality.ok === true);

const durations = stageDurations(worked);
ok("stage durations are measured",   durations.length === 3, durations);
ok("  the first stage took 5 days",  durations[0].days === 5, durations[0]);
ok("  and the long stall is visible", Math.max(...durations.map(d => d.days)) === 16,
   durations.map(d => `${d.stage}:${d.days}d`));

/* ── THE PANEL AND THE BUTTON MUST AGREE ─────────────────────────────────── */
/* The department panel counts blocked deals by asking whoseTurn. The button on
   the deal asks canAdvance. If the paperwork rule reaches one and not the
   other, an owner who has just switched to requiring files sees the same
   blocked count as before while every deal refuses to move — which is a screen
   arguing with the button underneath it. */
head("THE BOARD CANNOT DISAGREE WITH THE GATE");

const tickedOnly = { journey: "secondary", stage: "form_a", client: "T",
                     documents: { FORM_A: { receivedAt: "2026-01-01T00:00:00.000Z", by: "x" } } };
const withFile   = { journey: "secondary", stage: "form_a", client: "F",
                     documents: { FORM_A: { receivedAt: "2026-01-01T00:00:00.000Z", by: "x",
                                            file: { path: "p", name: "form-a.pdf", size: 10 } } } };

for (const strict of [false, true]) {
  for (const deal of [tickedOnly, withFile]) {
    const gate = canAdvance(deal, { strict });
    const turn = whoseTurn(deal, NOW, { strict });
    ok(`${deal.client} · strict ${strict}: the panel says what the gate says`,
       turn.blocked === !gate.ok, { blocked: turn.blocked, gate: gate.ok });
  }
}

const deptLoose  = workByDepartment([tickedOnly], NOW);
const deptStrict = workByDepartment([tickedOnly], NOW, { strict: true });
ok("a ticked-only deal is not counted blocked while a tick is enough",
   deptLoose[0].blocked === 0, deptLoose[0]);
ok("and IS counted blocked once the agency requires files",
   deptStrict[0].blocked === 1, deptStrict[0]);

/* Sales work belongs to the agent on the deal, so the deal has to name them. */
const mineTicked = { ...tickedOnly, agentId: "a1" };
const workLoose  = myWork([mineTicked], { id: "a1", department: "sales" }, NOW);
const workStrict = myWork([mineTicked], { id: "a1", department: "sales" }, NOW, { strict: true });
ok("somebody's own desk shows the deal under either rule",
   workLoose.total === 1 && workStrict.total === 1,
   { loose: workLoose.total, strict: workStrict.total });
ok("  and counts it blocked only once the agency requires files",
   workLoose.blocked === 0 && workStrict.blocked === 1,
   { loose: workLoose.blocked, strict: workStrict.blocked });
ok("  which is what their headline says",
   /waiting on you\.$/.test(workLoose.headline) && /1 of them blocked/.test(workStrict.headline),
   { loose: workLoose.headline, strict: workStrict.headline });

console.log(`\n${"═".repeat(62)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(62));
process.exit(fail ? 1 : 0);
