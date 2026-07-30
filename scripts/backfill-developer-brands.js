/**
 * One-off backfill for tabData/developerBrands.
 *
 * The nightly cron (api/_cron/cron-developer-brands.js) will keep this document
 * fresh once deployed, but this script creates it NOW, from your machine, using
 * the local service account key — so the document can be inspected before the
 * dashboard is switched over to read it.
 *
 * DRY RUN BY DEFAULT. It reads, aggregates, shows you exactly what it would
 * write, and writes nothing unless you pass --write.
 *
 *   node scripts/backfill-developer-brands.js            # show me, change nothing
 *   node scripts/backfill-developer-brands.js --write     # actually write the doc
 *
 * READ COST: one full pass over `developers` (~2,034 reads) per run.
 * Budget accordingly — the free tier allows 50,000 reads/day and resets at
 * midnight US Pacific (10:59 or 11:59 Dubai time, depending on US daylight
 * saving).
 *
 * This script never deletes or modifies anything else. The single document it
 * writes, tabData/developerBrands, is new — nothing reads it yet.
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
/* buildPayload is shared with the cron so the two can never produce different
   documents. Do not rebuild the payload here. */
const { buildPayload } = require("../api/_cron/cron-developer-brands.js");

const WRITE = process.argv.includes("--write");

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  console.log(WRITE ? "MODE: WRITE — will save the document\n" : "MODE: DRY RUN — nothing will be written\n");

  process.stdout.write("Reading developers collection… ");
  const snap = await db.collection("developers").get();
  console.log(`${snap.size} documents read`);

  const records = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  const payload = buildPayload(records, new Date().toISOString());
  const brands = payload.brands;

  const bytes = Buffer.byteLength(JSON.stringify(payload), "utf8");

  console.log("\n─── WHAT THE AGGREGATION PRODUCED ───────────────────────────");
  console.log(`  source documents          ${snap.size}`);
  console.log(`  published + verified      ${payload.publishedVerifiedCount}`);
  console.log(`  distinct brands           ${payload.totalBrandCount}`);
  console.log(`  published to dropdown     ${payload.brandCount}`);
  console.log(`  held back                 ${payload.heldBackCount}  (${payload.heldBackReason})`);
  console.log(`  document size             ${(bytes / 1024).toFixed(1)} KB  (limit 1024 KB)`);
  console.log(`  reads saved per visitor   ${snap.size} -> 1`);

  const multi = brands.filter(b => (b._entityCount || 1) > 1);
  console.log(`\n  brands built from multiple registry entities: ${multi.length}`);
  multi.slice(0, 10).forEach(b => {
    console.log(`    ${b.name}  —  ${b._entityCount} entities, ${b.totalProjects} projects`);
  });

  console.log("\n─── TOP 15 BRANDS AS THEY WILL APPEAR IN THE DROPDOWN ───────");
  brands.slice(0, 15).forEach((b, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. ${(b.name || "").slice(0, 34).padEnd(36)}` +
      `${String(b.tier || "untiered").padEnd(10)} ${String(b.totalProjects).padStart(4)} projects`
    );
  });

  /* Sanity checks — surface anything that would make the dropdown look wrong. */
  console.log("\n─── SANITY CHECKS ───────────────────────────────────────────");
  const warn = [];
  if (!brands.length) warn.push("no brands produced — the dropdown would be empty");
  if (bytes > 900 * 1024) warn.push(`document is ${(bytes / 1024).toFixed(0)} KB, too close to the 1 MiB limit`);
  const noName = brands.filter(b => !b.name).length;
  if (noName) warn.push(`${noName} brand(s) have no name`);
  const dupeIds = brands.length - new Set(brands.map(b => b.id)).size;
  if (dupeIds) warn.push(`${dupeIds} duplicate brand id(s) — React keys would collide`);
  const untiered = brands.filter(b => !b.tier).length;
  if (untiered) console.log(`  note: ${untiered} brand(s) have no tier and will sort last`);

  if (warn.length) {
    warn.forEach(w => console.log(`  WARNING: ${w}`));
  } else {
    console.log("  all clear");
  }

  /* Always keep a local copy so the result can be reviewed offline and diffed
     against the next run, without spending reads again. */
  const dir = path.join(__dirname, "..", "data-audit");
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, "developerBrands.json");
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`\nLocal copy saved: data-audit/developerBrands.json`);

  if (!WRITE) {
    console.log("\nDRY RUN — Firestore was NOT modified.");
    console.log("Review the numbers above, then re-run with --write to save the document.");
    process.exit(0);
  }

  if (warn.length) {
    console.log("\nRefusing to write while warnings are present. Resolve them first.");
    process.exit(1);
  }

  await db.collection("tabData").doc("developerBrands").set(payload);
  console.log("\nWritten: tabData/developerBrands");
  console.log("Nothing reads this document yet — the dashboard is unchanged.");
  process.exit(0);
}

run().catch(err => {
  console.error("\nFAILED:", err.message);
  if (String(err.message).includes("RESOURCE_EXHAUSTED")) {
    console.error("The daily Firestore read quota is exhausted. It resets at midnight US Pacific.");
  }
  process.exit(1);
});
