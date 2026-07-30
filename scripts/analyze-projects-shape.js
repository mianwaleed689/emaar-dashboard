/**
 * Measure the shape and weight of `projects` documents.
 *
 * Purpose: decide whether the projects listener can be replaced by a slim
 * pre-aggregated list document (the tabData/developerBrands pattern) or whether
 * it needs pagination instead.
 *
 * READ COST: the sample size passed on the command line (default 25).
 *   node scripts/analyze-projects-shape.js [sampleSize]
 *
 * Read-only. Writes a local JSON summary only.
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SAMPLE = Math.max(1, parseInt(process.argv[2] || "25", 10));

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function bytesOf(v) {
  return Buffer.byteLength(JSON.stringify(v === undefined ? null : v), "utf8");
}

async function run() {
  console.log(`Sampling ${SAMPLE} project documents (costs ${SAMPLE} reads)…\n`);
  const snap = await db.collection("projects").limit(SAMPLE).get();

  const fieldBytes = {};   // field -> total bytes across sample
  const fieldCount = {};   // field -> how many docs have it non-empty
  const docSizes = [];

  snap.forEach(d => {
    const data = d.data();
    docSizes.push(bytesOf(data));
    for (const [k, v] of Object.entries(data)) {
      const b = bytesOf(v);
      fieldBytes[k] = (fieldBytes[k] || 0) + b;
      const empty = v === null || v === undefined || v === "" ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === "object" && !Array.isArray(v) && v !== null && Object.keys(v).length === 0);
      if (!empty) fieldCount[k] = (fieldCount[k] || 0) + 1;
    }
  });

  const n = snap.size;
  const avg = docSizes.reduce((a, b) => a + b, 0) / n;
  const max = Math.max(...docSizes);

  console.log("─── DOCUMENT WEIGHT ─────────────────────────────────────────");
  console.log(`  sampled                ${n}`);
  console.log(`  average size           ${avg.toFixed(0)} bytes`);
  console.log(`  largest in sample      ${max} bytes`);
  console.log(`  distinct field names   ${Object.keys(fieldBytes).length}`);
  console.log("");
  console.log(`  PROJECTED for all 1,728 projects:`);
  console.log(`    every field kept     ${((avg * 1728) / 1024).toFixed(0)} KB`);
  console.log(`    (Firestore single-document limit is 1024 KB)`);

  const ranked = Object.entries(fieldBytes)
    .map(([k, b]) => ({ field: k, avgBytes: b / n, populated: fieldCount[k] || 0 }))
    .sort((a, b) => b.avgBytes - a.avgBytes);

  console.log("\n─── HEAVIEST FIELDS (avg bytes per document) ────────────────");
  ranked.slice(0, 20).forEach(f => {
    console.log(
      `  ${f.field.slice(0, 30).padEnd(32)}${f.avgBytes.toFixed(0).padStart(7)} B` +
      `   populated in ${String(f.populated).padStart(3)}/${n}`
    );
  });

  const mostlyEmpty = ranked.filter(f => f.populated <= n * 0.1);
  console.log(`\n  fields populated in 10% or fewer of the sample: ${mostlyEmpty.length}`);
  if (mostlyEmpty.length) {
    console.log("    " + mostlyEmpty.slice(0, 15).map(f => f.field).join(", "));
  }

  const out = {
    sampledAt: new Date().toISOString(),
    sampleSize: n,
    avgBytes: Math.round(avg),
    maxBytes: max,
    projectedAllFieldsKB: Math.round((avg * 1728) / 1024),
    fields: ranked.map(f => ({ ...f, avgBytes: Math.round(f.avgBytes) })),
  };
  const dir = path.join(__dirname, "..", "data-audit");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "projects-shape.json"), JSON.stringify(out, null, 2));
  console.log("\nSaved: data-audit/projects-shape.json");
  process.exit(0);
}

run().catch(err => { console.error("FAILED:", err.message); process.exit(1); });
