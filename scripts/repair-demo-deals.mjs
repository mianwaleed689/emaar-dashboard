/**
 * REPAIR THE DEMO DEALS THE OLD SEED WROTE WRONG.
 *
 * Two faults, both from the seed restating the model instead of importing it:
 *
 *   1. Every deal was given RESALE stage keys whatever its journey. An off-plan
 *      deal has no "Form F signed" and a rental has no "trustee" — so 47 deals
 *      sat at a stage that does not exist in their own journey. The product was
 *      right to refuse to guess and to say "47 deals need the stage confirming".
 *
 *   2. Documents were ticked as `formA`, `trakheesi`, `formF`, `noc`, while the
 *      gate reads `FORM_A`, `TRAKHEESI`, `FORM_F`, `NOC`. All 114 ticks were
 *      invisible: the screen told 45 agents their Form A was missing on a deal
 *      that showed Form A ticked.
 *
 * The stage is remapped by position — the old list was a resale path and the
 * new one is the deal's own journey, so a deal three quarters of the way along
 * stays three quarters of the way along. That is a placement, not a fact
 * recovered from anywhere, which is fine for seeded demo data and would not be
 * fine for a customer's records.
 *
 *   node scripts/repair-demo-deals.mjs [orgId]
 */
import { JOURNEYS } from "../src/crm/model/journeys.js";
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

/* What the old seed wrote, in the order it wrote it. */
const OLD_STAGES = ["formA","permit","published","buyer","viewings","offer","formF","noc","trustee","transferred","commission"];
const OLD_DOCS   = { formA: "FORM_A", trakheesi: "TRAKHEESI", formF: "FORM_F", noc: "NOC" };

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
}, "repairdeals");
const db = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), OWNER, "Demo2026!");
console.log("signed in as the owner of", ORG_ID);

const snap = await getDocs(query(collection(db, "deals"), where("orgId", "==", ORG_ID)));
const fixes = [];
let stagesMoved = 0, docsRenamed = 0, docsFilled = 0;

/* Stable order, so re-running picks the same deals to leave short. */
const ordered = snap.docs.slice().sort((a, z) => a.id.localeCompare(z.id));
ordered.forEach((d, idx) => {
  const deal = d.data();
  const J = JOURNEYS[deal.journey] || JOURNEYS.secondary;
  const stages = J.stages;
  const patch = {};

  /* ── the stage ── */
  if (!stages.some(s => s.key === deal.stage)) {
    const oldIdx = OLD_STAGES.indexOf(deal.stage);
    if (oldIdx >= 0) {
      const proportion = oldIdx / (OLD_STAGES.length - 1);
      patch.stage = stages[Math.round(proportion * (stages.length - 1))].key;
      patch.needsReview = false;
      stagesMoved++;
    }
  }

  /* ── the document keys ──
     Written as dotted paths rather than a replacement map: a merged write of
     { documents: {...} } deep-merges, so the old lowercase keys would survive
     alongside the new ones and every deal would carry both. */
  const docs = deal.documents || {};
  /* Only ticks the deal's own journey actually asks for. Carrying a Form F
     onto a rental would be inventing paperwork nobody signed. */
  const wanted = new Set(stages.flatMap(s => s.requires || []));
  let anyTick = null;
  for (const [k, v] of Object.entries(docs)) {
    if (v?.receivedAt && !anyTick) anyTick = v;
    const proper = OLD_DOCS[k];
    if (!proper) continue;
    patch[`documents.${k}`] = deleteField();
    if (!docs[proper] && wanted.has(proper)) { patch[`documents.${proper}`] = v; docsRenamed++; }
  }

  /* Renaming alone leaves a deal standing at, say, Ejari with a Form A on it
     and nothing else — the paperwork no longer matches where the deal is,
     which is not a state a real agency reaches. Worse, renaming DROPPED the
     ticks a journey does not use, so two thirds of the agency ended up with no
     paperwork at all and half the board sat blocked. That is not a brokerage,
     it is a backlog.

     So each deal is given the paperwork its own journey asks for up to the
     stage it now stands at, and every third deal is deliberately left short so
     the gates still have something real to hold — the same rule the seed
     itself now follows. This is invented, as everything about a demo agency
     is; it is written down here rather than left implied so nobody later
     mistakes it for something a person entered. */
  const leaveShort = idx % 3 === 0;
  if (!leaveShort) {
    const when = anyTick?.receivedAt || deal.createdAt || new Date().toISOString();
    anyTick = anyTick || { receivedAt: when, by: deal.agentName || "" };
    const stageIdx = stages.findIndex(s => s.key === (patch.stage || deal.stage));
    /* stageIdx + 1, not stageIdx. A stage's `requires` is what the deal needs
       to LEAVE it, so filling everything strictly before the current stage
       leaves the current one short and the deal blocked regardless — which is
       what the first run of this did, and why the blocked count did not move. */
    stages.slice(0, Math.max(0, stageIdx) + 1).forEach(st => (st.requires || []).forEach(key => {
      if (docs[key] || patch[`documents.${key}`]) return;
      patch[`documents.${key}`] = { receivedAt: anyTick.receivedAt, by: anyTick.by || deal.agentName || "" };
      docsFilled++;
    }));
  }

  if (Object.keys(patch).length) fixes.push({ id: d.id, patch });
});

console.log(`${snap.size} deals · ${fixes.length} to repair · ${stagesMoved} stages placed · ${docsRenamed} ticks recovered · ${docsFilled} filled to match the stage`);

for (let i = 0; i < fixes.length; i += 200) {
  const batch = writeBatch(db);
  for (const f of fixes.slice(i, i + 200)) {
    /* update(), not set(merge) — dotted paths only address a nested field on an
       update; on a merged set they would create a literal key with a dot in it. */
    batch.update(doc(db, "deals", f.id), { ...f.patch, updatedAt: new Date().toISOString() });
  }
  await batch.commit();
}
console.log(`repaired ${fixes.length}`);
process.exit(0);
