/**
 * THE NIGHTLY SWEEP — noticing what nobody has, without nagging.
 *
 * Eleven of the fifteen notification events describe things that happen because
 * time passed. They were built and tested and had nothing to trigger them.
 *
 * The hard part is not noticing. It is not nagging: a broker card ninety days
 * from expiry is ninety days of identical messages if the sweep is naive, and
 * people mute a channel that behaves like that — then miss the one that
 * mattered. Most of what is asserted here is about restraint.
 *
 *     node scripts/test/watch.test.mjs
 */
import { sweep, sweepSummary, thresholdFor, THRESHOLDS } from "../../src/crm/model/watch.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const NOW = Date.now();
const inDays  = n => new Date(NOW + n * 86400000).toISOString();
const agoDays = n => new Date(NOW - n * 86400000).toISOString();
const agoMins = n => new Date(NOW - n * 60000).toISOString();

const PEOPLE = [
  { id: "ag1", name: "Layla", department: "sales",        seniority: "staff", managerId: "mgr" },
  { id: "mgr", name: "Khalid", department: "sales",       seniority: "manager" },
  { id: "sa1", name: "Sara",  department: "salesAdmin",   seniority: "staff" },
  { id: "cv1", name: "Amira", department: "conveyancing", seniority: "staff" },
  { id: "ls1", name: "Yusuf", department: "listings",     seniority: "staff" },
  { id: "fi1", name: "Noor",  department: "finance",      seniority: "staff" },
  { id: "hr1", name: "Dana",  department: "hr",           seniority: "staff" },
];

/* ── THRESHOLDS ───────────────────────────────────────────────────────────── */
head("ONCE PER THRESHOLD, NOT ONCE A DAY");

ok("89 days out hits the 90-day warning", thresholdFor(89) === 90, thresholdFor(89));
ok("47 days out hits NOTHING — sixty already went, thirty is not due",
   thresholdFor(47, [90, 60]) === null, thresholdFor(47, [90, 60]));
ok("29 days out hits the 30-day warning", thresholdFor(29, [90, 60]) === 30);
ok("already lapsed is its own case",      thresholdFor(-3) === "expired");
ok("nothing recorded means nothing fires", thresholdFor(null) === null);
ok("the thresholds run 90 down to 0",     THRESHOLDS[0] === 90 && THRESHOLDS.at(-1) === 0);

/* ── BROKER CARDS ─────────────────────────────────────────────────────────── */
head("BROKER CARDS — sales only, and once each");

const brnData = { people: PEOPLE.map(p => p.id === "ag1"
  ? { ...p, expiries: { brn: inDays(28) } } : p) };

const first = sweep(brnData, new Set(), NOW);
ok("a card 28 days out is reported", first.some(n => n.event === "brn_expiring"), first.map(n => n.event));
ok("  to the agent, their manager and HR",
   ["ag1", "mgr", "hr1"].every(id => first.some(n => n.event === "brn_expiring" && n.userId === id)),
   first.filter(n => n.event === "brn_expiring").map(n => n.userId));

const sentKeys = new Set(first.map(n => n.dedupeKey));
const second = sweep(brnData, sentKeys, NOW);
ok("running it again the same day sends NOTHING",
   second.filter(n => n.event === "brn_expiring").length === 0, second.map(n => n.event));
ok("  which is also what makes the cron safe to retry", second.length === 0, second.length);

/* An accounts clerk has no broker card and must never be told they need one. */
const financeNoBrn = sweep({ people: PEOPLE }, new Set(), NOW);
ok("nobody without a card recorded is warned about one",
   !financeNoBrn.some(n => n.event === "brn_expiring"), financeNoBrn.map(n => n.event));

/* ── PERSONAL DOCUMENTS ───────────────────────────────────────────────────── */
head("VISAS AND EMIRATES IDs — every department, not just sales");

const visas = sweep({ people: [
  { ...PEOPLE[5], expiries: { visa: inDays(25) } },        // Noor, Accounts
  ...PEOPLE.filter(p => p.id !== "fi1"),
] }, new Set(), NOW);
ok("an accounts clerk's visa is watched too",
   visas.some(n => n.event === "document_expiry_person"), visas.map(n => n.event));
