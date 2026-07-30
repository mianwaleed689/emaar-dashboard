/**
 * api/_cron/cron-project-chunks.js
 * Reached via the router: /api/cron?job=project-chunks
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * The dashboard subscribes to the whole `projects` collection — 1,728 documents
 * — on every page load. After the developer-brands fix that is now the single
 * largest read on the site, about 75% of what remains.
 *
 * Unlike developers (2,034 records collapsed to an 83-entry dropdown), projects
 * ARE the content: they are searched, watchlisted, alerted on, mapped, and
 * displayed across four tabs. There is no smaller summary that serves all of
 * that. Measured on 2026-07-30, the collection carries 165 distinct field names
 * averaging 2,396 bytes per document, or about 2,373 KB in total — more than
 * twice Firestore's 1 MiB per-document ceiling, so it cannot become one summary
 * document the way developers did.
 *
 * So instead of shrinking the data, this splits it. Every project, every field,
 * byte-for-byte identical — just packed into a handful of documents rather than
 * fetched one document at a time.
 *
 *     1,728 reads per visitor  ->  1 manifest + ~6 chunks  =  ~7 reads
 *
 * Chunking rather than trimming was chosen deliberately. Trimming fields would
 * have meant deciding which of the 165 each of search, the watchlist detail
 * modal, price alerts, the map and four tabs needs — and being wrong would show
 * a user an empty watchlist rather than an error. Identical data cannot break
 * anything downstream.
 *
 * ── SELF-SIZING ─────────────────────────────────────────────────────────────
 *
 * Chunks are filled to a byte budget, not a fixed count, so the job keeps
 * working as the collection grows instead of silently drifting toward the 1 MiB
 * limit. The manifest records how many chunks exist; the client reads that
 * first, so it never has to guess.
 *
 * ── COST ────────────────────────────────────────────────────────────────────
 *
 * One full read of `projects` (~1,728 reads) per run, once daily — less than a
 * single visitor was costing before.
 */

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "dxb-analytics",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

/**
 * 1 — chunks carry each project's `sources` array inline.
 * 2 — `sources` is replaced by `_srcRefs` (indices into a shared catalogue
 *     document) and rehydrated in the browser.
 *
 * Clients accept <= their own version, so a client that only understands 1 will
 * fall back to the live collection rather than render projects with no sources.
 */
const SCHEMA_VERSION = 2;

const SOURCE_CATALOGUE_DOC = "projectsSourceCatalogue";

/**
 * Replace every project's `sources` array with indices into a shared catalogue.
 *
 * MEASURED across all 1,728 projects on 2026-07-30: `sources` is 43.6% of the
 * entire collection — 2.67 MB — and 86% of that is literal repetition. There are
 * 13,982 source entries but only 1,808 distinct ones; "DLD Rent Contracts 2026",
 * "Google Maps API - Distance Matrix" and three others each appear ~1,530 times,
 * byte-for-byte identical.
 *
 * Storing each distinct citation once and referencing it cuts the transported
 * payload from 10,124 KB to 7,805 KB plus a 377 KB catalogue — 2,319 KB saved,
 * and 26 chunks become 19.
 *
 * This is a TRANSPORT optimisation only. The `projects` collection is never
 * modified, and the browser rebuilds `sources` into its original shape before
 * any component sees it — verified byte-identical after a round trip. No tab
 * needs to know this happened.
 *
 * @returns {{records: Array<object>, catalogue: Array<object>}}
 */
function dehydrateSources(records) {
  const catalogue = [];
  const index = new Map();

  const out = records.map(r => {
    if (!Array.isArray(r.sources)) return r;
    const copy = { ...r };
    copy._srcRefs = r.sources.map(s => {
      const key = JSON.stringify(s);
      if (!index.has(key)) {
        index.set(key, catalogue.length);
        catalogue.push(s);
      }
      return index.get(key);
    });
    delete copy.sources;
    return copy;
  });

  return { records: out, catalogue };
}

/** Firestore's hard limit is 1 MiB. Stay well under it — see splitIntoChunks. */
const CHUNK_BUDGET_BYTES = 400 * 1024;

/** Refuse to write a chunk above this. Leaves room for Firestore's own overhead. */
const CHUNK_HARD_LIMIT_BYTES = 800 * 1024;

const MANIFEST_DOC = "projectsManifest";
const CHUNK_DOC_PREFIX = "projectsChunk";

/**
 * Pack records into chunks that each stay under the byte budget.
 *
 * A single record larger than the budget still gets its own chunk rather than
 * being dropped — losing a project silently would be worse than an oversized
 * document, and the hard-limit check below will surface it loudly.
 *
 * @param {Array<object>} records
 * @returns {Array<Array<object>>}
 */
