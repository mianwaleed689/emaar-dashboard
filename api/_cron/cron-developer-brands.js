/**
 * api/_cron/cron-developer-brands.js
 * Reached via the router: /api/cron?job=developer-brands
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * The dashboard needs a list of developer brands to populate a filter dropdown.
 * To build it, the BROWSER was downloading the entire `developers` collection —
 * 2,034 documents — then discarding all but the published+verified ones and
 * grouping the survivors by parent brand.
 *
 * That aggregation is deterministic: it produces the same answer for every
 * visitor, every time. But it was being recomputed client-side on every single
 * page load, at a cost of 2,034 Firestore reads per visit. The free tier allows
 * 50,000 reads/day, so roughly eleven page views exhausted the entire daily
 * quota and the live site went dark until the next reset at midnight Pacific.
 *
 * This job does the work ONCE per day, server-side, and writes the finished
 * list to a single document: `tabData/developerBrands`.
 *
 * Result: 2,034 reads per visitor  →  1 read per visitor.
 *
 * It is the same pattern already used successfully by `tabData/eiborRates`.
 *
 * ── KEEPING THIS IN STEP WITH THE CLIENT ───────────────────────────────────
 *
 * The grouping below is a deliberate copy of the logic in the `developers`
 * onSnapshot handler in src/pages/EmaarDashboardV2.jsx (search for
 * "GROUP BY PARENT BRAND"). That client code remains in place as a fallback for
 * the case where this document has not been written yet.
 *
 * If you change the shape here, change it there too — and vice versa. The
 * `schemaVersion` field below exists so a mismatch can be detected rather than
 * silently serving the wrong shape.
 *
 * ── COST ───────────────────────────────────────────────────────────────────
 *
 * One full read of `developers` (~2,034 reads) per run, once daily. That is
 * cheaper than a single visitor was costing before.
 *
 * ── SCHEDULE ───────────────────────────────────────────────────────────────
 *
 * vercel.json runs this at 08:20 UTC daily. That time is chosen deliberately:
 * the Firestore free-tier quota resets at midnight US Pacific, which is 07:00
 * UTC during PDT but 08:00 UTC during PST. 08:20 UTC lands after the reset in
 * BOTH halves of the year, so this job always spends from a fresh quota rather
 * than the previous day's exhausted one.
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

/** Bump when the output shape changes, so the client can detect a stale doc. */
const SCHEMA_VERSION = 1;

const TIER_RANK = { "tier-1": 1, "tier-2": 2, "tier-3": 3 };

/**
 * Normalise the `tier` field to the canonical "tier-N" form.
 *
 * MEASURED 2026-07-30, across all 2,034 developer records — the field is stored
 * in two incompatible formats:
 *
 *     "unclassified"  1751        "tier-2"   10
 *     "tier-3"          30        "3"         9
 *     "2"               10        "1"         7
 *
 * Note there is not a single record spelled "tier-1". The seven genuine tier-1
 * developers are stored as the bare string "1".
 *
 * The dashboard ranks with { "tier-1": 1, "tier-2": 2, "tier-3": 3 } and falls
 * back to 9 for anything it does not recognise — so 1,777 of 1,817 brands were
 * unrankable, and Nakheel (346 projects), DAMAC (200) and Aldar (150) all sorted
 * BELOW Lootah Real Estate (11 projects) purely because Lootah happened to be
 * spelled "tier-2".
 *
 * "unclassified" is treated as ABSENT rather than as a tier. It is a placeholder
 * meaning "nobody has classified this yet", and treating it as a value is what
 * pinned Emaar Properties — 462 projects across 11 registry entities — to
 * "unclassified" and buried it at rank 41.
 *
 * @returns {string|null} "tier-1" | "tier-2" | "tier-3" | null
 */
function normaliseTier(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || s === "unclassified" || s === "none" || s === "null") return null;
  const n = s.replace(/^tier[\s_-]*/, "");
  return (n === "1" || n === "2" || n === "3") ? `tier-${n}` : null;
}

/** Lower rank number = better tier. Untiered sorts last. */
function tierRankOf(tier) {
  return TIER_RANK[tier] ?? 9;
}

