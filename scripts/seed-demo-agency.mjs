/**
 * SEED A REAL AGENCY — one company, every department, 133 people.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Every role in this product has been designed and almost none has been USED.
 * The access model knows about nine departments and five levels of seniority,
 * but until now the only accounts that ever existed were an owner and a handful
 * of agents. A sales admin, an accounts clerk, an HR officer and an IT
 * administrator have never once opened the product, so nobody knows what they
 * see. Neither does a manager with forty agents under them, or a director above
 * three managers.
 *
 * So this builds the company: an owner, a sales director, three sales managers
 * with forty agents each, three sales admins, two in accounts, a marketing
 * manager, an HR officer and an IT administrator. 133 people in one agency,
 * with a real reporting line, so every screen can be opened as the person who
 * is supposed to live in it.
 *
 * WHAT IT WRITES, AND WHAT IT DOES NOT
 * ────────────────────────────────────
 * Firestore user documents for all 133 — that is what the rosters, the scoping
 * and the payroll read. Firebase Auth accounts ONLY for the people we need to
 * sign in as, because 133 auth accounts would be 120 logins nobody uses and a
 * mess to remove afterwards. Every agent is still a real record with a real
 * manager; they simply cannot log in, which no screen depends on.
 *
 * Auth accounts are created on a SECOND Firebase app. Creating one on the
 * primary app signs the new account in, which is precisely the bug that made
 * an agency owner become their own new agent — see TeamTab.jsx.
 *
 * REMOVABLE
 * ─────────
 * Everything carries orgId org_demo_… and `demoSeed: true`, so one query finds
 * all of it. scripts/unseed-demo-agency.mjs removes it.
 *
 *   node scripts/seed-demo-agency.mjs
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import { readFileSync } from "fs";

/* src/firebase.js reads import.meta.env, which only exists under Vite. Plain
   Node has to read the same values out of .env.local, so the script and the app
   cannot end up pointed at different projects. */
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
};
if (!firebaseConfig.apiKey) { console.error("no Firebase config in .env.local"); process.exit(1); }

/* No arguments: the script founds the agency and its owner itself, the same
   way a customer does through /agency/signup. */

/* A first attempt seeded org_demo_prime_estates and got the twelve login
   holders keyed by an invented uid, because their auth accounts already
   existed from an earlier failed run and the catch block made an id up rather
   than recovering the real one. Those records cannot be deleted by an agency
   owner — deletion is superAdmin only, deliberately, so that an HR record
   cannot be erased by the company being audited. Rather than weaken that rule
   to tidy up after myself, this seeds a clean organisation. The first one is
   an orphan and can be removed from the Firebase console. */
const ORG_ID   = "org_demo_prime_estates_v2";
const ORG_NAME = "Prime Estates Dubai";
const PASSWORD = "Demo2026!";          // for the accounts that can sign in
const DOMAIN   = "primeestates.example";

/* Dubai brokerages are not staffed from one country. */
const FIRST = ["Ahmed","Fatima","Omar","Layla","Yusuf","Noor","Khalid","Aisha","Rashid","Mariam",
  "Rajesh","Priya","Arjun","Anjali","Vikram","Deepa","Sanjay","Kavita","Amit","Neha",
  "James","Charlotte","Oliver","Sophie","Daniel","Emily","Thomas","Hannah","Michael","Grace",
  "Maria","Juan","Rowena","Carlo","Jasmine","Miguel","Angelica","Paulo","Cristina","Rico",
  "Dmitry","Anna","Sergei","Olga","Ivan","Natalia","Pavel","Irina","Andrei","Yelena"];
const LAST = ["Al Mansouri","Al Falasi","Al Suwaidi","Hassan","Khan","Sharma","Patel","Nair","Reddy","Iyer",
  "Whitfield","Harrington","Bennett","Clarke","Dawson","Santos","Cruz","Reyes","Mendoza","Villanueva",
  "Petrov","Ivanova","Sokolov","Volkov","Novak","Haddad","Farouk","Ziadeh","Karim","Rahman"];

const AREAS = ["Dubai Marina","Downtown Dubai","Palm Jumeirah","Business Bay","JVC",
  "Dubai Hills Estate","Arabian Ranches","Emaar Beachfront","Creek Harbour","JLT"];

