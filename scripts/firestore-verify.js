/**
 * DXB ANALYTICS — FIRESTORE VERIFY SCRIPT
 * Run AFTER cleanup to confirm everything is correct
 * Run: node scripts/firestore-verify.js
 *
 * Prints a full table of every project in Firestore
 * so you can visually confirm the data is correct.
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function runVerify() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       FIRESTORE VERIFY — DXB ANALYTICS             ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── projects/ collection ──────────────────────────────────────
  const projectsSnap = await db.collection("projects").get();
  const projects = [];
  projectsSnap.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));

  // Group by developer
  const byDev = {};
  for (const p of projects) {
    const dev = p.developerId || "unknown";
    if (!byDev[dev]) byDev[dev] = [];
    byDev[dev].push(p);
  }

  console.log("📁 projects/ collection — ALL DOCUMENTS:\n");
  const devOrder = ["emaar","damac","sobha","nakheel","meraas","aldar","binghatti","unknown"];
  for (const dev of devOrder) {
    const devProjects = byDev[dev];
    if (!devProjects) continue;
    console.log(`  ${dev.toUpperCase()} (${devProjects.length} projects):`);
    console.log(`  ${"─".repeat(90)}`);
    console.log(`  ${"#".padEnd(4)} ${"Name".padEnd(40)} ${"Community".padEnd(28)} ${"Price".padStart(12)} ${"Handover".padEnd(10)}`);
    console.log(`  ${"─".repeat(90)}`);
    devProjects.forEach((p, i) => {
      const name     = (p.name || "MISSING").substring(0, 38).padEnd(40);
      const comm     = (p.community || "MISSING").substring(0, 26).padEnd(28);
      const price    = `AED ${((p.price || p.priceFrom || 0)/1e6).toFixed(1)}M`.padStart(12);
      const handover = (p.handover || "—").padEnd(10);
      console.log(`  ${String(i+1).padEnd(4)} ${name} ${comm} ${price} ${handover}`);
    });
    console.log();
  }

  // ── projectData/ overrides ────────────────────────────────────
  const pdSnap = await db.collection("projectData").get();
  console.log(`📁 projectData/ collection — ${pdSnap.size} admin overrides`);
  if (pdSnap.size > 0) {
    console.log("  (These override static project data — admin edits)");
    pdSnap.forEach(doc => {
      const d = doc.data();
      const fields = Object.keys(d).filter(k => !["updatedAt","updatedBy","syncedBy"].includes(k));
      console.log(`  • ${doc.id}: [${fields.join(", ")}]`);
    });
  }
  console.log();

  // ── adminSettings/platformStats ───────────────────────────────
  const statsDoc = await db.collection("adminSettings").doc("platformStats").get();
  console.log("📊 adminSettings/platformStats:");
  if (statsDoc.exists) {
    const s = statsDoc.data();
    console.log(`  projectCount:    ${s.projectCount}  ${s.projectCount === projects.length ? "✅ matches projects/ count" : `⚠️  should be ${projects.length}`}`);
    console.log(`  communityCount:  ${s.communityCount}`);
    console.log(`  developerCount:  ${s.developerCount}`);
    console.log(`  totalUsers:      ${s.totalUsers}`);
    console.log(`  mrr:             AED ${s.mrr}`);
    console.log(`  lastUpdatedAt:   ${s.lastUpdatedAt || s.lastSyncedAt}`);
  } else {
    console.log("  ❌ Document does not exist");
  }

  // ── Summary ───────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                    SUMMARY                         ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Total projects in Firestore:  ${projects.length}`);
  console.log(`  Admin overrides:              ${pdSnap.size}`);
  for (const [dev, list] of Object.entries(byDev)) {
    console.log(`    ${dev.padEnd(12)}: ${list.length}`);
  }
  console.log("\n  ✅ Verification complete\n");

  process.exit(0);
}

runVerify().catch(err => {
  console.error("❌ Verify failed:", err.message);
  process.exit(1);
});
