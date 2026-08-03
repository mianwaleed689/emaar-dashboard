/**
 * LEAD INTAKE — parsing, dedupe, routing, and the response clock.
 *
 * The parser reads money and contact details off a stranger's email and files
 * them as fact. The routing decides which agent earns the commission. Both are
 * worth checking properly, and the most important assertions here are the
 * REFUSALS — the cases where the right answer is "I could not read that".
 *
 *     node scripts/test/intake.test.mjs
 */
import {
  normalisePhone, parseBudget, labelledFields, normaliseLead, findDuplicate,
  routeLead, responseTime, responseReport, INTAKE_SOURCES,
} from "../../src/crm/model/intake.js";

let pass = 0, fail = 0;
const ok = (name, cond, got) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${got !== undefined ? `  →  got ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 60 - t.length))}`);

const NOW  = Date.now();
const ago  = n => new Date(NOW - n * 86400000).toISOString();
const mins = n => new Date(NOW - n * 60000).toISOString();

/* ── PHONE ────────────────────────────────────────────────────────────────── */
head("PHONE — one buyer, four ways of writing the same number");

["0501234567", "501234567", "+971 50 123 4567", "00971501234567"].forEach(v =>
  ok(`"${v}" → +971501234567`, normalisePhone(v) === "+971501234567", normalisePhone(v)));
ok("a non-UAE number is kept, not mangled",
   normalisePhone("+44 7700 900123") === "+447700900123", normalisePhone("+44 7700 900123"));
ok("empty stays empty", normalisePhone("") === null);

/* ── BUDGET ───────────────────────────────────────────────────────────────── */
head("BUDGET — and the refusals that matter more than the successes");

ok("AED 2,500,000 → 2500000", parseBudget("AED 2,500,000") === 2500000, parseBudget("AED 2,500,000"));
ok("2.5M → 2500000",          parseBudget("2.5M") === 2500000, parseBudget("2.5M"));
ok("800K → 800000",           parseBudget("800K") === 800000, parseBudget("800K"));
ok("a bare '3' is REFUSED, not recorded as AED 3", parseBudget("3") === null, parseBudget("3"));
ok("  because it is far likelier a bedroom count", parseBudget("2") === null, parseBudget("2"));
ok("nonsense is refused",     parseBudget("call me") === null, parseBudget("call me"));
ok("nothing is refused",      parseBudget(null) === null);

/* ── PARSING ──────────────────────────────────────────────────────────────── */
head("PARSING — read what you can, flag what you cannot");

ok("labelled fields are pulled generically",
   labelledFields("Name: Sarah\nMobile: 0501234567").name === "Sarah");

const pf = normaliseLead("propertyfinder", {
  subject: "New enquiry for Marina Gate 2",
  body: [
    "Name: Sarah Whitfield",
    "Mobile: 0509876543",
    "Email: sarah.w@example.com",
    "Budget: AED 3,200,000",
    "Location: Dubai Marina",
    "Property Reference: MG2-1104",
    "Message: Looking for a 2 bed with a marina view, can view this weekend.",
  ].join("\n"),
}, { now: ago(0) });

ok("a portal email yields the name",    pf.lead.name === "Sarah Whitfield", pf.lead.name);
ok("  a normalised phone",              pf.lead.phone === "+971509876543", pf.lead.phone);
ok("  the email",                       pf.lead.email === "sarah.w@example.com", pf.lead.email);
ok("  the budget as a number",          pf.lead.budget === 3200000, pf.lead.budget);
ok("  the community",                   pf.lead.community === "Dubai Marina", pf.lead.community);
ok("  the message kept as a note",      /marina view/.test(pf.lead.notes_log[0]?.text || ""));
ok("  and the raw email retained",      pf.lead.intakeRaw.length > 50);
/* The honest part: this parser has never seen a real Property Finder email. */
ok("it is flagged for review regardless", pf.needsReview === true);
ok("  saying the parser is unverified",
   /not yet been checked against a real message/.test(pf.why), pf.why);
ok("Property Finder is marked unverified in the source table",
   INTAKE_SOURCES.propertyfinder.verified === false);

const meta = normaliseLead("meta", {
  field_data: [
    { name: "full_name",    values: ["Omar Haddad"] },
    { name: "phone_number", values: ["+971 55 220 1188"] },
    { name: "email",        values: ["omar@example.ae"] },
    { name: "budget",       values: ["1.8M"] },
  ],
  campaign_name: "JVC Winter", ad_name: "2BR carousel",
}, { now: ago(0) });
ok("a Meta lead form parses structurally",
   meta.lead.name === "Omar Haddad" && meta.lead.budget === 1800000,
   { name: meta.lead.name, budget: meta.lead.budget });
ok("  keeping campaign and ad",  meta.lead.campaign === "JVC Winter" && meta.lead.adName === "2BR carousel");
ok("  and NOT flagged — Meta is a documented contract", meta.needsReview === false, meta.why);

const unreachable = normaliseLead("website", { name: "Anon" }, { now: ago(0) });
ok("no phone and no email is flagged",  unreachable.needsReview === true);
ok("  saying nobody can contact them",  /nobody can contact them/.test(unreachable.why), unreachable.why);

const badBudget = normaliseLead("website",
  { name: "Ali", phone: "0501112222", budget: "around two million-ish" }, { now: ago(0) });