ok("  and it reaches HR",
   visas.some(n => n.event === "document_expiry_person" && n.userId === "hr1"));

/* ── LISTINGS ─────────────────────────────────────────────────────────────── */
head("LISTINGS — a warning, and a violation happening right now");

const compliant = { id: "l1", title: "Marina Gate 1104", agentId: "ag1",
  formA: { signedAt: agoDays(30) }, permitNumber: "71-2026-4412",
  permitExpiresAt: inDays(6), postedTo: ["pf"] };

const permitSoon = sweep({ people: PEOPLE, listings: [compliant] }, new Set(), NOW);
ok("a permit 6 days out is reported", permitSoon.some(n => n.event === "permit_expiring"));
ok("  to sales admin and the listings desk",
   ["sa1", "ls1"].every(id => permitSoon.some(n => n.event === "permit_expiring" && n.userId === id)));

/* Live and not compliant is not a reminder — it is a violation running now. */
const violating = { ...compliant, permitExpiresAt: agoDays(3) };
const v1 = sweep({ people: PEOPLE, listings: [violating] }, new Set(), NOW);
ok("a listing advertised on a lapsed permit is reported",
   v1.some(n => n.event === "listing_not_compliant"), v1.map(n => n.event));
ok("  and it repeats daily rather than once, because it is live and wrong",
   sweep({ people: PEOPLE, listings: [violating] },
         new Set(["not_compliant:l1:2020-01-01"]), NOW)
     .some(n => n.event === "listing_not_compliant"));

const draft = { ...violating, postedTo: [] };
ok("a non-compliant DRAFT is not reported — nothing is being advertised",
   !sweep({ people: PEOPLE, listings: [draft] }, new Set(), NOW)
     .some(n => n.event === "listing_not_compliant"));

/* ── DEALS ────────────────────────────────────────────────────────────────── */
head("DEALS — stale documents and deals that stopped moving");

const nocStale = { id: "d1", journey: "secondary", stage: "trustee", client: "Villa 22",
  agentId: "ag1", documents: { NOC: { receivedAt: agoDays(34) } },
  steps: [{ at: agoDays(2), fromStage: "noc", toStage: "trustee" }] };
const nocSweep = sweep({ people: PEOPLE, deals: [nocStale] }, new Set(), NOW);
ok("an expired NOC is reported", nocSweep.some(n => n.event === "document_expiring"), nocSweep.map(n => n.event));
ok("  to conveyancing",
   nocSweep.some(n => n.event === "document_expiring" && n.userId === "cv1"));

const stalled = { id: "d2", journey: "secondary", stage: "noc", client: "Villa 9",
  agentId: "ag1", documents: {},
  steps: [{ at: agoDays(21), fromStage: "mou", toStage: "noc" }] };
const st = sweep({ people: PEOPLE, deals: [stalled] }, new Set(), NOW);
ok("a deal untouched for 21 days is reported", st.some(n => n.event === "deal_stalled"), st.map(n => n.event));
ok("  and it names the days and the department",
   /21 days/.test(st.find(n => n.event === "deal_stalled")?.title || ""),
   st.find(n => n.event === "deal_stalled")?.title);

const fresh = { ...stalled, id: "d3", steps: [{ at: agoDays(3), fromStage: "mou", toStage: "noc" }] };
ok("a deal touched 3 days ago is left alone",
   !sweep({ people: PEOPLE, deals: [fresh] }, new Set(), NOW).some(n => n.event === "deal_stalled"));

const done = { id: "d4", journey: "secondary", stage: "paid", client: "Done",
  agentId: "ag1", documents: {}, commissionLines: [{ base: 1e6, ratePct: 2, state: "paid" }],
  steps: [{ at: agoDays(90), fromStage: "transferred", toStage: "paid" }] };
ok("a finished deal is never chased",
   sweep({ people: PEOPLE, deals: [done] }, new Set(), NOW).length === 0);