/**
 * Is this brand worth putting in a filter dropdown?
 *
 * MEASURED 2026-07-30: of 1,817 brands, 1,751 have ZERO projects. They are
 * registry-only entries — companies that hold a DLD licence but have nothing
 * built or selling. Listing them made the developer filter 1,817 items long and
 * pushed every recognisable name far down it.
 *
 * They are NOT deleted. The full `developers` collection is untouched and still
 * available to the admin panel and directory screens; this only decides what
 * reaches the dropdown.
 */
function isSelectable(brand) {
  return (Number(brand.totalProjects) || 0) > 0 || TIER_RANK[brand.tier] !== undefined;
}

/**
 * Group raw developer records by parent brand.
 *
 * The DLD registry lists every SPV/subsidiary separately (e.g. 22 separate
 * DAMAC entities). Users want to filter by the real company, so children are
 * folded into their parent brand and their project counts summed.
 *
 * @param {Array<{id: string, data: object}>} records
 * @returns {Array<object>} sorted brand records
 */
function groupByParentBrand(records) {
  const brandMap = new Map();

  for (const { id, data } of records) {
    // Only published, verified (tier-classified, active, not-merged) entities.
    if (data.visibility !== "published") continue;
    if (data.verified !== true) continue;

    const brand = data.parentBrand || data.name;
    if (!brand) continue;

    const childName = String(data.name || "").toLowerCase().trim();
    const existing = brandMap.get(brand);

    if (!existing) {
      brandMap.set(brand, {
        id: data.parentBrand ? brand.toLowerCase().replace(/[^\w]+/g, "-") : id,
        name: brand,
        parentBrand: brand,
        totalProjects: Number(data.totalProjects) || 0,
        tier: normaliseTier(data.tier),
        reliability: data.reliability ?? null,
        classification: data.classification ?? null,
        description: data.description ?? null,
        ceo: data.ceo ?? null,
        founded: data.founded ?? null,
        headquarters: data.headquarters ?? null,
        website: data.website ?? null,
        color: data.color ?? null,
        reraLicenseNumber: data.reraLicenseNumber ?? null,
        nameAr: data.nameAr ?? null,
        communities: Array.isArray(data.communities) ? [...data.communities] : [],
        /* Child entity names, used by the client for filter matching. */
        _childNames: childName ? [childName] : [],
        _entityCount: 1,
      });
      continue;
    }

    existing.totalProjects += Number(data.totalProjects) || 0;
    existing._entityCount += 1;
    if (childName && !existing._childNames.includes(childName)) {
      existing._childNames.push(childName);
    }
    if (Array.isArray(data.communities)) {
      for (const c of data.communities) {
        if (!existing.communities.includes(c)) existing.communities.push(c);
      }
    }
    /* First non-empty value wins for descriptive fields. */
    if (!existing.description && data.description) existing.description = data.description;
    if (!existing.ceo && data.ceo) existing.ceo = data.ceo;
    if (!existing.founded && data.founded) existing.founded = data.founded;
    if (!existing.headquarters && data.headquarters) existing.headquarters = data.headquarters;
    if (!existing.website && data.website) existing.website = data.website;
    if (!existing.color && data.color) existing.color = data.color;
    /* Tier: keep the BEST tier found across the brand's entities, not the first.
       "First non-empty wins" is what pinned Emaar to "unclassified" — one of its
       eleven registry entities lacked a tier and happened to be read first. */
    const incomingTier = normaliseTier(data.tier);
    if (incomingTier && tierRankOf(incomingTier) < tierRankOf(existing.tier)) {
      existing.tier = incomingTier;
    }
    if ((Number(data.reliability) || 0) > (Number(existing.reliability) || 0)) {
      existing.reliability = data.reliability;
    }
  }

  const devs = [...brandMap.values()];
  devs.sort((a, b) => {
    const ta = tierRankOf(a.tier);
    const tb = tierRankOf(b.tier);
    if (ta !== tb) return ta - tb;
    const pb = Number(b.totalProjects) || 0;
    const pa = Number(a.totalProjects) || 0;
    if (pb !== pa) return pb - pa;
    return (a.name || "").localeCompare(b.name || "");
  });
  return devs;
}