ok("an unreadable budget is reported, not invented",
   badBudget.lead.budget === "" && /could not be read as an amount/.test(badBudget.why), badBudget.why);

/* ── DEDUPE ───────────────────────────────────────────────────────────────── */
head("DEDUPE — one buyer, two portals, one hour");

const existing = [
  { id: "L1", phone: "+971509876543", email: "sarah.w@example.com", createdAt: ago(0) },
  { id: "L2", phone: "+971551112222", createdAt: ago(0) },
];
ok("the same phone written differently is caught",
   findDuplicate({ phone: "0509876543" }, existing)?.id === "L1");
ok("the same email, different case, is caught",
   findDuplicate({ email: "Sarah.W@example.com" }, existing)?.id === "L1");
ok("a different person is not",
   findDuplicate({ phone: "0526667777" }, existing) === null);
ok("the same number two years ago is not a duplicate",
   findDuplicate({ phone: "+971509876543" },
                 [{ id: "old", phone: "+971509876543", createdAt: ago(800) }]) === null);
ok("names are never matched on — 'Mohammed' is not an identifier",
   findDuplicate({ name: "Sarah Whitfield" }, existing) === null);

/* ── ROUTING ──────────────────────────────────────────────────────────────── */
head("ROUTING — and it says why, because 'the system decided' breeds distrust");

const AGENTS = [
  { id: "a1", name: "Layla",  communities: ["Dubai Marina", "JBR"], activeLeads: 12 },
  { id: "a2", name: "Rashid", communities: ["JVC"],                 activeLeads: 3  },
  { id: "a3", name: "Tom",    communities: ["Dubai Marina"],        activeLeads: 4  },
];
const LISTINGS = [{ id: "l1", agentId: "a1", title: "Marina Gate 2 unit 1104",
                    reference: "MG2-1104", community: "Dubai Marina" }];

const r1 = routeLead({ property: "MG2-1104", community: "Dubai Marina" }, AGENTS, LISTINGS);
ok("a lead naming a listing goes to the agent marketing it", r1.agentId === "a1", r1);
ok("  and says why",  /already know the unit/.test(r1.why), r1.why);

const r2 = routeLead({ community: "Dubai Marina" }, AGENTS, LISTINGS);
ok("otherwise whoever covers the area, least busy first", r2.agentId === "a3", r2);
ok("  naming the community", /covers Dubai Marina/.test(r2.why), r2.why);

const r3 = routeLead({ community: "Al Barsha" }, AGENTS, LISTINGS);
ok("an uncovered area falls to the least busy agent", r3.agentId === "a2", r3);

const r4 = routeLead({ community: "Dubai Marina" },
                     AGENTS.map(a => ({ ...a, canBroker: false })), LISTINGS);
ok("nobody with a lapsed broker card is given a lead", r4.agentId === null, r4);
ok("  and it says the cards have lapsed", /broker card has lapsed/.test(r4.why), r4.why);
ok("no agents at all leaves it unassigned", routeLead({}, [], []).agentId === null);

/* ── THE RESPONSE CLOCK ───────────────────────────────────────────────────── */
head("RESPONSE CLOCK — the number nobody in Dubai measures well");

const fast = { createdAt: mins(60), notes_log: [{ type: "Call", at: mins(56) }] };
const rt = responseTime(fast, NOW);
ok("answered in 4 minutes reports 4", rt.minutes === 4, rt.minutes);
ok("  in the under-5 band",           rt.band === "under5", rt.band);

const slow = { createdAt: mins(3000), notes_log: [{ type: "WhatsApp", at: mins(500) }] };
ok("answered after 41 hours is 'over a day'",
   responseTime(slow, NOW).band === "slow", responseTime(slow, NOW).band);

const unworked = { createdAt: mins(180), notes_log: [] };
const uw = responseTime(unworked, NOW);
ok("an unworked lead is NOT reported as a fast response", uw.answered === false);
ok("  it reports how long it has waited",  uw.waitingMinutes === 180, uw.waitingMinutes);
ok("  in words",  /Still waiting — 3 hours/.test(uw.note), uw.note);

const noteOnly = { createdAt: mins(120), notes_log: [{ type: "Note", at: mins(119) }] };
ok("writing a note is not contacting anybody",
   responseTime(noteOnly, NOW).answered === false);

const rep = responseReport([fast, slow, unworked, noteOnly], NOW);
ok("the report counts what is still waiting", rep.stillWaiting === 2, rep.stillWaiting);
/* Median of 4 and 2500 minutes. A mean would be 1252 too here, but with three
   answered leads the median ignores the outlier and the mean would not. */
ok("it uses the median, not the average", rep.medianMinutes === 1252, rep.medianMinutes);
const skew = responseReport([
  { createdAt: mins(100), notes_log: [{ type: "Call", at: mins(96) }] },
  { createdAt: mins(100), notes_log: [{ type: "Call", at: mins(95) }] },
  { createdAt: mins(40000), notes_log: [{ type: "Call", at: mins(1) }] },
], NOW);
ok("  one very late lead does not drag the typical figure",
   skew.medianMinutes === 5, skew.medianMinutes);
ok("  and the headline is in plain words",
   /Half of your leads are answered within 5 minutes/.test(skew.headline), skew.headline);
ok("names the worst one still waiting", rep.worstWaiting.r.waitingMinutes === 180);

console.log(`\n${"═".repeat(64)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(64));
process.exit(fail ? 1 : 0);
