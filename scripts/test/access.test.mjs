/**
 * ACCESS — who can get in, and what they can reach.
 *
 * The thing this must never become is a side door: an access console that
 * quietly turns into a way to read the company's data is worse than none.
 * So the first section checks what it REFUSES to return.
 *
 *     node scripts/test/access.test.mjs
 */
import { canAdministerAccounts, effectiveAccess, accountHealth, accessSummary }
  from "../../src/crm/model/access.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const P = (o) => ({ uid: o.uid || "u1", name: "A Person", email: "a@b.com",
                    status: "active", lastLoginAt: "2026-08-01", ...o });

/* ── WHAT IT WILL NOT HAND OVER ───────────────────────────────────────────── */
head("IT ADMINISTERS ACCOUNTS, NOT THE BUSINESS");

const rich = P({ department: "sales", seniority: "staff", basic: 9000,
                 allowances: { housing: 3000 }, passport: "X1234567",
                 clientPhone: "+971500000000" });
const view = effectiveAccess(rich);
ok("pay never comes back", !("basic" in view) && !JSON.stringify(view).includes("9000"), view);
ok("allowances never come back", !JSON.stringify(view).includes("3000"));
ok("personal documents never come back", !JSON.stringify(view).includes("X1234567"));
ok("client details never come back", !JSON.stringify(view).includes("+971500000000"));

/* ── WHO MAY ADMINISTER ───────────────────────────────────────────────────── */
head("WHO MAY ADMINISTER ACCOUNTS");

ok("IT may",        canAdministerAccounts({ department: "it", seniority: "staff" }));
ok("an owner may",  canAdministerAccounts({ department: "management", seniority: "owner" }));
ok("a director may",canAdministerAccounts({ department: "sales", seniority: "director" }));
ok("a sales manager may NOT — they run a team, they do not assign roles",
   canAdministerAccounts({ department: "sales", seniority: "manager" }) === false);
ok("HR may not, even though they see people",
   canAdministerAccounts({ department: "hr", seniority: "manager" }) === false);
ok("an agent may not", canAdministerAccounts({ department: "sales", seniority: "staff" }) === false);
ok("a platform admin may", canAdministerAccounts({ platformAdmin: true }));

/* ── THE MATRIX MATCHES THE PRODUCT ───────────────────────────────────────── */
head("WHAT EACH PERSON CAN ACTUALLY REACH");

const agent = effectiveAccess(P({ department: "sales", seniority: "staff" }));
ok("an agent sees their own leads", agent.areas.leads === "own", agent.areas);
ok("  and no people at all",        agent.areas.people === "none");
ok("  summarised in one line",      /their own/.test(agent.reach), agent.reach);

const mgr = effectiveAccess(P({ department: "sales", seniority: "manager" }));
ok("a sales manager sees their team's leads", mgr.areas.leads === "team", mgr.areas);

const fin = effectiveAccess(P({ department: "finance", seniority: "manager" }));
ok("finance sees the agency's money", fin.areas.money === "org", fin.areas);
ok("  and no leads",                  fin.areas.leads === "none");

const it = effectiveAccess(P({ department: "it", seniority: "staff" }));
ok("IT reaches no business data at all",
   Object.values(it.areas).every(v => v === "none"), it.areas);
ok("  and is told so plainly rather than shown an empty screen",
   /can sign in and see no agency data/.test(it.reach), it.reach);

/* ── WHAT IS BROKEN ───────────────────────────────────────────────────────── */
head("THE PROBLEMS WORTH A SUPPORT CALL");

const people = [
  P({ uid: "gone", name: "Left In May", status: "suspended", department: "sales", seniority: "staff", managerId: "m1" }),
  P({ uid: "m1",   name: "A Manager",  department: "sales", seniority: "manager" }),
  P({ uid: "nodep", name: "No Dept" }),
  P({ uid: "noman", name: "No Manager", department: "sales", seniority: "staff" }),
  P({ uid: "ghost", name: "Orphan", department: "sales", seniority: "staff", managerId: "nobody" }),
  P({ uid: "never", name: "Never In", department: "sales", seniority: "staff",
      managerId: "m1", lastLoginAt: null }),
];
const work = {
  leads: [{ assignedTo: "gone" }, { assignedTo: "gone" }],
  deals: [{ agentId: "gone" }],
  listings: [],
};
const probs = accountHealth(people, work);

const stranded = probs.find(p => p.uid === "gone");
ok("work stranded on a disabled account is found",  !!stranded, probs.map(p => p.what));
ok("  and it is the highest severity",              stranded.severity === "high");
ok("  and it is listed first",                      probs[0].uid === "gone");
ok("  and it says exactly what is stranded",
   /2 leads, 1 deal/.test(stranded.detail), stranded.detail);
ok("  and what to do about it",
   /Reassign the work/.test(stranded.fix), stranded.fix);

ok("an account with no department is flagged",
   probs.some(p => p.uid === "nodep" && /No department/.test(p.what)));
ok("  and told that access is being guessed",
   /guessed from their job title/.test(probs.find(p => p.uid === "nodep").detail));
ok("an agent with no manager is flagged",
   probs.some(p => p.uid === "noman" && /No manager/.test(p.what)));
ok("  because their leads appear on nobody's board",
   /no manager's board/.test(probs.find(p => p.uid === "noman").detail));
ok("a manager who is not in the agency is flagged",
   probs.some(p => p.uid === "ghost" && /not here/.test(p.what)));
ok("an account that has never signed in is flagged, at low severity",
   probs.some(p => p.uid === "never" && p.severity === "low"));
ok("a suspended account is NOT nagged about never signing in",
   !probs.some(p => p.uid === "gone" && /never signed in/i.test(p.what)));

const dupes = accountHealth([P({ uid: "a", email: "same@x.com", department: "sales", seniority: "staff", managerId: "m" }),
                             P({ uid: "b", email: "Same@X.com", department: "sales", seniority: "staff", managerId: "m" })]);
ok("two accounts on one address are flagged, case-insensitively",
   dupes.some(p => /Duplicate email/.test(p.what)), dupes.map(p => p.what));

/* ── SUMMARY ──────────────────────────────────────────────────────────────── */
head("THE COUNTS");

const sum = accessSummary(people, probs);
ok("six accounts",            sum.accounts === 6, sum.accounts);
ok("one suspended",           sum.suspended === 1, sum.suspended);
ok("one with no department",  sum.noDepartment === 1, sum.noDepartment);
ok("one has never signed in", sum.neverSignedIn === 1, sum.neverSignedIn);
ok("one high-severity problem", sum.highSeverity === 1, sum.highSeverity);

ok("an empty agency reports nothing rather than failing",
   accessSummary([], []).accounts === 0 && accountHealth([]).length === 0);

console.log(`\n${fail ? "✗" : "✓"} access — ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
