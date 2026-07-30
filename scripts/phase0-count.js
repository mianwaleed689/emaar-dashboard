/**
 * PHASE 0 — STEP A: COUNT ONLY
 *
 * Uses Firestore .count() aggregation queries. These are billed at roughly one
 * read per 1,000 index entries scanned, NOT one read per document — so counting
 * every collection here costs a handful of reads, not thousands.
 *
 * Purpose: know the exact read budget BEFORE spending it. Read-only. Writes
 * nothing to Firestore.
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const COLLECTIONS = [
  "neighbourhoodScores",
  "communities",
  "communityData",
  "communityROI",
  "developers",
  "projects",
  "projectData",
  "developments",
  "tabData",
  "cronLogs",
  "notifications",
  "users",
];

async function run() {
  const out = {};
  console.log("collection                 docs");
  console.log("─────────────────────────────────");

  for (const name of COLLECTIONS) {
    try {
      const snap = await db.collection(name).count().get();
      const n = snap.data().count;
      out[name] = n;
      console.log(name.padEnd(24), String(n).padStart(6));
    } catch (err) {
      out[name] = { error: err.message };
      console.log(name.padEnd(24), "  ERROR:", err.message.slice(0, 60));
    }
  }

  const dir = path.join(__dirname, "..", "data-audit");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "counts.json"),
    JSON.stringify({ takenAt: new Date().toISOString(), counts: out }, null, 2)
  );

  const total = Object.values(out).filter(v => typeof v === "number").reduce((a, b) => a + b, 0);
  console.log("─────────────────────────────────");
  console.log("TOTAL DOCS IF ALL READ FULLY:".padEnd(24), String(total).padStart(6));
  console.log("\nSaved to data-audit/counts.json");
  process.exit(0);
}

run().catch(err => { console.error("FAILED:", err.message); process.exit(1); });