/**
 * Build the exact document that gets written to tabData/developerBrands.
 *
 * Shared by the cron handler and by scripts/backfill-developer-brands.js, so the
 * two can never drift apart and produce different documents.
 *
 * @param {Array<{id: string, data: object}>} records raw developer documents
 * @param {string} generatedAt ISO timestamp
 */
function buildPayload(records, generatedAt) {
  const allBrands = groupByParentBrand(records);

  /* Publish only the brands a user could meaningfully pick. Nothing is deleted —
     the held-back count travels with the document so this is never a silent
     truncation. See isSelectable() for the measured reasoning. */
  const brands = allBrands.filter(isSelectable);

  return {
    schemaVersion: SCHEMA_VERSION,
    brands,
    brandCount: brands.length,
    /* Full accounting, so a shrinking dropdown is always explainable. */
    totalBrandCount: allBrands.length,
    heldBackCount: allBrands.length - brands.length,
    heldBackReason: "no projects and no recognised tier — registry-only licence holders",
    sourceDocCount: records.length,
    publishedVerifiedCount: allBrands.reduce((n, b) => n + (b._entityCount || 0), 0),
    generatedAt,
    source: "Firestore developers collection, grouped by parentBrand",
  };
}

/**
 * Firestore caps documents at 1 MiB. Refuse to write near the ceiling rather
 * than fail mid-request — the client fallback keeps working, which is strictly
 * better than a corrupt or truncated summary.
 *
 * @returns {number} payload size in bytes
 */
function assertWithinDocumentLimit(payload) {
  const bytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (bytes > 900 * 1024) {
    throw new Error(
      `Aggregated brand list is ${Math.round(bytes / 1024)} KB, too close to the ` +
      `1 MiB document limit. Split it before enabling this job.`
    );
  }
  return bytes;
}

module.exports = async function handler(req, res) {
  const startedAt = new Date().toISOString();
  const db = getDb();

  try {
    const snap = await db.collection("developers").get();
    const records = snap.docs.map(d => ({ id: d.id, data: d.data() }));

    const payload = buildPayload(records, startedAt);
    const brands = payload.brands;
    const allBrandsLength = payload.totalBrandCount;
    const heldBack = payload.heldBackCount;
    const bytes = assertWithinDocumentLimit(payload);

    await db.collection("tabData").doc("developerBrands").set(payload);

    await db.collection("cronLogs").add({
      type: "developer-brands",
      brandCount: brands.length,
      totalBrandCount: allBrandsLength,
      heldBackCount: heldBack,
      sourceDocCount: snap.size,
      bytes,
      ok: true,
      syncedAt: startedAt,
    });

    return res.status(200).json({
      success: true,
      message: `Grouped ${snap.size} developer records into ${allBrandsLength} brands; ` +
               `published ${brands.length} selectable, held back ${heldBack} (${Math.round(bytes / 1024)} KB)`,
      brandCount: brands.length,
      totalBrandCount: allBrandsLength,
      heldBackCount: heldBack,
      sourceDocCount: snap.size,
      bytes,
      generatedAt: startedAt,
    });
  } catch (err) {
    /* Always leave a trail. The DLD cron failed silently for four months
       because it logged nothing on failure — do not repeat that. */
    try {
      await db.collection("cronLogs").add({
        type: "developer-brands",
        ok: false,
        error: String(err && err.message ? err.message : err),
        syncedAt: startedAt,
      });
    } catch (logErr) {
      console.error("[developer-brands] could not write failure to cronLogs:", logErr);
    }
    console.error("[developer-brands] failed:", err);
    return res.status(500).json({ success: false, error: String(err && err.message ? err.message : err) });
  }
};

/* Exported for tests and for the one-off backfill script. */
module.exports.groupByParentBrand = groupByParentBrand;
module.exports.buildPayload = buildPayload;
module.exports.assertWithinDocumentLimit = assertWithinDocumentLimit;
module.exports.normaliseTier = normaliseTier;
module.exports.isSelectable = isSelectable;
module.exports.SCHEMA_VERSION = SCHEMA_VERSION;