let seq = 0;
const person = (i) => {
  const f = FIRST[i % FIRST.length];
  const l = LAST[(i * 7 + 3) % LAST.length];
  return `${f} ${l}`;
};
const emailFor = (name) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, ".")}.${++seq}@${DOMAIN}`;

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const inDays  = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/* ── THE COMPANY ─────────────────────────────────────────────────────────── */
const staff = [];
const add = (o) => { staff.push(o); return o; };

const director = add({
  name: "Khalid Al Mansouri", department: "sales", seniority: "director", orgRole: "director",
  basic: 35000, allowances: { housing: 15000, transport: 3000 }, joinedAt: daysAgo(1400),
  brn: "BRN-10001", canLogIn: true, title: "Sales Director",
});

const managers = [0, 1, 2].map(i => add({
  name: ["Fatima Hassan", "James Whitfield", "Priya Sharma"][i],
  department: "sales", seniority: "manager", orgRole: "manager",
  basic: 18000, allowances: { housing: 8000, transport: 2000 },
  joinedAt: daysAgo(1000 - i * 90), brn: `BRN-1100${i + 1}`,
  reportsToName: director.name, canLogIn: true, title: `Sales Manager — Team ${i + 1}`,
}));

/* Forty agents to each manager. */
managers.forEach((m, mi) => {
  for (let a = 0; a < 40; a++) {
    const i = mi * 40 + a;
    add({
      name: person(i),
      department: "sales", seniority: "staff", orgRole: "agent",
      basic: 4000 + (i % 5) * 1000,
      allowances: { housing: 2000, transport: 500 },
      joinedAt: daysAgo(30 + (i * 11) % 900),
      brn: `BRN-2${String(1000 + i).slice(-4)}`,
      /* A third of the broker cards expire inside ninety days, because a
         compliance register with nothing in it demonstrates nothing. */
      brnExpiry: i % 3 === 0 ? inDays(10 + (i % 80)) : inDays(200 + (i % 300)),
      reportsToName: m.name,
      area: AREAS[i % AREAS.length],
      /* Two agents can sign in — one under the first manager, one under the
         third — so an agent's own view can be opened from two teams. */
      canLogIn: i === 0 || i === 80,
      title: "Property Consultant",
    });
  }
});

["Aisha Rahman", "Carlo Santos", "Neha Patel"].forEach((n, i) => add({
  name: n, department: "salesAdmin", seniority: i === 0 ? "lead" : "staff",
  orgRole: "agent", basic: 7000 + i * 500, allowances: { housing: 3000, transport: 800 },
  joinedAt: daysAgo(500 - i * 60), reportsToName: director.name,
  canLogIn: i === 0, title: i === 0 ? "Senior Sales Administrator" : "Sales Administrator",
}));

["Anna Petrov", "Rajesh Nair"].forEach((n, i) => add({
  name: n, department: "finance", seniority: i === 0 ? "manager" : "staff",
  orgRole: i === 0 ? "manager" : "agent",
  basic: i === 0 ? 16000 : 9000, allowances: { housing: 6000, transport: 1500 },
  joinedAt: daysAgo(800 - i * 200), canLogIn: true,
  title: i === 0 ? "Finance Manager" : "Accounts Officer",
}));

add({ name: "Sophie Bennett", department: "listings", seniority: "manager", orgRole: "manager",
  basic: 14000, allowances: { housing: 6000, transport: 1500 }, joinedAt: daysAgo(600),
  canLogIn: true, title: "Marketing Manager" });

add({ name: "Mariam Al Falasi", department: "hr", seniority: "manager", orgRole: "manager",
  basic: 13000, allowances: { housing: 5500, transport: 1200 }, joinedAt: daysAgo(900),
  canLogIn: true, title: "HR Manager" });

add({ name: "Dmitry Sokolov", department: "it", seniority: "staff", orgRole: "agent",
  basic: 11000, allowances: { housing: 4000, transport: 1000 }, joinedAt: daysAgo(400),
  canLogIn: true, title: "IT Administrator" });

/* ── WRITE ───────────────────────────────────────────────────────────────── */
const app  = initializeApp(firebaseConfig, "seed-primary");
const auth = getAuth(app);
const db   = getFirestore(app);

/* THE DEMO AGENCY NEEDS ITS OWN OWNER.
   The first attempt signed in as an existing owner of a DIFFERENT agency and
   was refused — correctly. The rule that lets an org admin create staff also
   requires the new person to land in the creator's own orgId, so nobody can
   create users inside somebody else's company. That is the tenant boundary
   doing its job, and the fix is to found the agency properly rather than to
   weaken it: create the owner, let them create the organisation, and seed the
   staff as them. Exactly the path a real customer takes. */
/* The founder's address is tied to the organisation. Reusing one address across
   two organisations fails, and rightly: moving your own orgId is a privileged
   change, so a founder cannot migrate themselves into a different company. */
const OWNER = { name: "Mohammed Al Rashid",
                email: `owner.${ORG_ID.replace(/[^a-z0-9]+/g, "")}@${DOMAIN}`,
                title: "Agency Owner" };

console.log(`founding ${ORG_NAME}…`);
let ownerUid;
try {
  const c = await createUserWithEmailAndPassword(auth, OWNER.email, PASSWORD);
  ownerUid = c.user.uid;
  console.log("  owner account created:", OWNER.email);
} catch (e) {
  if (e.code !== "auth/email-already-in-use") throw e;
  const c = await signInWithEmailAndPassword(auth, OWNER.email, PASSWORD);
  ownerUid = c.user.uid;
  console.log("  owner already existed, signed in:", OWNER.email);
}

/* THE OWNER'S OWN DOCUMENT FIRST, THEN THE ORGANISATION.
   The other way round failed. Writing the organisation is an UPDATE once
   the document exists, and updating one requires isManager(), which reads
   the writer's user document — which did not exist yet, so the founder was
   refused their own agency. Self-creating the owner record is always
   permitted, and it is what makes them a manager of this agency for the
   write that follows. */
await setDoc(doc(db, "users", ownerUid), {
  name: OWNER.name, email: OWNER.email, role: "user",
  orgRole: "owner", department: "management", seniority: "owner",
  orgId: ORG_ID, jobTitle: OWNER.title, joinedAt: "2019-03-01",
  basic: 60000, allowances: { housing: 25000, transport: 5000 },
  status: "active", demoSeed: true, createdAt: new Date().toISOString(),
}, { merge: true });
/* The organisation. (Originally written first; see the note above.) The owner's own document points at it, and the rule
   that lets somebody found an agency checks the organisation names them. */
await setDoc(doc(db, "organisations", ORG_ID), {
  orgId: ORG_ID, name: ORG_NAME, city: "Dubai",
  reraNo: "ORN-24417", tradeLicense: "DED-889210", phone: "+971 4 552 8800",
  ownerId: ownerUid, ownerEmail: OWNER.email,
  plan: "enterprise", seatsIncluded: 150, seatsUsed: staff.length + 1,
  status: "active", demoSeed: true, createdAt: new Date().toISOString(),
}, { merge: true });

console.log("  organisation and owner written");

console.log(`\nadding ${staff.length} people…`);

/* Auth accounts only for the people a demo signs in as. On a SECOND app, so
   the owner's session survives — the exact fault fixed in TeamTab.jsx. */
const helper = initializeApp(firebaseConfig, "seed-helper");
const helperAuth = getAuth(helper);
const logins = [{ title: OWNER.title, name: OWNER.name, email: OWNER.email }];

const uidByName = {};
for (const s of staff) {
  s.email = emailFor(s.name);
  if (s.canLogIn) {
    try {
      const c = await createUserWithEmailAndPassword(helperAuth, s.email, PASSWORD);
      s.uid = c.user.uid;
      await signOut(helperAuth);
      logins.push({ title: s.title, name: s.name, email: s.email });
    } catch (e) {
      /* A previous run already made this account. Sign in to recover the REAL
         uid — inventing a synthetic one instead writes a profile the person can
         never find, because the app looks its user document up by auth uid. */
      if (e.code === "auth/email-already-in-use") {
        const c = await signInWithEmailAndPassword(helperAuth, s.email, PASSWORD);
        s.uid = c.user.uid;
        await signOut(helperAuth);
        logins.push({ title: s.title, name: s.name, email: s.email });
      } else {
        console.log(`  ! auth for ${s.name}: ${e.code || e.message}`);
        s.uid = `demo_${ORG_ID}_${s.name.toLowerCase().replace(/\W+/g, "_")}`;
      }
    }
  } else {
    /* A record without a login. Every roster, scope and payroll read works
       from the document; only signing in does not. */
    s.uid = `demo_${ORG_ID}_${s.name.toLowerCase().replace(/\W+/g, "_")}_${staff.indexOf(s)}`;
  }
  uidByName[s.name] = s.uid;
}
await deleteApp(helper).catch(() => {});

let written = 0;
for (let i = 0; i < staff.length; i += 200) {
  const batch = writeBatch(db);
  for (const s of staff.slice(i, i + 200)) {
    batch.set(doc(db, "users", s.uid), {
      name: s.name, email: s.email, role: "user",
      orgRole: s.orgRole, department: s.department, seniority: s.seniority,
      orgId: ORG_ID, managerId: s.reportsToName ? uidByName[s.reportsToName] || "" : "",
      jobTitle: s.title, joinedAt: s.joinedAt,
      basic: s.basic, allowances: s.allowances,
      ...(s.brn ? { brn: s.brn } : {}),
      ...(s.brnExpiry ? { expiries: { brn: s.brnExpiry } } : {}),
      ...(s.area ? { community: s.area } : {}),
      status: "active", demoSeed: true,
      createdAt: new Date().toISOString(), createdBy: ownerUid,
    }, { merge: true });
    written++;
  }
  await batch.commit();
  console.log(`  written ${written}/${staff.length}`);
}

console.log("\n─── SIGN IN AS ────────────────────────────────────────────");
console.log(`password for all of them: ${PASSWORD}\n`);
logins.forEach(l => console.log(`  ${l.title.padEnd(30)} ${l.email}`));
console.log(`\n${staff.length} people in ${ORG_NAME}. Agents without a login are still`);
console.log("full records with a manager — only signing in is unavailable.");

await deleteApp(app).catch(() => {});
process.exit(0);
