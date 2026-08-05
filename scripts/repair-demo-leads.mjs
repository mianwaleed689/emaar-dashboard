/**
 * REPAIR THE DEMO LEADS THE OLD SEED WROTE WRONG.
 *
 * Same root cause as the deals: the seed restated the product's vocabulary
 * instead of importing it, and wrote fields nothing reads.
 *
 *   1. STAGES. The seed's eight names shared exactly one with the product's
 *      eleven — "New Lead". So the stage filter offered eleven options all
 *      reading zero; "Closed Deal" matched nothing, so the conversion rate was
 *      0% and the leaderboard ranked 125 agents equally; and 117 finished
 *      leads (36 won, 81 lost) were counted as open work, because OPEN()
 *      excludes three stage names that did not exist in the data.
 *
 *   2. CONTACT. The call order reads `notes_log` for a Call, WhatsApp, Email,
 *      Viewing or Offer entry. The seed wrote no notes_log at all and instead
 *      wrote `lastContactedAt`, which nothing in the product reads. So
 *      contacted() was false for every lead, four of the five call-order rules
 *      could never fire, and the desk reported 418 of 418 needing a call —
 *      which tells an agent exactly as much as reporting none of them.
 *
 *   3. SOURCES. "dubizzle", "Walk-in" and "Cold call" against the product's
 *      "Dubizzle", "Walk In" and "Cold Call". Three of fifteen filter options
 *      matched nothing.
 *
 * Everything written here is invented, as everything about a demo agency is.
 * It is written down rather than left implied so nobody later mistakes it for
 * something a person entered.
 *
 *   node scripts/repair-demo-leads.mjs [orgId]
 */
import { LEAD_SOURCES, STAGE_KEYS } from "../src/crm/model/leads.js";
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

/* The old vocabulary, mapped onto the real one. Where one old name covers
   several real ones the split is by a stable hash of the document id, so
   re-running this produces the same agency rather than reshuffling it. */
const STAGE_MAP = {
  "New Lead":          ["New Lead"],
  "Contacted":         ["Potential", "Potential", "Potential", "Whats app", "No Answer"],
  "Qualified":         ["Potential", "Potential", "Potential", "Resale/buy/Rent", "EOI"],
  "Viewing Scheduled": ["Hot Case"],
  "Offer Made":        ["Hot Case"],
  "Negotiating":       ["Hot Case"],
  "Won":               ["Closed Deal"],
  "Lost":              ["Closed Outside", "Closed Outside", "Non Potential", "Non Potential", "Low Budget"],
};
const SOURCE_MAP = { "dubizzle": "Dubizzle", "Walk-in": "Walk In", "Cold call": "Cold Call" };

const NOTES = [
  "Rang, went to voicemail. Left a message.",
  "Spoke for ten minutes. Wants two bedrooms, ready to move in Q4.",
  "Sent the three Marina options over WhatsApp.",
  "Asked for floor plans and the service charge before booking a viewing.",
  "Called — in a meeting, asked me to try tomorrow morning.",
  "Emailed the brochure and the payment plan.",
  "Viewing done. Liked the layout, thought the price was high.",
  "Wants to see the handover date in writing before going further.",
  "Discussed mortgage pre-approval. Bank appointment next week.",
  "Following up after the offer. Waiting on the seller.",
];
const CONTACT = ["Call", "WhatsApp", "Email", "Viewing"];
const FIRST_REPLY_MINUTES = [4, 9, 18, 45, 120, 380];

/* A stable pseudo-random stream per document, so the repair is repeatable. */
const streamFor = id => {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
};
const DAY = 86400000;
const ago = d => new Date(Date.now() - d * DAY).toISOString();

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
}, "repairleads");
const db = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), OWNER, "Demo2026!");
console.log("signed in as the owner of", ORG_ID);

const snap = await getDocs(query(collection(db, "leads"), where("orgId", "==", ORG_ID)));
const fixes = [];
const tally = { stage: 0, source: 0, life: 0 };
const situations = {};

