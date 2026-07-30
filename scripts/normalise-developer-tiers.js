/**
 * Normalise the `tier` field on the `developers` collection.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * Measured across all 2,034 developer documents on 2026-07-30, `tier` is stored
 * in two incompatible formats:
 *
 *     "unclassified"  1954        3                12
 *     "tier-3"          32        1                11
 *     2                 12        "tier-2"         11
 *                                 "tier-1"          2
 *
 * Numbers and "tier-N" strings mean the same thing, but any code comparing
 * against "tier-1" sees only 2 of the 13 genuine tier-1 developers. That is why
 * Nakheel (346 projects), DAMAC (200) and Aldar (150) all sorted below an
 * 11-project competitor: the dashboard's rank map only knew the hyphenated form.
 *
 * The cron aggregation already normalises this when it builds the dropdown, so
 * nothing is broken today. This script fixes the SOURCE so that every other
 * consumer — admin screens, exports, future code — reads one consistent format
 * without having to know about the quirk.
 *
 * ── SAFETY ──────────────────────────────────────────────────────────────────
 *
 * DRY RUN BY DEFAULT. Writes nothing unless you pass --write.
 *
 *   node scripts/normalise-developer-tiers.js            # show me the changes
 *   node scripts/normalise-developer-tiers.js --write     # apply them
 *
 * Before writing it saves every affected document's ORIGINAL tier value to
 * data-audit/tier-backup-<timestamp>.json. There is no managed Firestore backup
 * on the free tier, so that file is the rollback. Keep it.
 *
 * It only ever touches the `tier` field. It never deletes a document, never
 * changes any other field, and never invents a tier: values it does not
 * recognise are reported and left exactly as they are.
 *
 * READ COST: one pass over `developers` (~2,034 reads).
 * WRITE COST: one write per changed document (free tier allows 20,000/day).
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

/**
 * Canonical form, or null when unrecognised.
 * "unclassified" is deliberately left ALONE rather than blanked — it carries the
 * meaning "nobody has classified this yet", which is information.
 */
function canonicalTier(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || s === "unclassified") return null;
  const n = s.replace(/^tier[\s_-]*/, "");
  return (n === "1" || n === "2" || n === "3") ? `tier-${n}` : null;
}

async function run() {
  console.log(WRITE ? "MODE: WRITE\n" : "MODE: DRY RUN — nothing will be written\n");

  const snap = await db.collection("developers").get();
  console.log(`read ${snap.size} developer documents\n`);

  const changes = [];
  const unrecognised = [];
  const untouched = { alreadyCanonical: 0, unclassified: 0, absent: 0 };

  snap.forEach(d => {
    const raw = d.data().tier;
    if (raw === undefined) { untouched.absent++; return; }
    const s = String(raw).trim().toLowerCase();
    if (s === "unclassified") { untouched.unclassified++; return; }

    const canon = canonicalTier(raw);
    if (!canon) {
      unrecognised.push({ id: d.id, name: d.data().name, tier: raw });
      return;
    }
    if (raw === canon) { untouched.alreadyCanonical++; return; }
    changes.push({ id: d.id, name: d.data().name || "(unnamed)", from: raw, to: canon });
  });

  console.log("─── PLAN ────────────────────────────────────────────────────");
  console.log(`  documents to change            ${changes.length}`);
  console.log(`  already canonical, left alone  ${untouched.alreadyCanonical}`);
  console.log(`  "unclassified", left alone     ${untouched.unclassified}`);
  console.log(`  no tier field, left alone      ${untouched.absent}`);
  console.log(`  unrecognised, LEFT ALONE       ${unrecognised.length}`);

  if (unrecognised.length) {
    console.log("\n  unrecognised values (not touched — review by hand):");
    unrecognised.slice(0, 15).forEach(u =>
      console.log(`    ${String(u.name || u.id).slice(0, 34).padEnd(36)}tier=${JSON.stringify(u.tier)}`));
  }

  if (!changes.length) {
    console.log("\nNothing to change. Exiting.");
    process.exit(0);
  }

  console.log("\n─── EVERY CHANGE, IN FULL ───────────────────────────────────");
  changes.forEach(c =>
    console.log(`  ${String(c.name).slice(0, 38).padEnd(40)}${JSON.stringify(c.from).padEnd(6)} -> ${c.to}`));

  const summary = {};
  changes.forEach(c => {
    const k = `${JSON.stringify(c.from)} -> ${c.to}`;
    summary[k] = (summary[k] || 0) + 1;
  });
  console.log("\n─── GROUPED ─────────────────────────────────────────────────");
  Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
    console.log(`  ${k.padEnd(24)}${String(v).padStart(4)} document(s)`));

  const dir = path.join(__dirname, "..", "data-audit");
  fs.mkdirSync(dir, { recursive: true });

  if (!WRITE) {
    const preview = path.join(dir, "tier-changes-preview.json");
    fs.writeFileSync(preview, JSON.stringify({ generatedAt: new Date().toISOString(), changes, unrecognised }, null, 2));
    console.log(`\nPreview saved: data-audit/tier-changes-preview.json`);
    console.log("DRY RUN — Firestore was NOT modified.");
    console.log("Re-run with --write to apply exactly the changes listed above.");
    process.exit(0);
  }

  /* Rollback file FIRST — before a single write. */
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(dir, `tier-backup-${stamp}.json`);
  fs.writeFileSync(backup, JSON.stringify({
    takenAt: new Date().toISOString(),
    note: "Original tier values before normalisation. To roll back, write `from` back to each id.",
    documents: changes.map(c => ({ id: c.id, name: c.name, originalTier: c.from })),
  }, null, 2));
  console.log(`\nRollback file written: data-audit/tier-backup-${stamp}.json`);

  let done = 0;
  for (let i = 0; i < changes.length; i += 400) {
    const batch = db.batch();
    changes.slice(i, i + 400).forEach(c => {
      batch.update(db.collection("developers").doc(c.id), { tier: c.to });
    });
    await batch.commit();
    done += Math.min(400, changes.length - i);
    console.log(`  committed ${done}/${changes.length}`);
  }

  console.log(`\nDone. ${done} document(s) updated. Only the \`tier\` field changed.`);
  console.log("Re-run the aggregation afterwards: node scripts/backfill-developer-brands.js --write");
  process.exit(0);
}

run().catch(err => { console.error("FAILED:", err.message); process.exit(1); });
