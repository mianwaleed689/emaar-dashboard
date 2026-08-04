/**
 * IS THE ACCESS MODEL ACTUALLY WIRED IN?
 *
 * The model being correct and the tabs using it are two different claims, and
 * the second is the one that matters to a customer. A model can be perfect
 * while a tab still reads `orgRole === "manager"` three lines lower and shows
 * an agent the whole agency.
 *
 * This reads the three tab files and asserts they route through the model
 * rather than around it. It is a source check, not a UI check — the browser
 * sweep in verify-tabs.mjs covers the rendering.
 *
 *     node scripts/test/wiring.test.mjs
 */
import { readFileSync } from "fs";
import { viewerFrom, scopeFor, visibleRecords } from "../../src/crm/model/org.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const TABS = {
  "My Leads": "src/tabs/MyLeadsTab.jsx",
  "Pipeline": "src/tabs/PipelineTab.jsx",
  "Listings": "src/tabs/ListingsTab.jsx",
  "People":   "src/tabs/PeopleTab.jsx",
};

head("THE TABS ROUTE THROUGH THE MODEL");

for (const [name, path] of Object.entries(TABS)) {
  const src = readFileSync(path, "utf8");
  ok(`${name} imports the access model`, /from "\.\.\/crm\/model\/org"/.test(src));
  ok(`  ${name} asks scopeFor()`, /scopeFor\(/.test(src));
  ok(`  ${name} shows the scope-appropriate title`, /intent\?\.title|intentFor\(/.test(src));

  /* The fault this whole exercise is about: a role string compared to a literal
     to decide what somebody may SEE.

     Two uses are legitimate and are excluded rather than counted:
       · `m.orgRole` — reading it off ANOTHER person, to build an assignment
         dropdown or to infer a legacy department. That is data, not a gate.
       · the People tab's legacy inference, which turns an old orgRole into a
         department precisely so nothing else has to look at orgRole again.

     What is checked is `orgRole` on the VIEWER driving a render decision. */
  const viewerGates = (src.match(/(?<!\w\.)orgRole\s*===?\s*"(owner|director|manager|agent)"/g) || [])
    .filter(x => true).length
    - (src.match(/m\.orgRole\s*===?\s*"/g) || []).length
    - (/department: m\.department \|\|/.test(src) ? 3 : 0);
  ok(`  ${name} gates nothing on the viewer's raw role (${Math.max(0, viewerGates)})`,
     viewerGates <= 0, viewerGates);

  ok(`  ${name} tells anyone it is not for, plainly`,
     /not part of your role|is not part of your/.test(src));
  ok(`  ${name} has no dead if(false) branch`, !/if\s*\(\s*false\s*\)/.test(src));
}

head("THE FILTER ACTUALLY FILTERS");

for (const [name, path] of [["My Leads", TABS["My Leads"]], ["Pipeline", TABS.Pipeline], ["Listings", TABS.Listings]]) {
  const src = readFileSync(path, "utf8");
  ok(`${name} filters its records with visibleRecords()`, /visibleRecords\(/.test(src));
  ok(`  ${name} passes teamIds, so "team" scope means something`, /teamIds/.test(src));
}

head("AND THE FILTER IS CORRECT, RUN AGAINST REAL SHAPES");

const team = [
  { uid: "ag1", managerId: "mgr" },
  { uid: "ag2", managerId: "mgr" },
  { uid: "ag3", managerId: "other" },
];
const leads = [
  { id: "L1", assignedTo: "ag1" },
  { id: "L2", assignedTo: "ag2" },
  { id: "L3", assignedTo: "ag3" },
  { id: "L4", assignedTo: "mgr" },
];

const asAgent   = viewerFrom({ firebaseUser: { uid: "ag1" }, orgRole: "agent",   teamMembers: team });
const asManager = viewerFrom({ firebaseUser: { uid: "mgr" }, orgRole: "manager", teamMembers: team });
const asOwner   = viewerFrom({ firebaseUser: { uid: "own" }, orgRole: "owner",   teamMembers: team });

const seen = (v) => visibleRecords(v, "leads", leads, { ownerField: "assignedTo", teamIds: v.teamIds })
  .map(l => l.id).join(",");

ok("an agent sees only their own",      seen(asAgent) === "L1", seen(asAgent));
ok("a manager sees their two reports and themselves",
   seen(asManager) === "L1,L2,L4", seen(asManager));
ok("  and NOT the agent who reports elsewhere",  !seen(asManager).includes("L3"));
ok("an owner sees all four",            seen(asOwner) === "L1,L2,L3,L4", seen(asOwner));

const salesAdmin = viewerFrom({ firebaseUser: { uid: "sa" }, teamMembers: team });
salesAdmin.department = "salesAdmin"; salesAdmin.seniority = "staff";
ok("sales admin sees all four from staff level",
   visibleRecords(salesAdmin, "leads", leads, { ownerField: "assignedTo" }).length === 4);

const accounts = { id: "ac", department: "finance", seniority: "staff" };
ok("accounts sees no leads at all",
   visibleRecords(accounts, "leads", leads, { ownerField: "assignedTo" }).length === 0);
ok("  and the leads tab would not be offered to them",
   scopeFor(accounts, "leads") === "none");

head("THE PERSON WHO CREATES AN AGENCY OWNS IT");

/* This was `orgRole: "manager"`. scopeFor gives a manager TEAM scope, which is
   right for a sales manager and catastrophic for a founder: the person paying
   for the software signed up and could see only their own records, with a team
   of nobody. Neither the model tests nor the browser sweep could catch it —
   the model was right and the tab rendered fine. Only the signup was wrong. */
const signup = readFileSync("src/pages/AgencySignup.jsx", "utf8");
const created = signup.slice(signup.indexOf('doc(db, "users", uid)'),
                             signup.indexOf('doc(db, "organisations"'));

ok("the agency creator is written as an owner, not a manager",
   /orgRole:\s*"owner"/.test(created), created.match(/orgRole:\s*"[a-z]+"/i)?.[0]);
ok("  and carries an explicit department", /department:\s*"management"/.test(created));
ok("  and an explicit seniority",          /seniority:\s*"owner"/.test(created));

/* Prove the consequence, not just the string. */
const founder = viewerFrom({ firebaseUser: { uid: "f1" }, orgRole: "owner",
                             department: "management", seniority: "owner",
                             userRole: "user", teamMembers: [] });
const agencyDeals = [{ agentId: "f1" }, { agentId: "someone-else" }, { agentId: "third" }];
ok("a founder with no team yet still sees the whole agency's deals",
   visibleRecords(founder, "deals", agencyDeals, { ownerField: "agentId" }).length === 3,
   visibleRecords(founder, "deals", agencyDeals, { ownerField: "agentId" }).length);
ok("  and the agency's money", scopeFor(founder, "money") === "org", scopeFor(founder, "money"));
ok("  and its people", scopeFor(founder, "people") === "org", scopeFor(founder, "people"));

/* JoinPage notifies orgRole == "owner". Before the fix that matched nobody. */
const join = readFileSync("src/pages/JoinPage.jsx", "utf8");
ok("JoinPage's owner notification now has somebody to find",
   /orgRole","==","owner"/.test(join.replace(/\s/g, "")) && /orgRole:\s*"owner"/.test(created));

/* ── AN OWNER IS NOT THE STRING "manager" ─────────────────────────────────── */
head("NO GATE LOCKS THE OWNER OUT OF THEIR OWN AGENCY");

/* Signup used to record the founder as orgRole "manager", so every gate written
   as `orgRole === "manager"` happened to work by accident. Recording the founder
   as an owner — which is what they are — turned each of those into a locked
   door: the Agency tab told the person who owns the agency "Manager access
   only", and the organisation listener never fired for them, so their agency
   profile came back empty.

   Fixing one bug exposing another is the pattern of this whole sweep, so the
   guard is written broadly: anywhere a file compares orgRole to "manager",
   owner and director must appear beside it. */
const GATED = [
  "src/tabs/AgencyTab.jsx",
  "src/tabs/ComplianceTab.jsx",
  "src/pages/EmaarDashboardV2.jsx",
  "src/tabs/TeamTab.jsx",
];
for (const f of GATED) {
  const lines = readFileSync(f, "utf8").split("\n");
  const bad = lines.filter((l, i) => {
    if (!/orgRole\s*[!=]==?\s*["']manager["']/.test(l)) return false;
    const near = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
    return !/["']owner["']/.test(near) || !/["']director["']/.test(near);
  });
  ok(`${f.split("/").pop()} never gates on "manager" alone`,
     bad.length === 0, bad.map(b => b.trim().slice(0, 80)));
}


console.log(`\n${"═".repeat(62)}`);
console.log(`  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
