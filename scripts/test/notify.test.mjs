/**
 * NOTIFICATIONS — who gets told, and whether the message is worth reading.
 *
 * The two ways this feature fails:
 *   1. Somebody stops being told and nobody notices, because the recipient list
 *      was written by hand and a stage was added later.
 *   2. Somebody is told about a thing they are not allowed to see — a data leak
 *      with a bell on it.
 *
 * Both are asserted here.
 *
 *     node scripts/test/notify.test.mjs
 */
import { EVENTS, URGENCY, notificationsFor, onStageChange, inbox,
         inboxSummary } from "../../src/crm/model/notify.js";
import { JOURNEYS } from "../../src/crm/model/journeys.js";
import { RESPONSIBILITY } from "../../src/crm/model/workflow.js";
import { DEPARTMENTS } from "../../src/crm/model/org.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

/* A small agency with one of everything. */
const PEOPLE = [
  { id: "ag1", name: "Layla",  department: "sales",        seniority: "staff",   managerId: "mgr" },
  { id: "ag2", name: "Tom",    department: "sales",        seniority: "staff",   managerId: "mgr" },
  { id: "mgr", name: "Khalid", department: "sales",        seniority: "manager" },
  { id: "sa1", name: "Sara",   department: "salesAdmin",   seniority: "staff" },
  { id: "ls1", name: "Yusuf",  department: "listings",     seniority: "staff" },
  { id: "cv1", name: "Amira",  department: "conveyancing", seniority: "staff" },
  { id: "fi1", name: "Noor",   department: "finance",      seniority: "staff" },
  { id: "hr1", name: "Dana",   department: "hr",           seniority: "staff" },
  { id: "it1", name: "Raj",    department: "it",           seniority: "staff" },
  { id: "own", name: "Owner",  department: "management",   seniority: "owner" },
];

/* ── EVERY EVENT IS USABLE ────────────────────────────────────────────────── */
head("EVERY EVENT SAYS WHAT HAPPENED AND WHAT TO DO");

const ctx = { dealName: "Marina Gate 1104", stageLabel: "NOC received", does: "Ask the developer.",
              departmentLabel: "Conveyancing", blockedBy: "No NOC on file.", leadName: "Sarah",
              source: "Property Finder", listingTitle: "Unit 1104", personName: "Layla",
              documentLabel: "Visa", days: 12, note: "It expired 3 days ago.", waited: "3 hours",
              amount: "AED 70,000", agentShare: "AED 35,000", agentName: "Layla",
              dates: "12–20 March", leaveType: "annual", approved: true };

let weak = [];
Object.values(EVENTS).forEach(e => {
  const t = typeof e.title === "function" ? e.title(ctx) : e.title;
  const b = typeof e.body === "function" ? e.body(ctx) : e.body;
  if (!t || t.length < 8) weak.push(e.key + ":title");
  if (!b || b.length < 20) weak.push(e.key + ":body");
  if (!URGENCY[e.urgency]) weak.push(e.key + ":urgency");
  if (!e.audience?.length) weak.push(e.key + ":audience");
});
ok("every event has a title, a body, an urgency and an audience", weak.length === 0, weak);
ok("there are events for deals, leads, listings, money, people and compliance",
   new Set(Object.values(EVENTS).map(e => e.area)).size === 6,
   [...new Set(Object.values(EVENTS).map(e => e.area))]);

/* ── DERIVED, NOT LISTED ──────────────────────────────────────────────────── */
head("RECIPIENTS COME FROM THE WORKFLOW, SO A NEW STAGE CANNOT BE MISSED");

const departmentsUsed = new Set();
Object.values(RESPONSIBILITY).forEach(j =>
  Object.values(j).forEach(r => departmentsUsed.add(r.department)));
const covered = [...departmentsUsed].every(d =>
  PEOPLE.some(p => p.department === d) || d === "sales");
ok("every department that owns a step can be notified", covered, [...departmentsUsed]);

/* Move a deal into each department in turn and check the right people hear. */
const dealAt = stage => ({ id: "d1", journey: "secondary", stage, client: "Marina Gate 1104",
                           agentId: "ag1", agentName: "Layla", documents: {
                             FORM_A: { receivedAt: new Date().toISOString() },
                             TRAKHEESI: { receivedAt: new Date().toISOString() },
                           } });

const toAdmin = onStageChange(dealAt("permit"), { id: "ag1", name: "Layla" }, PEOPLE);
ok("moving to the permit stage tells Sales admin",
   toAdmin.some(n => n.userId === "sa1"), toAdmin.map(n => n.userId));
ok("  and does NOT tell conveyancing", !toAdmin.some(n => n.userId === "cv1"));
ok("  the person who moved it gets an FYI, not a task",
   toAdmin.find(n => n.userId === "ag1")?.urgency === "fyi",
   toAdmin.find(n => n.userId === "ag1"));

const toConv = onStageChange(dealAt("noc"), { id: "sa1", name: "Sara" }, PEOPLE);
ok("a deal reaching the NOC stage tells conveyancing",
   toConv.some(n => n.userId === "cv1"));
ok("  and it is marked as needing attention now",
   toConv.find(n => n.userId === "cv1")?.urgency === "now");
/* This deal is BLOCKED at the NOC stage, so it produces deal_blocked. The
   message must carry both halves: why it is stuck AND what to do about it. */
ok("  it says why it is stuck",
   /will not transfer without a current NOC/.test(toConv.find(n => n.userId === "cv1")?.body || ""),
   toConv.find(n => n.userId === "cv1")?.body);
