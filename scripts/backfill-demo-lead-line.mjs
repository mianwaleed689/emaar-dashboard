/**
 * BACKFILL THE REPORTING LINE ONTO EXISTING LEADS.
 *
 * The leads listener queries managerId and directorId ON THE LEAD, so a lead
 * created without them is invisible to the agent's manager and to the director
 * above them. In the seeded agency that meant every sales manager saw 0 of 418
 * leads while their forty agents each saw their own.
 *
 * Denormalised on purpose, not laziness: a manager has forty agents and
 * Firestore's `in` operator takes thirty values, so "every lead belonging to my
 * team" cannot be expressed as a query over the agent list. The reporting line
 * has to travel with the record.
 *
 *   node scripts/backfill-demo-lead-line.mjs
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

const app = initializeApp(firebaseConfig, "backfill");
const db = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), OWNER, "Demo2026!");
console.log("signed in as the demo owner");

const people = new Map();
let directorUid = "";
const us = await getDocs(query(collection(db, "users"), where("orgId", "==", ORG_ID)));
us.forEach(d => {
  const u = d.data();
  people.set(d.id, u);
  if (u.seniority === "director") directorUid = d.id;
});
console.log(`${people.size} people · director ${directorUid ? "found" : "MISSING"}`);

const ls = await getDocs(query(collection(db, "leads"), where("orgId", "==", ORG_ID)));
console.log(`${ls.size} leads to check`);

const todo = [];
ls.forEach(d => {
  const l = d.data();
  const agent = people.get(l.assignedTo);
  if (!agent) return;
  const managerId = agent.managerId || "";
  if (l.managerId === managerId && l.directorId === directorUid) return;   // already right
  todo.push({ id: d.id, managerId, directorId: directorUid });
});
console.log(`${todo.length} need the reporting line`);

let n = 0;
for (let i = 0; i < todo.length; i += 200) {
  const batch = writeBatch(db);
  todo.slice(i, i + 200).forEach(t =>
    batch.set(doc(db, "leads", t.id),
      { managerId: t.managerId, directorId: t.directorId }, { merge: true }));
  await batch.commit();
  n += Math.min(200, todo.length - i);
  console.log(`  ${n}/${todo.length}`);
}

console.log("\ndone — managers and the director can now see their teams' leads.");
await deleteApp(app).catch(() => {});
process.exit(0);
