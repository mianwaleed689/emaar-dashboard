/**
 * PUT REAL WORK ON THE DEMO AGENCY'S DESKS.
 *
 * seed-demo-agency.mjs built the company; this gives its 120 agents something
 * to be doing. An empty CRM demonstrates nothing — every screen in it is an
 * empty state, and empty states are the one thing already tested. What has
 * never been seen is a manager's board with forty agents' leads on it, a
 * compliance register with real lapses, or a pipeline where money is sitting
 * in three different states at once.
 *
 * WHAT IT MAKES, AND WHY EACH SHAPE
 * ─────────────────────────────────
 *   leads     spread across every agent, with a deliberate spread of ages so
 *             the "why this one now" ordering has something to sort: some came
 *             in today, some have not been touched for three weeks.
 *   deals     across all three journeys and every stage, with paperwork
 *             deliberately missing on a third of them so the stage gates show
 *             what they are for.
 *   listings  some fully compliant, some missing a Form A, some with a
 *             Trakheesi permit that has already expired — because "may this be
 *             advertised" is the question that tab exists to answer.
 *   viewings  including some in the past that were never written up, which is
 *             the state an agent's diary is supposed to nag about.
 *
 * Everything carries demoSeed: true and the demo orgId.
 *
 *   node scripts/seed-demo-work.mjs
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").map(l => l.trim())
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
};

const ORG_ID = "org_demo_prime_estates_v2";
const OWNER  = `owner.${ORG_ID.replace(/[^a-z0-9]+/g, "")}@primeestates.example`;
const PASS   = "Demo2026!";

/* Deterministic pseudo-randomness: the same seed produces the same agency
   every time, so a screenshot taken today can be reproduced tomorrow. */
let s = 12345;
const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = a => a[Math.floor(rnd() * a.length)];
const int  = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const ago  = d => new Date(Date.now() - d * 86400000).toISOString();
const ahead= d => new Date(Date.now() + d * 86400000).toISOString();

const AREAS = ["Dubai Marina","Downtown Dubai","Palm Jumeirah","Business Bay","JVC",
  "Dubai Hills Estate","Arabian Ranches","Emaar Beachfront","Creek Harbour","JLT"];
const SOURCES = ["Property Finder","Bayut","dubizzle","Website","Walk-in","Referral","Instagram","Cold call"];
const STAGES  = ["New Lead","Contacted","Qualified","Viewing Scheduled","Offer Made","Negotiating","Won","Lost"];
const FIRST = ["Ahmed","Sarah","Omar","Elena","Rajesh","Priya","James","Chen","Mohammed","Aisha",
  "Daniel","Fatima","Igor","Maria","Hassan","Linda","Yusuf","Nadia","Peter","Zainab"];
const LAST = ["Khan","Ali","Smith","Petrova","Kumar","Hassan","Brown","Wei","Al Marri","Haddad",
  "Jones","Farouk","Volkov","Santos","Rahman","Clarke","Aziz","Sokolova","Reddy","Nasser"];
const BUILDINGS = ["Marina Gate 2","Burj Vista","Creek Rise","Sunset Mall Residences","Park Heights",
  "Beach Vista","Address Residences","Golf Grand","Hills Park","Palm Views"];

const app  = initializeApp(firebaseConfig, "work-seed");
const db   = getFirestore(app);
const auth = getAuth(app);

console.log("signing in as the demo owner…");
const cred = await signInWithEmailAndPassword(auth, OWNER, PASS);
console.log("  ok\n");

/* Who is on the sales floor. */
const people = [];
const snap = await getDocs(query(collection(db, "users"), where("orgId", "==", ORG_ID)));
snap.forEach(d => people.push({ uid: d.id, ...d.data() }));
const agents = people.filter(p => p.department === "sales" && p.seniority === "staff");
console.log(`${agents.length} agents on the floor, ${people.length} people in the agency`);
if (!agents.length) { console.error("no agents — run seed-demo-agency.mjs first"); process.exit(1); }

/* Re-runnable. A batch failing part way through used to mean a second run
   duplicated everything that had already landed, because each row gets a fresh
   document id. Counting first makes a re-run continue rather than double. */
const already = async (name) => {
  const q = await getDocs(query(collection(db, name), where("orgId", "==", ORG_ID)));
  return q.size;
};

const commit = async (rows, label) => {
  const have = await already(label);
  if (have >= rows.length) { console.log(`  ${label}: ${have} already there, skipping`); return; }
  if (have > 0) { rows = rows.slice(have); console.log(`  ${label}: ${have} already there, adding ${rows.length}`); }
  let n = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = writeBatch(db);
    rows.slice(i, i + 200).forEach(r => batch.set(doc(collection(db, r._c)), r.data));
    await batch.commit();
    n += Math.min(200, rows.length - i);
    console.log(`  ${label}: ${n}/${rows.length}`);
  }
};

/* ── LEADS ───────────────────────────────────────────────────────────────── */
const leads = [];
agents.forEach((a, ai) => {
  for (let k = 0; k < int(2, 6); k++) {
    const age = int(0, 26);
    const stage = age > 18 ? pick(["Contacted","Qualified","Lost"]) : pick(STAGES);
    leads.push({ _c: "leads", data: {
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `+9715${int(0,9)}${int(1000000,9999999)}`,
      email: rnd() > 0.35 ? `client${ai}${k}@example.com` : "",
      budget: pick([850000,1200000,1800000,2400000,3200000,4500000,6500000,12000000]),
      community: pick(AREAS), source: pick(SOURCES),
      serviceType: pick(["Buyer","Seller","Tenant","Landlord"]),
      status: stage,
      assignedTo: a.uid, assignedToName: a.name,
      agentId: a.uid, orgId: ORG_ID,
      /* A spread of ages so the desk has something to order by: the ones that
         came in today, and the ones nobody has touched for three weeks. */
      createdAt: ago(age),
      lastContactedAt: stage === "New Lead" ? null : ago(Math.max(0, age - int(0, 4))),
      demoSeed: true,
    }});
  }
});
console.log(`\nleads: ${leads.length}`);
await commit(leads, "leads");

