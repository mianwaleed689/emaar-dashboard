/**
 * cleanup-dead-firestore-collections.js
 *
 * Deletes Firestore collections that are no longer read by any code
 * after Session 10 cleanup (Tasks B, D, and others).
 *
 * SAFETY: This script requires explicit confirmation before deleting
 * ANYTHING. It will show counts first, ask for confirmation, and only
 * delete after you type "DELETE" exactly.
 *
 * Run locally with Firebase Admin SDK credentials:
 *   1. Download service account JSON from Firebase Console
 *      (Project Settings -> Service Accounts -> Generate New Private Key)
 *   2. Save as: scripts/serviceAccountKey.json (already in .gitignore)
 *   3. Run: node scripts/cleanup-dead-firestore-collections.js
 *
 * Collections deleted:
 *   - verifications  (KYC tab removed Session 10 Task D - 548 lines)
 *   - campaigns      (EmailCampaignsTab removed Session 10 Task B - 407 lines)
 *   - (optional) sample platformLeads seeded during dev
 *
 * Preserved fields on users docs:
 *   - users.verified
 *   - users.verifiedLevel
 *   - users.kycStatus
 *   These are harmless dead fields. Not deleted because iterating all
 *   user docs is expensive and the fields don't cause any runtime issues.
 */

const admin = require("firebase-admin");
const readline = require("readline");
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

// ─── Collections to delete ─────────────────────────────────────────────
const COLLECTIONS_TO_DELETE = [
  {
    name: "verifications",
    reason: "KYC feature removed (Session 10 Task D)",
  },
  {
    name: "campaigns",
    reason: "EmailCampaigns tab removed (Session 10 Task B)",
  },
];

// ─── Helper: Count documents in a collection ───────────────────────────
async function countDocs(collectionName) {
  try {
    const snap = await db.collection(collectionName).count().get();
    return snap.data().count;
  } catch (e) {
    // Fallback for older emulators: just get() and count length
    const snap = await db.collection(collectionName).limit(1000).get();
    return snap.size;
  }
}

// ─── Helper: Delete a collection in batches of 500 ─────────────────────
async function deleteCollection(collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    totalDeleted += snapshot.size;
    console.log(`    Deleted ${totalDeleted} docs so far...`);

    if (snapshot.size < batchSize) break;
  }

  return totalDeleted;
}

// ─── Prompt for confirmation ───────────────────────────────────────────
function promptConfirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  DXB Analytics — Dead Firestore Collection Cleanup");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("Project:", serviceAccount.project_id);
  console.log("");

  // Step 1: Report current counts
  console.log("STEP 1: Current document counts");
  console.log("");
  const counts = {};
  for (const col of COLLECTIONS_TO_DELETE) {
    try {
      const count = await countDocs(col.name);
      counts[col.name] = count;
      console.log(`  ${col.name.padEnd(20)} ${count} docs`);
      console.log(`    Reason: ${col.reason}`);
    } catch (e) {
      console.log(`  ${col.name.padEnd(20)} ERROR: ${e.message}`);
      counts[col.name] = 0;
    }
  }

  const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log("");
  console.log(`  TOTAL: ${totalDocs} documents will be deleted`);
  console.log("");

  if (totalDocs === 0) {
    console.log("Nothing to delete. All collections already empty or missing.");
    console.log("");
    process.exit(0);
  }

  // Step 2: Confirmation
  console.log("STEP 2: Confirmation");
  console.log("");
  console.log("  This action is IRREVERSIBLE.");
  console.log("  Type exactly 'DELETE' to proceed, or anything else to cancel:");
  console.log("");
  const confirmation = await promptConfirm("  > ");

  if (confirmation !== "DELETE") {
    console.log("");
    console.log("Cancelled. No changes made.");
    console.log("");
    process.exit(0);
  }

  // Step 3: Execute deletion
  console.log("");
  console.log("STEP 3: Deleting collections...");
  console.log("");

  for (const col of COLLECTIONS_TO_DELETE) {
    if (counts[col.name] === 0) {
      console.log(`  ${col.name}: skipped (empty)`);
      continue;
    }
    console.log(`  ${col.name}:`);
    const deleted = await deleteCollection(col.name);
    console.log(`    ✓ ${deleted} docs deleted`);
    console.log("");
  }

  // Step 4: Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Cleanup complete");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("Next steps:");
  console.log("  - Verify in Firebase Console that collections are empty");
  console.log("  - Delete scripts/serviceAccountKey.json from your machine");
  console.log("    (it should NOT be in git - check .gitignore)");
  console.log("");

  process.exit(0);
}

main().catch((err) => {
  console.error("");
  console.error("FATAL ERROR:", err);
  console.error("");
  process.exit(1);
});