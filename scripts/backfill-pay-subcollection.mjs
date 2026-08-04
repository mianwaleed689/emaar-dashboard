/**
 * MOVE PAY OFF THE USER RECORDS.
 *
 * `basic` and `allowances` used to be written onto /users, which any manager in
 * the agency may read — the Payroll screen hid a colleague's salary while the
 * raw document handed it to anyone who opened developer tools. Firestore rules
 * cannot restrict a single field, so the field had to move.
 *
 * This copies what is already on the user records into
 * organisations/{orgId}/pay/{personId}, and then clears it from the user
 * record — copying without clearing would leave the leak exactly where it was
 * while making everybody feel better about it.
 *
 *   node scripts/backfill-pay-subcollection.mjs [orgId]
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, deleteField } from "firebase/firestore";
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

const ORG_ID = process.argv[2] || "org_demo_prime_estates_v2";
const OWNER  = `owner.${ORG_ID.replace(/[^a-z0-9]+/g, "")}@primeestates.example`;

const app = initializeApp(firebaseConfig, "paymove");
const db  = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), OWNER, "Demo2026!");
console.log("signed in as the owner of", ORG_ID);

const snap = await getDocs(query(collection(db, "users"), where("orgId", "==", ORG_ID)));
const withPay = [];
snap.forEach(d => {
  const u = d.data();
  if (u.basic != null || u.allowances != null || u.deductions != null) {
    withPay.push({ id: d.id, basic: u.basic ?? 0, allowances: u.allowances ?? {},
                   deductions: u.deductions ?? [] });
  }
});
console.log(`${snap.size} people · ${withPay.length} carrying pay on their user record`);

let moved = 0;
for (let i = 0; i < withPay.length; i += 100) {
  const batch = writeBatch(db);
  for (const p of withPay.slice(i, i + 100)) {
    batch.set(doc(db, "organisations", ORG_ID, "pay", p.id), {
      personId: p.id, basic: p.basic, allowances: p.allowances, deductions: p.deductions,
      movedAt: new Date().toISOString(),
    }, { merge: true });
    /* And gone from the record every manager can read. */
    batch.set(doc(db, "users", p.id), {
      basic: deleteField(), allowances: deleteField(), deductions: deleteField(),
    }, { merge: true });
  }
  await batch.commit();
  moved += Math.min(100, withPay.length - i);
  console.log(`  ${moved}/${withPay.length}`);
}

console.log("\npay is now readable only by HR, finance, management and the person themselves.");
await deleteApp(app).catch(() => {});
process.exit(0);