/* ── LEADS ────────────────────────────────────────────────────────────────── */
head("LEADS — the one that earns money");

const waiting = { id: "L1", name: "Sarah", assignedTo: "ag1", status: "New Lead",
  createdAt: agoMins(330), notes_log: [] };
const lw = sweep({ people: PEOPLE, leads: [waiting] }, new Set(), NOW);
ok("a lead unanswered for 5 hours is reported", lw.some(n => n.event === "lead_unanswered"), lw.map(n => n.event));
ok("  to the agent it was given to",
   lw.some(n => n.event === "lead_unanswered" && n.userId === "ag1"));

const answered = { ...waiting, id: "L2", notes_log: [{ type: "Call", at: agoMins(300) }] };
ok("a lead that was called is left alone",
   !sweep({ people: PEOPLE, leads: [answered] }, new Set(), NOW).some(n => n.event === "lead_unanswered"));

const noteOnly = { ...waiting, id: "L3", notes_log: [{ type: "Note", at: agoMins(300) }] };
ok("writing a note is not contacting anybody, so it is still chased",
   sweep({ people: PEOPLE, leads: [noteOnly] }, new Set(), NOW).some(n => n.event === "lead_unanswered"));

const orphan = { id: "L4", name: "Omar", status: "New Lead", createdAt: agoMins(60), notes_log: [] };
const ow = sweep({ people: PEOPLE, leads: [orphan] }, new Set(), NOW);
ok("a lead nobody owns is reported", ow.some(n => n.event === "lead_unassigned"));
ok("  to sales admin",  ow.some(n => n.event === "lead_unassigned" && n.userId === "sa1"));

const closed = { ...waiting, id: "L5", status: "Closed Deal" };
ok("a closed lead is not chased",
   !sweep({ people: PEOPLE, leads: [closed] }, new Set(), NOW).some(n => n.event === "lead_unanswered"));

/* ── VIEWINGS ─────────────────────────────────────────────────────────────── */
head("VIEWINGS — an agent's week is the thing they actually do");

const unwritten = { id: "v1", agentId: "ag1", leadId: "L1", propertyName: "Marina Gate 1104",
                    at: agoDays(2), outcome: "scheduled" };
const uw = sweep({ people: PEOPLE, viewings: [unwritten] }, new Set(), NOW);
ok("a viewing still marked Booked two days on is chased",
   uw.some(n => n.event === "viewing_unwritten"), uw.map(n => n.event));
ok("  to the agent whose viewing it was",
   uw.some(n => n.event === "viewing_unwritten" && n.userId === "ag1"));
ok("  and it says why it matters",
   /seller will ask what they said/.test(uw.find(n => n.event === "viewing_unwritten")?.body || ""),
   uw.find(n => n.event === "viewing_unwritten")?.body);

const writtenUp = { ...unwritten, id: "v2", outcome: "done", feedback: "Liked it, worried about service charge." };
ok("a viewing written up properly is left alone",
   !sweep({ people: PEOPLE, viewings: [writtenUp] }, new Set(), NOW).some(n => n.event === "viewing_unwritten"));

const tomorrowAt = new Date(NOW + 86400000);
tomorrowAt.setHours(11, 0, 0, 0);
const tmw = sweep({ people: PEOPLE, viewings: [
  { id: "v3", agentId: "ag1", at: tomorrowAt.toISOString(), propertyName: "Unit A", leadName: "Sarah" },
  { id: "v4", agentId: "ag1", at: new Date(tomorrowAt.getTime() + 4 * 3600000).toISOString(),
    propertyName: "Unit B", leadName: "Omar" },
] }, new Set(), NOW);
const t2 = tmw.find(n => n.event === "viewing_tomorrow");
ok("tomorrow's viewings are sent as ONE message, not one each",
   tmw.filter(n => n.event === "viewing_tomorrow").length === 1, tmw.filter(n => n.event === "viewing_tomorrow").length);
