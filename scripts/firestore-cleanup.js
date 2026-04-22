/**
 * DXB ANALYTICS — FIRESTORE CLEANUP SCRIPT
 * Run AFTER firestore-audit.js
 * Run: node scripts/firestore-cleanup.js
 *
 * Reads audit-report.json and deletes all duplicate documents.
 * Safe — only deletes what the audit flagged.
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function runCleanup() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       FIRESTORE CLEANUP — DXB ANALYTICS            ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Load audit report
  if (!fs.existsSync("./scripts/audit-report.json")) {
    console.error("❌ No audit-report.json found. Run firestore-audit.js first.");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync("./scripts/audit-report.json", "utf8"));

  if (report.toDelete.length === 0) {
    console.log("✅ Nothing to delete — Firestore is already clean.");
    process.exit(0);
  }

  console.log(`  Found ${report.toDelete.length} documents to delete:\n`);
  report.toDelete.forEach(d => console.log(`    ${d.collection}/${d.id} — ${d.reason}`));

  console.log("\n  Starting deletion...\n");

  let deleted = 0;
  let failed = 0;

  for (const item of report.toDelete) {
    try {
      await db.collection(item.collection).doc(item.id).delete();
      console.log(`  ✅ Deleted: ${item.collection}/${item.id}`);
      deleted++;
    } catch (err) {
      console.log(`  ❌ Failed: ${item.collection}/${item.id} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n  Deleted: ${deleted} | Failed: ${failed}`);

  // Update platformStats with correct counts
  console.log("\n  Updating adminSettings/platformStats...");
  try {
    const projectsSnap = await db.collection("projects").get();
    const realCount = projectsSnap.size;

    await db.collection("adminSettings").doc("platformStats").set({
      projectCount:    realCount,
      communityCount:  49,
      developerCount:  7,
      lastUpdatedAt:   new Date().toISOString(),
      updatedBy:       "cleanup_script",
    }, { merge: true });

    console.log(`  ✅ platformStats updated — projectCount: ${realCount}`);
  } catch (err) {
    console.log(`  ⚠️  Could not update platformStats: ${err.message}`);
  }

  console.log("\n  ✅ Cleanup complete. Run audit again to verify.\n");
  process.exit(0);
}

runCleanup().catch(err => {
  console.error("❌ Cleanup failed:", err.message);
  process.exit(1);
});
