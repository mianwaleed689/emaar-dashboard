/**
 * VIEWINGS — an agent's week, and the seller's question.
 *
 * A viewing used to be a note: no date, no property, no outcome, no feedback.
 * So nothing could remind anybody, a no-show looked exactly like a good viewing,
 * and the commonest question in the business — the seller ringing to ask what
 * people said — had no answer anywhere in the system.
 *
 *     node scripts/test/viewing.test.mjs
 */
import { OUTCOMES, VERDICTS, statusOf, clashes, diary, sellerReport,
         newViewing, FEEDBACK_PROMPT } from "../../src/crm/model/viewing.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const NOW = Date.now();
const inH  = h => new Date(NOW + h * 3600000).toISOString();
const agoH = h => new Date(NOW - h * 3600000).toISOString();

/* ── STATUS ───────────────────────────────────────────────────────────────── */
head("WHAT STATE A VIEWING IS REALLY IN");

ok("a viewing in 3 hours is booked",
   statusOf({ at: inH(3) }, NOW).key === "scheduled", statusOf({ at: inH(3) }, NOW));
ok("  and says how long",  /In 3 hours/.test(statusOf({ at: inH(3) }, NOW).note));

/* The one that matters: still says "Booked" long after it was due. */
const forgotten = statusOf({ at: agoH(50) }, NOW);
ok("one still marked Booked two days later is NOT still booked",
   forgotten.key === "unclosed", forgotten);
ok("  it is flagged red",       forgotten.colour === "#EF4444");
ok("  and asks the question",   /Close it off — did they come\?/.test(forgotten.note), forgotten.note);

const viewedNoFeedback = statusOf({ at: agoH(5), outcome: "done" }, NOW);
ok("a viewing with no feedback is flagged", viewedNoFeedback.needsFeedback === true);
ok("  saying the seller will ask",
   /seller will ask what they said/.test(viewedNoFeedback.note), viewedNoFeedback.note);

ok("a viewing written up properly is clean",
   statusOf({ at: agoH(5), outcome: "done", feedback: "Liked the layout, worried about the service charge." }, NOW)
     .needsFeedback === false);
ok("a no-show is its own outcome, not a failure to record",
   statusOf({ at: agoH(5), outcome: "noshow" }, NOW).key === "noshow");
ok("  and says why recording it matters",
   /no-shows twice is telling you something/.test(OUTCOMES.noshow.what));

/* ── CLASHES ──────────────────────────────────────────────────────────────── */
head("DOUBLE BOOKINGS — a client left standing outside a building");

const tight = [
  { id: "v1", agentId: "ag1", at: inH(24), propertyName: "Marina Gate 1104" },
  { id: "v2", agentId: "ag1", at: inH(24.5), propertyName: "JVC Villa 7" },
];
const c = clashes(tight);
ok("two viewings 30 minutes apart for one agent clash", c.length === 1, c.length);
ok("  and it names both properties",
   /Marina Gate 1104/.test(c[0].note) && /JVC Villa 7/.test(c[0].note), c[0].note);
ok("  and says what will happen",  /left waiting/.test(c[0].note));

ok("the same two hours apart do not clash",
   clashes([tight[0], { ...tight[1], at: inH(26) }]).length === 0);

ok("two DIFFERENT agents at the same time is normal and not flagged",
   clashes([tight[0], { ...tight[1], agentId: "ag2" }]).length === 0);

ok("a cancelled viewing cannot clash with anything",
   clashes([tight[0], { ...tight[1], outcome: "cancelled" }]).length === 0);

/* ── THE DIARY ────────────────────────────────────────────────────────────── */
head("AN AGENT'S WEEK");

const week = [
  { id: "a", agentId: "ag1", at: inH(2),   propertyName: "Unit A" },
  { id: "b", agentId: "ag1", at: inH(26),  propertyName: "Unit B" },
  { id: "c", agentId: "ag1", at: agoH(30), propertyName: "Unit C" },              // unclosed
  { id: "d", agentId: "ag2", at: inH(4),   propertyName: "Someone else's" },
];
const d = diary(week, "ag1", NOW);
ok("only this agent's viewings appear", d.total === 3, d.total);
ok("  grouped by day",                  d.days.length >= 2, d.days.map(x => x.date));
ok("  and the unwritten one is counted", d.unclosed === 1, d.unclosed);
ok("  the headline says how many to write up",
   /1 still to be written up/.test(d.headline), d.headline);
ok("an empty week says so plainly",
   /Nothing booked this week/.test(diary([], "ag1", NOW).headline));

/* ── THE SELLER'S QUESTION ────────────────────────────────────────────────── */
head("WHAT DO I TELL THE SELLER");

const onListing = [
  { listingId: "L1", outcome: "done", verdict: "price", feedback: "Loved it, said 3.4 was too much." },
  { listingId: "L1", outcome: "done", verdict: "price", feedback: "Same again — price." },
  { listingId: "L1", outcome: "done", verdict: "price", feedback: "Would offer at 3.1." },
  { listingId: "L1", outcome: "done", verdict: "interested", feedback: "Thinking about it." },
  { listingId: "L1", outcome: "noshow" },
  { listingId: "L1", outcome: "scheduled" },
];
const rep = sellerReport(onListing, "L1", NOW);
ok("it counts what was booked, viewed and missed",
   rep.booked === 6 && rep.viewed === 4 && rep.noshows === 1, rep);
ok("three of four saying the price is high is read as a PRICE conversation",
   /price conversation, not a marketing one/.test(rep.reading), rep.reading);

const wrongBuyer = [
  { listingId: "L2", outcome: "done", verdict: "wrong", feedback: "Wanted 3 beds." },
  { listingId: "L2", outcome: "done", verdict: "wrong", feedback: "Expected a sea view." },
];
ok("most saying it is not what they wanted points at the ADVERT",
   /advert may be attracting the wrong buyer/.test(sellerReport(wrongBuyer, "L2", NOW).reading));

const thin = [
  { listingId: "L3", outcome: "done", verdict: "interested" },
  { listingId: "L3", outcome: "done", feedback: "Liked it." },
];
const t = sellerReport(thin, "L3", NOW);
ok("a report built on missing feedback SAYS it is incomplete",
   /1 viewing has no feedback, so this report is incomplete/.test(t.warning), t.warning);
ok("nothing viewed yet is stated plainly",
   /Nobody has viewed it yet/.test(sellerReport([], "L4", NOW).reading));

/* ── CREATING ONE ─────────────────────────────────────────────────────────── */
head("BOOKING ONE FROM A LEAD");

const v = newViewing({
  lead: { id: "L1", name: "Sarah Whitfield" },
  listing: { id: "P1", title: "Marina Gate 1104" },
  agentId: "ag1", agentName: "Layla", at: inH(48), orgId: "org1",
});
ok("it links the lead",     v.leadId === "L1" && v.leadName === "Sarah Whitfield");
ok("  and the property",    v.listingId === "P1" && v.propertyName === "Marina Gate 1104");
ok("  and the agent",       v.agentId === "ag1");
ok("  starts as booked",    v.outcome === "scheduled");
ok("  belongs to an agency", v.orgId === "org1");
ok("the feedback prompt refuses vagueness",
   /"positive" is not an answer they can act on/.test(FEEDBACK_PROMPT), FEEDBACK_PROMPT);
ok("every verdict is blunt enough to act on",
   Object.values(VERDICTS).every(x => x.label.length > 10),
   Object.values(VERDICTS).map(x => x.label));

console.log(`\n${"═".repeat(62)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(62));
process.exit(fail ? 1 : 0);
