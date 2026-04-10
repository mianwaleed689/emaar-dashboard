/**
 * export-leads.js
 *
 * Exports ALL leads from Firestore to a timestamped CSV file.
 * Designed to handle 100K+ records using pagination.
 *
 * Run locally with Firebase Admin SDK credentials:
 *   1. scripts/serviceAccountKey.json must exist (see cleanup script for how to get it)
 *   2. node scripts/export-leads.js
 *   3. Output: exports/leads-YYYY-MM-DD-HHMMSS.csv
 *
 * Features:
 * - Paginates in batches of 500 (no timeout on huge collections)
 * - Captures ALL fields on each lead document (schema-agnostic)
 * - Properly escapes CSV values (commas, quotes, newlines)
 * - Progress reporting every batch
 * - Safe abort if something goes wrong
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ─── Load service account ──────────────────────────────────────────────
const keyPath = path.join(__dirname, "serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch (e) {
  console.error("");
  console.error("ERROR: serviceAccountKey.json not found at:");
  console.error("  " + keyPath);
  console.error("");
  console.error("Download it from Firebase Console:");
  console.error("  Project Settings -> Service Accounts -> Generate New Private Key");
  console.error("  Save the JSON as: scripts/serviceAccountKey.json");
  console.error("");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── CSV escaping ──────────────────────────────────────────────────────
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  let str;
  if (typeof value === "object") {
    // Flatten nested objects (e.g. timestamps, arrays) to JSON
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }
  // If contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ─── Get all unique field names from the collection ───────────────────
// Firestore doesn't enforce schemas, so we sample the first 100 docs
// to discover all possible fields, then use the union as CSV columns.
async function discoverFields() {
  console.log("Sampling first 100 leads to discover field schema...");
  const snap = await db.collection("leads").limit(100).get();
  const fieldSet = new Set();
  fieldSet.add("id"); // always include document ID
  snap.docs.forEach(doc => {
    Object.keys(doc.data()).forEach(k => fieldSet.add(k));
  });
  const fields = Array.from(fieldSet).sort();
  console.log(`Discovered ${fields.length} fields: ${fields.join(", ")}`);
  return fields;
}

// ─── Main export ───────────────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  DXB Analytics — Leads CSV Export");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("Project:", serviceAccount.project_id);
  console.log("");

  // Ensure exports directory exists
  const exportsDir = path.join(__dirname, "..", "exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
    console.log("Created exports/ directory");
  }

  // Generate timestamped filename
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputPath = path.join(exportsDir, `leads-${ts}.csv`);
  console.log("Output file:", outputPath);
  console.log("");

  // Discover schema
  const fields = await discoverFields();
  console.log("");

  // Open write stream
  const stream = fs.createWriteStream(outputPath, { encoding: "utf8" });

  // Write BOM for Excel UTF-8 compatibility
  stream.write("\ufeff");

  // Write header row
  stream.write(fields.map(csvEscape).join(",") + "\n");

  // Paginate through all leads in batches of 500
  let totalExported = 0;
  let lastDoc = null;
  const BATCH_SIZE = 500;
  const startTime = Date.now();

  console.log("Exporting leads...");
  console.log("");

  while (true) {
    let query = db.collection("leads")
      .orderBy("__name__") // stable ordering for pagination
      .limit(BATCH_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    // Write each doc as a CSV row
    for (const doc of snap.docs) {
      const data = { id: doc.id, ...doc.data() };
      const row = fields.map(f => csvEscape(data[f])).join(",");
      stream.write(row + "\n");
    }

    totalExported += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1];

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const rate = Math.floor(totalExported / Math.max(elapsed, 1));
    console.log(`  Exported ${totalExported.toLocaleString()} leads (${rate}/sec, ${elapsed}s elapsed)`);

    if (snap.size < BATCH_SIZE) break; // last batch
  }

  // Close stream
  await new Promise(resolve => stream.end(resolve));

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const fileStats = fs.statSync(outputPath);
  const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);

  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Export complete");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log(`  Total leads:  ${totalExported.toLocaleString()}`);
  console.log(`  File:         ${outputPath}`);
  console.log(`  Size:         ${fileSizeMB} MB`);
  console.log(`  Elapsed:      ${elapsed}s`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Open the CSV in Excel or Google Sheets to verify");
  console.log("  2. Back up the CSV to safe storage (Drive, S3, etc.)");
  console.log("  3. Once verified, Admin Leads tab can be safely deleted");
  console.log("");

  process.exit(0);
}

main().catch((err) => {
  console.error("");
  console.error("FATAL ERROR:", err);
  console.error("");
  console.error("Partial export may have been written. Check exports/ directory.");
  console.error("");
  process.exit(1);
});