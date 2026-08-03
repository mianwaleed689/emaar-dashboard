/**
 * WHO SEES WHAT — every department in a Dubai brokerage, including the two
 * that are easiest to forget.
 *
 * Sales admin and Accounts were both missing from the first version of the
 * access model. Sales admin would have been entered as an agent — given a
 * commission split they do not have and asked for a broker card they do not
 * need. Accounts was denied the client's identity, which makes raising a
 * compliant VAT invoice impossible: a rule that reads cautious and is simply
 * wrong about the job.
 *
 *     node scripts/test/org.test.mjs
 */
import {
  DEPARTMENTS, SENIORITY, scopeFor, visibleAreas, intentFor, visibleRecords,
  canSeeClientContact, canSeePay, canSeePersonalDocuments, canSeeBrokerCard,
} from "../../src/crm/model/org.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  got ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const P = (dept, seniority = "staff", id = dept) => ({ id, department: dept, seniority });

const agent      = P("sales");
const salesMgr   = P("sales", "manager", "smgr");
const salesAdmin = P("salesAdmin");
const accounts   = P("finance");
const hr         = P("hr");
const pro        = P("admin");
const coord      = P("conveyancing");
const marketer   = P("listings");
const owner      = P("management", "owner", "own");
const director   = P("management", "director", "dir");
const itGuy      = P("it");

/* ── SALES ADMIN ──────────────────────────────────────────────────────────── */
head("SALES ADMIN — the sales floor's engine room");

ok("sees every lead from day one, not a personal book",
   scopeFor(salesAdmin, "leads") === "org", scopeFor(salesAdmin, "leads"));
ok("  and every deal",      scopeFor(salesAdmin, "deals") === "org");
ok("  and every listing",   scopeFor(salesAdmin, "listings") === "org");
ok("  and the compliance register — permits are their job",
   scopeFor(salesAdmin, "compliance") === "org");
ok("but NO money — they earn no commission and see nobody else's",
   scopeFor(salesAdmin, "money") === "none", scopeFor(salesAdmin, "money"));
ok("  nor anybody's pay",   canSeePay(salesAdmin, "sales") === false);
ok("they DO reach clients — booking a viewing means telephoning somebody",
   canSeeClientContact(salesAdmin) === true);
ok("they can check a colleague's broker card is current",
   canSeeBrokerCard(salesAdmin) === true);
ok("but not a colleague's passport",
   canSeePersonalDocuments(salesAdmin, "sales") === false);
ok("sales admin is a department in its own right, described",
   DEPARTMENTS.salesAdmin.what.includes("earns no commission"), DEPARTMENTS.salesAdmin.what);

/* ── ACCOUNTS ─────────────────────────────────────────────────────────────── */
head("ACCOUNTS — invoices, receivables, payouts, payroll");

ok("sees every deal, because every deal is an invoice",
   scopeFor(accounts, "deals") === "org");
ok("sees the money org-wide",   scopeFor(accounts, "money") === "org");
ok("MAY see the client — a VAT invoice is addressed to somebody",
   canSeeClientContact(accounts) === true);
ok("sees the roster, because payroll covers everybody",
   scopeFor(accounts, "people") === "org", scopeFor(accounts, "people"));
ok("  and salaries",            canSeePay(accounts, "sales") === true);
ok("but NOT passports, visas or medical cover — that stays with HR",
   canSeePersonalDocuments(accounts, "sales") === false);
ok("no leads — they are not a sales function",
   scopeFor(accounts, "leads") === "none");
ok("labelled 'Accounts', which is what a Dubai brokerage calls it",
   DEPARTMENTS.finance.label === "Accounts");

/* ── EVERYONE ELSE, UNCHANGED ─────────────────────────────────────────────── */
head("THE REST — and the gates that keep them apart");

ok("an agent sees only their own leads",      scopeFor(agent, "leads") === "own");
ok("a sales manager sees their team's",       scopeFor(salesMgr, "leads") === "team");
ok("a director sees the company's",           scopeFor(director, "leads") === "org");
ok("the owner sees everything",               visibleAreas(owner).length === 6, visibleAreas(owner));
ok("conveyancing sees every deal from staff level",
   scopeFor(coord, "deals") === "org");
ok("marketing sees deal figures but NOT the client's number",
   scopeFor(marketer, "deals") === "org" && canSeeClientContact(marketer) === false);
ok("HR sees everyone",                        scopeFor(hr, "people") === "org");
ok("  and their documents",                   canSeePersonalDocuments(hr, "sales") === true);
ok("  but not the money",                     scopeFor(hr, "money") === "none");
ok("the PRO sees documents — renewals are their job",
   canSeePersonalDocuments(pro, "sales") === true);
ok("IT sees nothing commercial or personal",
   visibleAreas(itGuy).length === 0 && canSeePersonalDocuments(itGuy, "sales") === false);
ok("a sales manager may see absence but NOT pay",
   scopeFor(salesMgr, "people") === "team" && canSeePay(salesMgr, "sales") === false);
ok("everybody always sees their own pay and documents",
   canSeePay(agent, "sales") === true && canSeePersonalDocuments(agent, "sales") === true);

/* ── VIEW INTENT ──────────────────────────────────────────────────────────── */
head("THE SAME TAB, A DIFFERENT JOB");

ok("Leads asks an agent who to call next",
   /Who do I call next/.test(intentFor(agent, "leads").question));
ok("Leads asks a manager who is idle",
   /idle/.test(intentFor(salesMgr, "leads").question), intentFor(salesMgr, "leads"));
ok("Leads asks the owner which sources are worth the money",
   /worth the money/.test(intentFor(owner, "leads").question));
ok("Leads is never offered to Accounts",  intentFor(accounts, "leads") === null);
ok("Money is never offered to sales admin", intentFor(salesAdmin, "money") === null);
ok("People tells HR it is the whole company",
   /not only sales/.test(intentFor(hr, "people").question));

/* ── LEGACY ACCOUNTS KEEP WORKING ─────────────────────────────────────────── */
head("EXISTING ACCOUNTS — nobody has a department yet");

ok("a legacy owner still sees everything",  scopeFor({ id: "L1", orgRole: "owner" }, "deals") === "org");
ok("a legacy agent still sees their own",   scopeFor({ id: "L2", orgRole: "agent" }, "deals") === "own");
ok("a legacy manager sees their team",      scopeFor({ id: "L3", orgRole: "manager" }, "leads") === "team");

/* ── FILTERING ────────────────────────────────────────────────────────────── */
head("FILTERING REAL RECORDS");

const recs = [{ id: "d1", agentId: "sales" }, { id: "d2", agentId: "zzz" }, { id: "d3", agentId: "sales" }];
ok("an agent's list is filtered to their own",
   visibleRecords(agent, "deals", recs).map(r => r.id).join() === "d1,d3");
ok("sales admin sees all of them",  visibleRecords(salesAdmin, "deals", recs).length === 3);
ok("accounts sees all of them",     visibleRecords(accounts, "deals", recs).length === 3);
ok("HR sees none of them",          visibleRecords(hr, "deals", recs).length === 0);
ok("every department describes itself",
   Object.values(DEPARTMENTS).every(d => d.what && d.what.length > 25));

console.log(`\n${"═".repeat(62)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(62));
process.exit(fail ? 1 : 0);
