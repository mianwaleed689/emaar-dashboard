/**
 * PHASE 0 — read each collection ONCE, cache locally, then analyse offline.
 *
 * This exists because the Firestore free tier allows 50,000 reads/day and
 * repeatedly querying while investigating is what took the live site down.
 * Every question about this data — duplicates, field coverage, filter options,
 * coordinate coverage, tier formats — is answered from these local files at
 * zero further cost.
 *
 *   node scripts/cache-collections.js              # cache anything not yet cached
 *   node scripts/cache-collections.js --refresh    # re-read everything
 *
 * Read-only. Never writes to Firestore.
 *
 * READ COST (full refresh):
 *   projects 1,728 + developers 2,034 + neighbourhoodScores 281
 *   + communities 253 + communityROI 12 + communityData 11  =  ~4,319 reads
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const REFRESH = process.argv.includes("--refresh");

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const COLLECTIONS = [
  "projects",
  "developers",
  "neighbourhoodScores",
  "communities",
  "communityROI",
  "communityData",
];

const DIR = path.join(__dirname, "..", "data-audit", "cache");

async function run() {
  fs.mkdirSync(DIR, { recursive: true });
  let totalReads = 0;

  for (const name of COLLECTIONS) {
    const file = path.join(DIR, `${name}.json`);
    if (fs.existsSync(file) && !REFRESH) {
      const cached = JSON.parse(fs.readFileSync(file, "utf8"));
      console.log(`${name.padEnd(22)} cached (${cached.docs.length} docs) — skipping, use --refresh to re-read`);
      continue;
    }

    process.stdout.write(`${name.padEnd(22)} reading… `);
    const snap = await db.collection(name).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    totalReads += snap.size;

    fs.writeFileSync(file, JSON.stringify({
      collection: name,
      readAt: new Date().toISOString(),
      count: docs.length,
      docs,
    }, null, 2));

    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    console.log(`${snap.size} docs -> data-audit/cache/${name}.json (${kb} KB)`);
  }

  console.log(`\nreads spent this run: ${totalReads}`);
  console.log("All further analysis can now run offline against data-audit/cache/.");
  process.exit(0);
}

run().catch(err => {
  console.error("FAILED:", err.message);
  if (String(err.message).includes("RESOURCE_EXHAUSTED")) {
    console.error("Daily read quota exhausted — resets at midnight US Pacific.");
  }
  process.exit(1);
});