ok("  counting them",       /2 viewings tomorrow/.test(t2?.title || ""), t2?.title);
ok("  naming each client",  /Sarah/.test(t2?.body || "") && /Omar/.test(t2?.body || ""), t2?.body);
ok("  and saying to confirm tonight",
   /Confirm with each client tonight/.test(t2?.body || ""));

const clash = sweep({ people: PEOPLE, viewings: [
  { id: "v5", agentId: "ag1", at: new Date(NOW + 86400000).toISOString(), propertyName: "Marina Gate" },
  { id: "v6", agentId: "ag1", at: new Date(NOW + 86400000 + 20 * 60000).toISOString(), propertyName: "JVC Villa" },
] }, new Set(), NOW);
ok("two viewings 20 minutes apart are flagged as a clash",
   clash.some(n => n.event === "viewing_clash"), clash.map(n => n.event));
ok("  warning a client will be left waiting",
   /left waiting/.test(clash.find(n => n.event === "viewing_clash")?.body || ""));

/* ── THE LOG ──────────────────────────────────────────────────────────────── */
head("A SILENT NIGHT IS DISTINGUISHABLE FROM A BROKEN ONE");

ok("nothing due says so",  sweepSummary([]) === "nothing due");
ok("otherwise it counts by event",
   /2 sent — brn_expiring 1, deal_stalled 1/.test(
     sweepSummary([{ event: "brn_expiring" }, { event: "deal_stalled" }])),
   sweepSummary([{ event: "brn_expiring" }, { event: "deal_stalled" }]));

/* ── THE AGENCY IS IN DUBAI, NOT IN UTC ───────────────────────────────────
   This suite went red on its own at 00:41 Dubai time with nothing having
   changed but the clock. Every date in watch.js was the UTC calendar day, and
   Dubai is four hours ahead with no daylight saving — so between midnight and
   4am, "tomorrow" in UTC is today in Dubai.

   That window is exactly when this code runs: the digest it builds is the
   evening-before reminder. An agent with a 9am viewing would get the list for
   the day that had just ended, and the correct list would never arrive,
   because the dedupe key for it had already been marked sent.

   The times below are fixed, so this fails wherever it runs if the Dubai day
   is ever computed as the UTC one again. */
head("THE DAY IS THE DUBAI DAY");

/* 00:41 Dubai on 6 August = 20:41 UTC on 5 August. */
const lateNight = Date.parse("2026-08-05T20:41:00.000Z");
const viewingTomorrow = { id: "vz", agentId: "ag1", propertyName: "Unit Z", leadName: "Yusuf",
                          at: "2026-08-07T05:00:00.000Z" };   /* 9am Dubai on the 7th */
const night = sweep({ people: PEOPLE, viewings: [viewingTomorrow] }, new Set(), lateNight);
ok("at 00:41 Dubai, tomorrow means the 7th and not the 6th",
   night.some(n => n.event === "viewing_tomorrow"), night.map(n => n.event));
ok("  and the digest is keyed to the Dubai date",
   night.find(n => n.event === "viewing_tomorrow")?.dedupeKey?.endsWith("2026-08-07"),
   night.find(n => n.event === "viewing_tomorrow")?.dedupeKey);

/* A viewing at 9pm Dubai is still that evening, not the next morning. */
const eveningSlot = { id: "vy", agentId: "ag1", propertyName: "Unit Y", leadName: "Layla",
                      at: "2026-08-07T17:00:00.000Z" };       /* 9pm Dubai on the 7th */
const evening = sweep({ people: PEOPLE, viewings: [eveningSlot] }, new Set(), lateNight);
ok("a 9pm Dubai viewing is filed on its own evening, not the next day",
   evening.some(n => n.event === "viewing_tomorrow"), evening.map(n => n.event));

/* Midday, well away from any boundary, must be unaffected. */
const midday = Date.parse("2026-08-06T08:00:00.000Z");        /* noon Dubai */
ok("nothing changes in the middle of the day",
   sweep({ people: PEOPLE, viewings: [viewingTomorrow] }, new Set(), midday)
     .some(n => n.event === "viewing_tomorrow"));

console.log(`\n${"═".repeat(62)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(62));
process.exit(fail ? 1 : 0);
