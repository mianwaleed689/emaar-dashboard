/**
 * REPAIR THE DEMO LISTINGS THE OLD SEED WROTE WRONG.
 *
 * The same fault as the deals and the leads, and this one reached customers.
 *
 *   1. THE PERMIT FIELD HAD THREE NAMES. The new-listing form saved
 *      `permitNo`, the compliance model read `permitNumber`, and the seed
 *      wrote `trakheesiPermit`. So the one question the Listings tab exists to
 *      answer — may this be advertised — was answered wrongly for every
 *      listing anybody had ever created through the product, and for all sixty
 *      demo ones. An agency typed in their Trakheesi permit, saw it echoed in
 *      the drawer, and were still told the listing had no permit.
 *
 *      This migrates whichever of the three a record carries onto
 *      `permitNumber`, and `permitExpiry` onto `permitExpiresAt`, then deletes
 *      the old keys so nothing can read them again by accident.
 *
 *   2. THE LISTINGS CONTRADICTED THEMSELVES. The title picked one building,
 *      `building` picked a second and `community` a third, and the bed count
 *      in the title was a separate random number from the `beds` field — so
 *      the demo showed "4 bed · Creek Rise" in "Downtown Dubai · Sunset Mall
 *      Residences", specified as 3 BR. The title is rebuilt from the record's
 *      own beds and building.
 *
 *   3. `unit` became `unitNo`, which is what the tab reads — so the duplicate
 *      check, which compares unit and building, could never fire.
 *
 *   node scripts/repair-demo-listings.mjs [orgId]
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, deleteField } from "firebase/firestore";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").map(l => l.trim())
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const ORG_ID = process.argv[2] || "org_demo_prime_estates_v2";
const OWNER  = `owner.${ORG_ID.replace(/[^a-z0-9]+/g, "")}@primeestates.example`;

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
}, "repairlistings");
const db = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), OWNER, "Demo2026!");
console.log("signed in as the owner of", ORG_ID);

const snap = await getDocs(query(collection(db, "listings"), where("orgId", "==", ORG_ID)));
const fixes = [];
const tally = { permit: 0, expiry: 0, unit: 0, title: 0 };

snap.forEach(d => {
  const l = d.data();
  const patch = {};

  /* ── the permit number ── */
  const permit = l.permitNumber || l.permitNo || l.trakheesiPermit || null;
  if (!l.permitNumber && permit) { patch.permitNumber = permit; tally.permit++; }
  if ("permitNo" in l)          patch.permitNo = deleteField();
  if ("trakheesiPermit" in l)   patch.trakheesiPermit = deleteField();

  /* ── the expiry ── */
  if (!l.permitExpiresAt && l.permitExpiry) { patch.permitExpiresAt = l.permitExpiry; tally.expiry++; }
  if ("permitExpiry" in l) patch.permitExpiry = deleteField();

  /* ── the unit ── */
  if (!l.unitNo && l.unit) { patch.unitNo = l.unit; tally.unit++; }
  if ("unit" in l) patch.unit = deleteField();

  /* ── the title, which must describe the record it is on ── */
  const beds = Number(l.beds) || 0;
  const building = l.building || "";
  if (beds > 0 && building) {
    const proper = `${beds} bed · ${building}`;
    if (l.title !== proper) { patch.title = proper; tally.title++; }
  }

  if (Object.keys(patch).length) fixes.push({ id: d.id, patch });
});

console.log(`${snap.size} listings · ${fixes.length} to repair`);
console.log(`  permit numbers recovered ${tally.permit} · expiries ${tally.expiry} · units ${tally.unit} · titles corrected ${tally.title}`);

for (let i = 0; i < fixes.length; i += 200) {
  const batch = writeBatch(db);
  for (const f of fixes.slice(i, i + 200)) batch.update(doc(db, "listings", f.id), f.patch);
  await batch.commit();
}
console.log(`repaired ${fixes.length}`);
process.exit(0);