function splitIntoChunks(records, budget = CHUNK_BUDGET_BYTES) {
  const chunks = [];
  let current = [];
  let currentBytes = 0;

  for (const rec of records) {
    const size = Buffer.byteLength(JSON.stringify(rec), "utf8");
    if (current.length > 0 && currentBytes + size > budget) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(rec);
    currentBytes += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

module.exports = async function handler(req, res) {
  const startedAt = new Date().toISOString();
  const db = getDb();

  try {
    const snap = await db.collection("projects").get();
    const rawRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const { records, catalogue } = dehydrateSources(rawRecords);
    const chunks = splitIntoChunks(records);

    /* Verify every chunk before writing ANY of them. A half-written set would
       leave the client reading a mix of old and new. */
    const sizes = chunks.map(c => Buffer.byteLength(JSON.stringify({ projects: c }), "utf8"));
    const oversized = sizes.filter(b => b > CHUNK_HARD_LIMIT_BYTES);
    if (oversized.length) {
      throw new Error(
        `${oversized.length} chunk(s) exceed ${Math.round(CHUNK_HARD_LIMIT_BYTES / 1024)} KB ` +
        `(largest ${Math.round(Math.max(...sizes) / 1024)} KB). Lower CHUNK_BUDGET_BYTES.`
      );
    }

    const totalInChunks = chunks.reduce((n, c) => n + c.length, 0);
    if (totalInChunks !== records.length) {
      throw new Error(`Chunking lost records: ${totalInChunks} packed vs ${records.length} read`);
    }

    /* Write the source catalogue and chunks first, manifest last. The manifest
       is what the client trusts, so publishing it only after everything it names
       is in place means a reader never sees a manifest pointing at a document
       that does not exist yet. */
    await db.collection("tabData").doc(SOURCE_CATALOGUE_DOC).set({
      schemaVersion: SCHEMA_VERSION,
      sources: catalogue,
      count: catalogue.length,
      generatedAt: startedAt,
    });

    const batch = db.batch();
    chunks.forEach((c, i) => {
      batch.set(db.collection("tabData").doc(`${CHUNK_DOC_PREFIX}${i}`), {
        schemaVersion: SCHEMA_VERSION,
        index: i,
        count: c.length,
        projects: c,
        generatedAt: startedAt,
      });
    });
    await batch.commit();

    /* Clear any chunks left over from a previous, longer run so stale projects
       cannot reappear if the collection shrinks. */
    const stale = [];
    for (let i = chunks.length; i < chunks.length + 10; i++) {
      const ref = db.collection("tabData").doc(`${CHUNK_DOC_PREFIX}${i}`);
      const doc = await ref.get();
      if (!doc.exists) break;
      stale.push(i);
      await ref.delete();
    }

    await db.collection("tabData").doc(MANIFEST_DOC).set({
      schemaVersion: SCHEMA_VERSION,
      chunkCount: chunks.length,
      chunkPrefix: CHUNK_DOC_PREFIX,
      sourceCatalogueDoc: SOURCE_CATALOGUE_DOC,
      sourceCatalogueCount: catalogue.length,
      totalProjects: records.length,
      generatedAt: startedAt,
      source: "Firestore projects collection, split by byte budget",
    });

    const totalKB = Math.round(sizes.reduce((a, b) => a + b, 0) / 1024);
    await db.collection("cronLogs").add({
      type: "project-chunks",
      chunkCount: chunks.length,
      totalProjects: records.length,
      staleChunksRemoved: stale.length,
      totalKB,
      ok: true,
      syncedAt: startedAt,
    });

    return res.status(200).json({
      success: true,
      message: `Packed ${records.length} projects into ${chunks.length} chunks (${totalKB} KB). ` +
               `Reads per visitor: ${records.length} -> ${chunks.length + 1}`,
      chunkCount: chunks.length,
      totalProjects: records.length,
      staleChunksRemoved: stale.length,
      totalKB,
      generatedAt: startedAt,
    });
  } catch (err) {
    try {
      await db.collection("cronLogs").add({
        type: "project-chunks",
        ok: false,
        error: String(err && err.message ? err.message : err),
        syncedAt: startedAt,
      });
    } catch (logErr) {
      console.error("[project-chunks] could not write failure to cronLogs:", logErr);
    }
    console.error("[project-chunks] failed:", err);
    return res.status(500).json({ success: false, error: String(err && err.message ? err.message : err) });
  }
};

module.exports.splitIntoChunks = splitIntoChunks;
module.exports.dehydrateSources = dehydrateSources;
module.exports.SOURCE_CATALOGUE_DOC = SOURCE_CATALOGUE_DOC;
module.exports.CHUNK_BUDGET_BYTES = CHUNK_BUDGET_BYTES;
module.exports.MANIFEST_DOC = MANIFEST_DOC;
module.exports.CHUNK_DOC_PREFIX = CHUNK_DOC_PREFIX;
module.exports.SCHEMA_VERSION = SCHEMA_VERSION;
