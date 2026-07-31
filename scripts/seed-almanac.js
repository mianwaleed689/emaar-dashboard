/**
 * Seed the almanacEntries collection from the curated file, then compile.
 *
 * ── THE TWO-LAYER DESIGN ────────────────────────────────────────────────────
 *
 * src/data/marketAlmanac.js is the CURATED SEED — version-controlled, reviewed
 * in pull requests, and always available even if Firestore is unreachable. It
 * holds the pivotal moments.
 *
 * `almanacEntries` in Firestore is the GROWING RECORD — entries added through
 * the admin editor without a deploy, which is what makes filling twenty years of
 * months practical.
 *
 * The client merges both, with Firestore winning on a shared id, so a curated
 * entry can be corrected in the admin without editing code, and a Firestore
 * outage degrades to the curated set rather than to nothing.
 *
 * This script copies the seed into Firestore so the two start aligned. It is
 * safe to re-run: entries are written by id, so a second run overwrites rather
 * than duplicating.
 *
 * DRY RUN BY DEFAULT.
 *   node scripts/seed-almanac.js            # show me
 *   node scripts/seed-almanac.js --write     # write entries + compile
 *
 * WRITE COST: one write per entry, plus one for the compiled document.
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { validateEntry } = require("../api/_cron/cron-almanac.js");

const WRITE = process.argv.includes("--write");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

/**
 * Read the curated entries out of the ESM source without importing it — this
 * script is CommonJS and the data file is ESM. Parsing the exported array is
 * simpler and less fragile than adding a build step for one file.
 */
function loadSeed() {
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "data", "marketAlmanac.js"), "utf8");
  const start = src.indexOf("export const ALMANAC = [");
  if (start === -1) throw new Error("Could not find ALMANAC export in marketAlmanac.js");
  const open = src.indexOf("[", start);

  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Unbalanced brackets in ALMANAC");

  const body = src.slice(open, end + 1)
    /* MOMENT.SHOCK -> "shock" etc, so the literal evaluates standalone. */
    .replace(/MOMENT\.([A-Z_]+)/g, (_, k) => JSON.stringify(k.toLowerCase()));

  // eslint-disable-next-line no-eval
  return eval(body);
}

async function run() {
  console.log(WRITE ? "MODE: WRITE\n" : "MODE: DRY RUN — nothing will be written\n");

  const seed = loadSeed();
  console.log(`Loaded ${seed.length} curated entries from src/data/marketAlmanac.js\n`);

  const valid = [], invalid = [];
  for (const e of seed) {
    const { ok, errors } = validateEntry(e);
    (ok ? valid : invalid).push({ entry: e, errors });
  }

  console.log("─── VALIDATION ──────────────────────────────────────────────");
  console.log(`  pass   ${valid.length}`);
  console.log(`  fail   ${invalid.length}`);
  invalid.forEach(({ entry, errors }) =>
    console.log(`    ${String(entry.id).padEnd(12)} ${errors.join("; ")}`));

  if (invalid.length) {
    console.log("\n  The curated file must not contain an invalid entry. Fix it before seeding.");
    process.exit(1);
  }

  console.log("\n─── ENTRIES ─────────────────────────────────────────────────");
  valid.forEach(({ entry: e }) =>
    console.log(`  ${String(e.id).padEnd(12)}${String(e.moment).padEnd(11)}${e.sources.length} src   ${String(e.headline).slice(0, 46)}`));

  const existing = await db.collection("almanacEntries").get();
  console.log(`\n  already in Firestore: ${existing.size} entries`);

  if (!WRITE) {
    console.log("\nDRY RUN — Firestore was NOT modified.");
    console.log("Re-run with --write to seed the collection and compile tabData/almanac.");
    process.exit(0);
  }

  const batch = db.batch();
  valid.forEach(({ entry }) => {
    batch.set(db.collection("almanacEntries").doc(entry.id), {
      ...entry,
      status: "published",
      origin: "curated-seed",
      seededAt: new Date().toISOString(),
    }, { merge: true });
  });
  await batch.commit();
  console.log(`\nwrote ${valid.length} entries to almanacEntries`);

  /* Compile immediately so the client has something to read without waiting for
     the nightly cron. */
  const all = await db.collection("almanacEntries").get();
  const published = all.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(e => e.status !== "draft" && validateEntry(e).ok)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const years = new Set(published.map(e => String(e.id).slice(0, 4)));
  const sources = new Set();
  published.forEach(e => (e.sources || []).forEach(s => sources.add(s)));

  await db.collection("tabData").doc("almanac").set({
    schemaVersion: 1,
    entries: published,
    entryCount: published.length,
    yearCount: years.size,
    sourceCount: sources.size,
    rejectedCount: 0,
    rejected: [],
    earliest: published[0]?.label ?? null,
    latest: published[published.length - 1]?.label ?? null,
    generatedAt: new Date().toISOString(),
  });

  console.log(`compiled tabData/almanac — ${published.length} entries, ${years.size} years, ${sources.size} sources`);
  console.log("\nThe client reads ONE document regardless of how many entries this grows to.");
  process.exit(0);
}

run().catch(err => { console.error("FAILED:", err.message); process.exit(1); });