snap.forEach(d => {
  const lead = d.data();
  const rnd = streamFor(d.id);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int  = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const patch = {};

  /* ── the stage ── */
  let stage = lead.status;
  if (!STAGE_KEYS.includes(stage)) {
    const options = STAGE_MAP[stage];
    if (options) { stage = pick(options); patch.status = stage; tally.stage++; }
    else { stage = "New Lead"; patch.status = stage; tally.stage++; }
  }

  /* ── the source ── */
  if (SOURCE_MAP[lead.source]) { patch.source = SOURCE_MAP[lead.source]; tally.source++; }
  else if (lead.source && !LEAD_SOURCES.includes(lead.source)) { patch.source = "Manual"; tally.source++; }

  /* ── the life ──
     Only rewritten where it is absent or flat. A lead that already carries a
     real notes_log is left exactly as it is: this is a repair, not a reset. */
  const hasContact = (lead.notes_log || []).some(n => CONTACT.includes(n.type) || n.type === "Offer");
  if (!hasContact) {
    const age = lead.createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / DAY))
      : int(0, 26);
    const createdAt = lead.createdAt || ago(age);
    const created = { type: "Note", text: "Lead created", by: "system", at: createdAt };
    const contactNote = (daysBack, minsAfter) => ({
      type: pick(CONTACT), text: pick(NOTES), by: "demo@primeestates.example",
      at: minsAfter != null
        ? new Date(new Date(createdAt).getTime() + minsAfter * 60000).toISOString()
        : ago(daysBack),
    });
    const trail = (n, lastTouched) => {
      const out = [created, contactNote(null, pick(FIRST_REPLY_MINUTES))];
      for (let i = 1; i < n; i++) out.push(contactNote(int(lastTouched, Math.max(lastTouched, age))));
      return out;
    };

    let s;
    if (["Closed Deal", "Closed Outside", "Non Potential"].includes(stage)) {
      const done = int(1, Math.max(1, age));
      s = { key: "finished", createdAt, updatedAt: ago(done),
            notes_log: trail(int(3, 6), done), followUpDate: null };
    } else {
      const roll = rnd();
      if (roll < 0.05) {
        s = { key: "new today, not called", createdAt: ago(0), updatedAt: ago(0),
              notes_log: [{ ...created, at: ago(0) }], followUpDate: null };
      } else if (roll < 0.14) {
        const t = int(1, 6);
        s = { key: "follow-up due", createdAt, updatedAt: ago(t),
              notes_log: trail(int(2, 4), t), followUpDate: ago(int(0, 4)) };
      } else if (roll < 0.24) {
        s = { key: "never contacted", createdAt, updatedAt: createdAt,
              notes_log: [created], followUpDate: null };
      } else if (roll < 0.40) {
        const t = int(8, Math.max(9, age));
        s = { key: "gone quiet", createdAt: ago(Math.max(age, t + 1)), updatedAt: ago(t),
              notes_log: trail(int(2, 4), t), followUpDate: null };
      } else {
        const t = int(0, 6);
        s = { key: "being worked", createdAt, updatedAt: ago(t),
              notes_log: trail(int(2, 5), t),
              followUpDate: rnd() < 0.3 ? ago(-int(1, 10)) : null };
      }
    }
    situations[s.key] = (situations[s.key] || 0) + 1;
    patch.createdAt = s.createdAt;
    patch.updatedAt = s.updatedAt;
    patch.notes_log = s.notes_log;
    patch.followUpDate = s.followUpDate;
    /* Nothing reads this. It is what made the seed look like it had recorded
       contact when the product could not see any. */
    patch.lastContactedAt = deleteField();
    tally.life++;
  }

  if (Object.keys(patch).length) fixes.push({ id: d.id, patch });
});

console.log(`${snap.size} leads · ${fixes.length} to repair`);
console.log(`  stages remapped ${tally.stage} · sources corrected ${tally.source} · histories written ${tally.life}`);
console.log("  situations:", JSON.stringify(situations));

for (let i = 0; i < fixes.length; i += 200) {
  const batch = writeBatch(db);
  for (const f of fixes.slice(i, i + 200)) batch.update(doc(db, "leads", f.id), f.patch);
  await batch.commit();
}
console.log(`repaired ${fixes.length}`);
process.exit(0);
