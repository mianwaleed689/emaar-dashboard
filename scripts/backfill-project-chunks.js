/**
 * One-off backfill for the project chunk documents.
 *
 * The nightly cron (api/_cron/cron-project-chunks.js) keeps these fresh once
 * deployed; this creates them NOW so the dashboard can be switched over and
 * verified without waiting for 08:35 UTC.
 *
 * DRY RUN BY DEFAULT.
 *
 *   node scripts/backfill-project-chunks.js            # show me, change nothing
 *   node scripts/backfill-project-chunks.js --write     # write manifest + chunks
 *
 * Uses the SAME splitIntoChunks() as the cron, so the two cannot drift.
 *
 * READ COST:  one pass over `projects` (~1,728 reads)
 * WRITE COST: ~27 documents (free tier allows 20,000 writes/day)
 *
 * Non-destructive: creates new tabData documents. It removes stale chunk
 * documents left by a longer previous run, because a leftover chunk would
 * reintroduce deleted projects — that is the only deletion it performs, and it
 * lists them before doing it.
 */
const admin = require("firebase-admin");
const {
  splitIntoChunks,
  dehydrateSources,
  MANIFEST_DOC,
  CHUNK_DOC_PREFIX,
  SOURCE_CATALOGUE_DOC,
  SCHEMA_VERSION,
} = require("../api/_cron/cron-project-chunks.js");

const WRITE = process.argv.includes("--write");

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  console.log(WRITE ? "MODE: WRITE\n" : "MODE: DRY RUN — nothing will be written\n");

  process.stdout.write("Reading projects… ");
  const snap = await db.collection("projects").get();
  console.log(`${snap.size} documents`);

  const rawRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const { records, catalogue } = dehydrateSources(rawRecords);
  const chunks = splitIntoChunks(records);
  const sizes = chunks.map(c => Buffer.byteLength(JSON.stringify({ projects: c }), "utf8"));
  const catKB = Math.round(Buffer.byteLength(JSON.stringify({ sources: catalogue }), "utf8") / 1024);
  const totalKB = Math.round(sizes.reduce((a, b) => a + b, 0) / 1024);

  console.log("\n─── PLAN ────────────────────────────────────────────────────");
  console.log(`  projects read             ${records.length}`);
  console.log(`  distinct sources          ${catalogue.length}  (catalogue ${catKB} KB)`);
  console.log(`  chunk documents           ${chunks.length}`);
  console.log(`  largest chunk             ${Math.round(Math.max(...sizes) / 1024)} KB   (limit 1024 KB)`);
  console.log(`  total payload             ${totalKB + catKB} KB`);
  console.log(`  reads per visitor         ${records.length} -> ${chunks.length + 2}`);

  /* Rehydration must be lossless or the transport optimisation is a data bug. */
  const byRef = records.map(r => {
    if (!Array.isArray(r._srcRefs)) return r;
    const c = { ...r, sources: r._srcRefs.map(i => catalogue[i]) };
    delete c._srcRefs;
    return c;
  });
  const originalSources = JSON.stringify(rawRecords.map(r => ({ id: r.id, s: r.sources ?? null })));
  const rebuiltSources = JSON.stringify(byRef.map(r => ({ id: r.id, s: r.sources ?? null })));
  if (originalSources !== rebuiltSources) {
    console.log("\n  REHYDRATION IS NOT LOSSLESS — refusing to write.");
    process.exit(1);
  }
  console.log(`  rehydration               lossless (verified byte-identical)`);

  /* Integrity — never publish a set that loses or duplicates a project. */
  const packed = chunks.flat();
  const ids = new Set(packed.map(p => p.id));
  const originalIds = new Set(records.map(r => r.id));
  const missing = [...originalIds].filter(i => !ids.has(i));
  const duplicated = packed.length - ids.size;

  console.log("\n─── INTEGRITY ───────────────────────────────────────────────");
  console.log(`  records packed            ${packed.length}`);
  console.log(`  unique ids                ${ids.size}`);
  console.log(`  missing after split       ${missing.length}`);
  console.log(`  duplicated after split    ${duplicated}`);

  if (missing.length || duplicated || packed.length !== records.length) {
    console.log("\n  INTEGRITY CHECK FAILED — refusing to write.");
    process.exit(1);
  }
  console.log("  all clear");

  /* Identify stale chunks from any previous, longer run. */
  const stale = [];
  for (let i = chunks.length; i < chunks.length + 20; i++) {
    const doc = await db.collection("tabData").doc(`${CHUNK_DOC_PREFIX}${i}`).get();
    if (!doc.exists) break;
    stale.push(`${CHUNK_DOC_PREFIX}${i}`);
  }
  if (stale.length) {
    console.log(`\n  stale chunk documents to REMOVE (${stale.length}):`);
    stale.forEach(s => console.log(`    tabData/${s}`));
    console.log("  (leaving them would reintroduce projects that no longer exist)");
  }

  if (!WRITE) {
    console.log("\nDRY RUN — Firestore was NOT modified.");
    console.log("Re-run with --write to publish exactly the plan above.");
    process.exit(0);
  }

  const generatedAt = new Date().toISOString();

  /* Catalogue and chunks first, manifest last: a reader must never see a
     manifest pointing at a document that has not been written yet. */
  await db.collection("tabData").doc(SOURCE_CATALOGUE_DOC).set({
    schemaVersion: SCHEMA_VERSION,
    sources: catalogue,
    count: catalogue.length,
    generatedAt,
  });
  console.log(`\nwrote tabData/${SOURCE_CATALOGUE_DOC} (${catalogue.length} distinct sources)`);

  const batch = db.batch();
  chunks.forEach((c, i) => {
    batch.set(db.collection("tabData").doc(`${CHUNK_DOC_PREFIX}${i}`), {
      schemaVersion: SCHEMA_VERSION,
      index: i,
      count: c.length,
      projects: c,
      generatedAt,
    });
  });
  await batch.commit();
  console.log(`\nwrote ${chunks.length} chunk document(s)`);

  for (const s of stale) {
    await db.collection("tabData").doc(s).delete();
    console.log(`  removed stale tabData/${s}`);
  }

  await db.collection("tabData").doc(MANIFEST_DOC).set({
    schemaVersion: SCHEMA_VERSION,
    chunkCount: chunks.length,
    chunkPrefix: CHUNK_DOC_PREFIX,
    sourceCatalogueDoc: SOURCE_CATALOGUE_DOC,
    sourceCatalogueCount: catalogue.length,
    totalProjects: records.length,
    generatedAt,
    source: "Firestore projects collection, split by byte budget",
  });
  console.log(`wrote tabData/${MANIFEST_DOC}`);
  console.log("\nDone. The dashboard still reads the live collection until it is switched over.");
  process.exit(0);
}

run().catch(err => { console.error("\nFAILED:", err.message); process.exit(1); });
