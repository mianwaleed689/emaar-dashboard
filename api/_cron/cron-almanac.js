/**
 * api/_cron/cron-almanac.js
 * Reached via the router: /api/cron?job=almanac
 *
 * ── WHAT THIS DOES ──────────────────────────────────────────────────────────
 *
 * Compiles the `almanacEntries` collection into a single document,
 * `tabData/almanac`, which is what the browser reads.
 *
 * The almanac is designed to grow to a few hundred entries — one per notable
 * month across twenty-odd years. Read as a collection that is a few hundred
 * document reads on every page view, which is exactly the pattern that emptied
 * this project's Firestore quota inside an hour and took the site down. Compiled
 * to one document it is one read, however many entries it holds.
 *
 * Same approach as tabData/developerBrands and the project chunks.
 *
 * ── THE GATE ────────────────────────────────────────────────────────────────
 *
 * Every entry is validated before publication. An entry without a named source
 * is REJECTED — not published with a warning, not marked draft. It is reported
 * in the response and in cronLogs so the author can fix it, and the rest of the
 * almanac publishes without it.
 *
 * This is deliberate. The almanac's whole value is that a reader can check any
 * claim in it. One unsourced entry costs more credibility than a hundred
 * sourced ones earn, so the compiler is the place that cannot be talked round.
 *
 * ── COST ────────────────────────────────────────────────────────────────────
 *
 * One read per entry, once daily. Replaces one read per entry per visitor.
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

const SCHEMA_VERSION = 1;
const SOURCE_COLLECTION = "almanacEntries";
const COMPILED_DOC = "almanac";

const MOMENT_TYPES = ["reform", "record", "shock", "recovery", "milestone"];
const ID_PATTERN = /^\d{4}(-\d{2})?$|^\d{4}\s*[–-]\s*\d{4}$/;

/**
 * Validation, duplicated here rather than imported because api/ is CommonJS and
 * src/ is ESM. src/utils/almanacSchema.js is the canonical version and the admin
 * form uses it; if you change a rule, change both. The duplication is deliberate
 * and small — the alternative is a build step for the serverless functions.
 */
function validateEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== "object") return { ok: false, errors: ["not an object"] };

  for (const k of ["id", "label", "moment", "headline"]) {
    if (!String(entry[k] ?? "").trim()) errors.push(`${k} is required`);
  }
  if (entry.id && !ID_PATTERN.test(String(entry.id).trim())) {
    errors.push(`id "${entry.id}" must be YYYY, YYYY-MM or YYYY–YYYY`);
  }
  if (entry.moment && !MOMENT_TYPES.includes(entry.moment)) {
    errors.push(`moment must be one of ${MOMENT_TYPES.join(", ")}`);
  }

  const sources = Array.isArray(entry.sources)
    ? entry.sources.map(s => String(s).trim()).filter(Boolean)
    : [];
  if (!sources.length) errors.push("at least one source is required");
  sources.forEach(s => { if (s.length < 8) errors.push(`source "${s}" is too short`); });

  return { ok: errors.length === 0, errors };
}

function sortKey(e) {
  const id = String(e.id || "");
  const month = /^\d{4}-(\d{2})$/.test(id) ? id.slice(5, 7) : "00";
  return `${id.slice(0, 4)}-${month}`;
}

module.exports = async function handler(req, res) {
  const startedAt = new Date().toISOString();
  const db = getDb();

  try {
    const snap = await db.collection(SOURCE_COLLECTION).get();
    const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const published = [];
    const rejected = [];

    for (const entry of raw) {
      if (entry.status === "draft") {
        rejected.push({ id: entry.id, reason: "marked draft" });
        continue;
      }
      const { ok, errors } = validateEntry(entry);
      if (!ok) {
        rejected.push({ id: entry.id, reason: errors.join("; ") });
        continue;
      }
      published.push(entry);
    }

    published.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

    const years = new Set(published.map(e => String(e.id).slice(0, 4)));
    const sources = new Set();
    published.forEach(e => (e.sources || []).forEach(s => sources.add(s)));

    const payload = {
      schemaVersion: SCHEMA_VERSION,
      entries: published,
      entryCount: published.length,
      yearCount: years.size,
      sourceCount: sources.size,
      /* Rejections travel with the document so the gap is visible in the admin
         panel rather than only in a log nobody opens. */
      rejectedCount: rejected.length,
      rejected,
      earliest: published[0]?.label ?? null,
      latest: published[published.length - 1]?.label ?? null,
      generatedAt: startedAt,
    };

    const bytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
    if (bytes > 900 * 1024) {
      throw new Error(
        `Compiled almanac is ${Math.round(bytes / 1024)} KB, too close to the 1 MiB ` +
        `document limit. Split it by decade before adding more.`
      );
    }

    await db.collection("tabData").doc(COMPILED_DOC).set(payload);

    await db.collection("cronLogs").add({
      type: "almanac",
      entryCount: published.length,
      rejectedCount: rejected.length,
      rejected: rejected.slice(0, 20),
      bytes,
      ok: true,
      syncedAt: startedAt,
    });

    return res.status(200).json({
      success: true,
      message: `Published ${published.length} almanac entries across ${years.size} years` +
               (rejected.length ? `; rejected ${rejected.length}` : ""),
      entryCount: published.length,
      rejectedCount: rejected.length,
      rejected,
      bytes,
      generatedAt: startedAt,
    });
  } catch (err) {
    try {
      await db.collection("cronLogs").add({
        type: "almanac",
        ok: false,
        error: String(err && err.message ? err.message : err),
        syncedAt: startedAt,
      });
    } catch (logErr) {
      console.error("[almanac] could not write failure to cronLogs:", logErr);
    }
    console.error("[almanac] failed:", err);
    return res.status(500).json({ success: false, error: String(err && err.message ? err.message : err) });
  }
};

module.exports.validateEntry = validateEntry;
module.exports.SOURCE_COLLECTION = SOURCE_COLLECTION;
module.exports.COMPILED_DOC = COMPILED_DOC;
module.exports.SCHEMA_VERSION = SCHEMA_VERSION;
