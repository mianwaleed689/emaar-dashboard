/**
 * GIVE THE TWO DEMO AGENTS A WEEK OF VIEWINGS.
 *
 * seed-demo-work.mjs spread viewings over `agents.slice(0, 80)`, and Firestore
 * returns documents in no particular order — so "the first eighty" was eighty
 * arbitrary people, and neither agent who can actually sign in was among them.
 * Their diary was empty and correct, which looks identical to a diary that is
 * empty and broken.
 *
 *   node scripts/seed-demo-diary.mjs
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").map(l => l.trim()).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID }, "diary");
const db = getFirestore(app);
const ORG = "org_demo_prime_estates_v2";

await signInWithEmailAndPassword(getAuth(app),
  `owner.${ORG.replace(/[^a-z0-9]+/g, "")}@primeestates.example`, "Demo2026!");

const WHO = ["ahmed.hassan.5@primeestates.example", "maria.volkov.85@primeestates.example"];
const people = [];
(await getDocs(query(collection(db, "users"), where("orgId", "==", ORG)))).forEach(d =>
  people.push({ uid: d.id, ...d.data() }));

const hour = h => { const d = new Date(); d.setHours(h, 0, 0, 0); return d; };
const at = (days, h) => new Date(hour(h).getTime() + days * 86400000).toISOString();

const batch = writeBatch(db);
let n = 0;
for (const email of WHO) {
  const a = people.find(p => p.email === email);
  if (!a) { console.log("not found:", email); continue; }
  /* A real week: two already done and written up, one done and NOT written up
     — the state the diary exists to nag about — and two still to come, one of
     them clashing with the other so the clash detector has something to find. */
  const rows = [
    { at: at(-3, 11), outcome: "Went ahead", verdict: "Too expensive" },
    { at: at(-1, 16), outcome: "No show",    verdict: null },
    { at: at(-1, 10), outcome: null,         verdict: null },
    { at: at(1, 14),  outcome: null,         verdict: null },
    { at: at(1, 14),  outcome: null,         verdict: null },
  ];
  rows.forEach((r, i) => {
    batch.set(doc(collection(db, "viewings")), {
      leadName: ["Omar Haddad", "Elena Petrova", "Rajesh Kumar", "Sarah Clarke", "Yusuf Aziz"][i],
      propertyName: ["Marina Gate 2, unit 1104", "Burj Vista, unit 2201", "Creek Rise, unit 806",
                 "Park Heights, unit 1502", "Beach Vista, unit 903"][i],
      community: ["Dubai Marina", "Downtown Dubai", "Creek Harbour", "Dubai Hills Estate", "Emaar Beachfront"][i],
      at: r.at, outcome: r.outcome, verdict: r.verdict,
      agentId: a.uid, agentName: a.name, orgId: ORG,
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), demoSeed: true,
    });
    n++;
  });
  console.log(`${a.name}: 5 viewings`);
}
await batch.commit();
console.log(`\n${n} viewings written — two written up, one overdue and unwritten, two upcoming (one a clash).`);
await deleteApp(app).catch(() => {});
process.exit(0);