/* ── LISTINGS ────────────────────────────────────────────────────────────── */
const listings = [];
agents.slice(0, 60).forEach((a, i) => {
  /* Three shapes on purpose: compliant, missing the owner's Form A, and a
     permit that has already lapsed. "May this be advertised" is the whole
     question that tab answers, and it cannot answer it about nothing. */
  const shape = i % 3;
  listings.push({ _c: "listings", data: {
    title: `${int(1,4)} bed · ${pick(BUILDINGS)}`,
    community: pick(AREAS), building: pick(BUILDINGS),
    unit: `${int(1,40)}0${int(1,9)}`,
    price: pick([950000,1450000,2100000,2900000,3800000,5200000,8500000]),
    beds: int(1,4), baths: int(1,4), size: int(650, 3200),
    status: pick(["Available","Available","Available","Reserved","Sold"]),
    agentId: a.uid, agentName: a.name, orgId: ORG_ID,
    formA: shape === 1 ? null : { signedAt: ago(int(20, 200)), by: a.name },
    trakheesiPermit: shape === 2 ? `TRK-${int(100000,999999)}` : `TRK-${int(100000,999999)}`,
    permitExpiry: shape === 2 ? ago(int(1, 40)) : ahead(int(30, 300)),
    createdAt: ago(int(2, 180)), demoSeed: true,
  }});
});
console.log(`\nlistings: ${listings.length}`);
await commit(listings, "listings");

/* ── DEALS ───────────────────────────────────────────────────────────────── */
const JOURNEY = ["secondary", "offplan", "rental"];
const SEC_STAGES = ["formA","permit","published","buyer","viewings","offer","formF","noc","trustee","transferred","commission"];
const deals = [];
agents.slice(0, 70).forEach((a, i) => {
  const journey = JOURNEY[i % 3];
  const si = int(0, SEC_STAGES.length - 1);
  const price = pick([1200000,1850000,2600000,3400000,4800000,7200000]);
  /* A third have paperwork missing, so the gates have something to hold. */
  const documents = {};
  if (i % 3 !== 0) {
    documents.formA = { receivedAt: ago(int(5, 90)), by: a.name };
    if (si > 1) documents.trakheesi = { receivedAt: ago(int(3, 60)), by: a.name };
    if (si > 6) documents.formF = { receivedAt: ago(int(1, 30)), by: a.name };
    if (si > 7) documents.noc = { receivedAt: ago(int(1, 20)), by: a.name };
  }
  /* Money in every state at once, which is what a finance screen is for. */
  const state = si >= 10 ? pick(["received","paid"]) : si >= 8 ? pick(["due","invoiced"]) : "due";
  deals.push({ _c: "deals", data: {
    client: `${pick(FIRST)} ${pick(LAST)}`,
    property: `${pick(BUILDINGS)}, unit ${int(1,40)}0${int(1,9)}`,
    community: pick(AREAS),
    journey, stage: SEC_STAGES[si], price,
    agentId: a.uid, agentName: a.name, orgId: ORG_ID,
    documents,
    commissionLines: [{
      side: "seller", base: price, ratePct: journey === "rental" ? 5 : 2,
      vatRatePct: 5, agentSplitPct: 50, collabPct: 0, state,
      agentId: a.uid,
    }],
    createdAt: ago(int(5, 240)), demoSeed: true,
  }});
});
console.log(`\ndeals: ${deals.length}`);
await commit(deals, "deals");

/* ── VIEWINGS ────────────────────────────────────────────────────────────── */
const viewings = [];
agents.slice(0, 80).forEach((a, i) => {
  for (let k = 0; k < int(1, 3); k++) {
    /* Some of these are in the past and were never written up. That is the
       state an agent's diary is supposed to keep nagging about, and it cannot
       be seen on an empty diary. */
    const past = rnd() > 0.55;
    const at = past ? ago(int(1, 12)) : ahead(int(0, 10));
    const done = past && rnd() > 0.5;
    viewings.push({ _c: "viewings", data: {
      leadName: `${pick(FIRST)} ${pick(LAST)}`,
      property: `${pick(BUILDINGS)}, unit ${int(1,40)}0${int(1,9)}`,
      community: pick(AREAS),
      at, agentId: a.uid, agentName: a.name, orgId: ORG_ID,
      outcome: done ? pick(["Went ahead","No show","Cancelled"]) : null,
      verdict: done ? pick(["Too expensive","Liked it","Wrong layout","Wants to offer"]) : null,
      createdAt: ago(int(1, 20)), demoSeed: true,
    }});
  }
});
console.log(`\nviewings: ${viewings.length}`);
await commit(viewings, "viewings");

console.log("\n─────────────────────────────────────────────");
console.log(`${leads.length} leads · ${listings.length} listings · ${deals.length} deals · ${viewings.length} viewings`);
console.log("spread across the agency, with gaps and lapses on purpose.");
await deleteApp(app).catch(() => {});
process.exit(0);