ok("  AND what to do about it",
   /Ask the developer/.test(toConv.find(n => n.userId === "cv1")?.body || ""),
   toConv.find(n => n.userId === "cv1")?.body);

const toAgent = onStageChange(dealAt("viewings"), { id: "sa1", name: "Sara" }, PEOPLE);
ok("sales work goes to the AGENT on the deal, not all of sales",
   toAgent.some(n => n.userId === "ag1") && !toAgent.some(n => n.userId === "ag2"),
   toAgent.map(n => n.userId));

/* ── NOBODY IS TOLD WHAT THEY CANNOT SEE ──────────────────────────────────── */
head("A NOTIFICATION ABOUT SOMETHING YOU CANNOT OPEN IS A LEAK WITH A BELL ON IT");

const leadNote = notificationsFor("lead_assigned",
  { leadId: "L1", leadName: "Sarah", source: "Property Finder", agentId: "ag1" }, PEOPLE);
ok("a lead notification reaches the agent", leadNote.some(n => n.userId === "ag1"));
ok("  and never reaches HR",     !leadNote.some(n => n.userId === "hr1"));
ok("  nor Accounts",             !leadNote.some(n => n.userId === "fi1"));
ok("  nor IT",                   !leadNote.some(n => n.userId === "it1"));

const unassigned = notificationsFor("lead_unassigned",
  { leadId: "L2", leadName: "Omar", routingWhy: "No agent covers that area." }, PEOPLE);
ok("an unassigned lead reaches Sales admin", unassigned.some(n => n.userId === "sa1"));

const money = notificationsFor("commission_received",
  { dealId: "d1", dealName: "Marina Gate 1104", agentId: "ag1", agentName: "Layla",
    amount: "AED 70,000", agentShare: "AED 35,000" }, PEOPLE);
ok("a commission notice reaches the agent and Accounts",
   money.some(n => n.userId === "ag1") && money.some(n => n.userId === "fi1"));
ok("  but not another agent",    !money.some(n => n.userId === "ag2"));
ok("  and not HR",               !money.some(n => n.userId === "hr1"));

/* Compliance is about the person, so it reaches them wherever they sit. */
const brn = notificationsFor("brn_expiring",
  { personId: "ag1", personName: "Layla", agentId: "ag1", days: 12 }, PEOPLE);
ok("a lapsing broker card tells the agent",   brn.some(n => n.userId === "ag1"));
ok("  their manager",                          brn.some(n => n.userId === "mgr"));
ok("  and HR",                                 brn.some(n => n.userId === "hr1"));
ok("  and explains what renewal involves",
   /RERA exam re-sat/.test(brn[0].body), brn[0].body);
ok("  and why it is urgent",
   /every listing they hold stops being compliant/.test(brn[0].body));

/* ── NOBODY IS TOLD ABOUT THEIR OWN ACTION ────────────────────────────────── */
head("YOU ARE NOT NOTIFIED OF WHAT YOU JUST DID");

const selfMove = onStageChange(dealAt("noc"), { id: "cv1", name: "Amira" }, PEOPLE);
const amiraTask = selfMove.filter(n => n.userId === "cv1" && n.urgency === "now");
ok("moving a deal into your own department does not ping you as a task",
   amiraTask.length === 0, selfMove.filter(n => n.userId === "cv1"));

/* ── THE INBOX ────────────────────────────────────────────────────────────── */
head("THE INBOX — most urgent first");

const all = [
  ...notificationsFor("lead_assigned", { leadName: "A", source: "Bayut", agentId: "ag1" }, PEOPLE,
                      new Date(Date.now() - 3600e3)),
  ...notificationsFor("commission_paid", { dealName: "B", agentId: "ag1", agentShare: "AED 10,000" }, PEOPLE,
                      new Date(Date.now() - 60e3)),
];
const mine = inbox(all, "ag1");
ok("the urgent one comes first even though it is older",
   mine[0].urgency === "now", mine.map(n => `${n.event}:${n.urgency}`));

const sum = inboxSummary(all, "ag1");
ok("the summary counts what is unread",  sum.unread === 2, sum);
ok("  and says how many need you now",   /1 thing needs you now/.test(sum.headline), sum.headline);
ok("an empty inbox says so plainly",     /Nothing needs you/.test(inboxSummary([], "ag1").headline));

/* ── THE FIELDS THE APP ACTUALLY READS ────────────────────────────────────── */
head("FIELD NAMES — the mismatch that would have failed invisibly");

const one = notificationsFor("lead_assigned",
  { leadName: "Sarah", source: "Bayut", agentId: "ag1" }, PEOPLE)[0];

/* The dashboard's listener orders by createdAt, and Firestore OMITS any
   document missing the field it orders by. A notification written with only
   `at` would never have appeared at all — no error, no empty state, just
   silence. The existing panel also renders `message`, not `body`. */
ok("every notification carries createdAt, which the listener orders by",
   Boolean(one.createdAt), one);
ok("  and `message`, which the panel renders", Boolean(one.message), one.message);
ok("  message matches body",  one.message === one.body);
ok("  createdAt matches at",  one.createdAt === one.at);
ok("  and `type`, which the panel routes on", one.type === "lead_assigned");
ok("  read starts false",     one.read === false);
ok("  addressed to the right person", one.userId === "ag1");

console.log(`\n${"═".repeat(62)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(62));
process.exit(fail ? 1 : 0);
