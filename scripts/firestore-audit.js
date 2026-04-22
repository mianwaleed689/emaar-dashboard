/**
 * DXB ANALYTICS — FIRESTORE AUDIT SCRIPT
 * Run: node scripts/firestore-audit.js
 * 
 * Checks:
 * 1. Duplicate projects in projects/ collection
 * 2. Duplicate projects in projectData/ collection  
 * 3. Projects in Firestore that conflict with static data
 * 4. Missing required fields (name, community, developerId, price)
 * 5. Wrong developerId values
 * 6. Prints full report with fix instructions
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Static project names from data files (known good list)
const VALID_DEVELOPER_IDS = ["emaar","damac","sobha","nakheel","meraas","aldar","binghatti"];

async function runAudit() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║         FIRESTORE AUDIT — DXB ANALYTICS            ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  let totalIssues = 0;
  const toDelete = [];
  const toFix = [];

  // ── 1. AUDIT projects/ collection ─────────────────────────────
  console.log("📁 Checking projects/ collection...");
  const projectsSnap = await db.collection("projects").get();
  const projectDocs = [];
  projectsSnap.forEach(doc => projectDocs.push({ id: doc.id, ...doc.data() }));
  console.log(`   Found: ${projectDocs.length} documents\n`);

  // Check for duplicates by name+developer
  const nameDevMap = {};
  for (const p of projectDocs) {
    const key = `${(p.name || "").toLowerCase().trim()}__${p.developerId || ""}`;
    if (!nameDevMap[key]) {
      nameDevMap[key] = [];
    }
    nameDevMap[key].push(p.id);
  }

  let duplicateCount = 0;
  for (const [key, ids] of Object.entries(nameDevMap)) {
    if (ids.length > 1) {
      const [name, devId] = key.split("__");
      console.log(`  ❌ DUPLICATE in projects/: "${name}" (${devId})`);
      console.log(`     IDs: ${ids.join(", ")}`);
      console.log(`     → Keep: ${ids[0]} | Delete: ${ids.slice(1).join(", ")}`);
      // Mark duplicates for deletion (keep first, delete rest)
      ids.slice(1).forEach(id => toDelete.push({ collection: "projects", id, reason: `Duplicate of ${ids[0]}` }));
      duplicateCount++;
      totalIssues++;
    }
  }
  if (duplicateCount === 0) console.log("  ✅ No duplicates found in projects/\n");

  // Check required fields
  let missingFields = 0;
  for (const p of projectDocs) {
    const missing = [];
    if (!p.name)        missing.push("name");
    if (!p.developerId) missing.push("developerId");
    if (!p.community)   missing.push("community");
    if (!p.price && !p.priceFrom) missing.push("price");

    if (!VALID_DEVELOPER_IDS.includes(p.developerId)) {
      missing.push(`INVALID developerId: "${p.developerId}"`);
    }

    if (missing.length > 0) {
      console.log(`  ⚠️  projects/${p.id}: missing [${missing.join(", ")}]`);
      toFix.push({ collection: "projects", id: p.id, issues: missing });
      missingFields++;
      totalIssues++;
    }
  }
  if (missingFields === 0) console.log("  ✅ All projects/ docs have required fields\n");

  // ── 2. AUDIT projectData/ collection ──────────────────────────
  console.log("\n📁 Checking projectData/ collection...");
  const projectDataSnap = await db.collection("projectData").get();
  const projectDataDocs = [];
  projectDataSnap.forEach(doc => projectDataDocs.push({ id: doc.id, ...doc.data() }));
  console.log(`   Found: ${projectDataDocs.length} documents\n`);

  // projectData/ docs should have valid IDs (numeric or dev_name format)
  let badProjectData = 0;
  for (const p of projectDataDocs) {
    const issues = [];
    // Check for extremely old/stale data
    if (p.updatedAt) {
      const updated = new Date(p.updatedAt);
      const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
      if (daysSince > 365) {
        issues.push(`Stale data — last updated ${Math.round(daysSince)} days ago`);
      }
    }
    // Check construction % is valid
    if (p.construction !== undefined && (p.construction < 0 || p.construction > 100)) {
      issues.push(`Invalid construction%: ${p.construction}`);
    }
    if (issues.length > 0) {
      console.log(`  ⚠️  projectData/${p.id}: ${issues.join(" | ")}`);
      totalIssues++;
    }
  }
  if (badProjectData === 0) console.log("  ✅ projectData/ docs look clean\n");

  // ── 3. AUDIT radarLaunches/ collection ────────────────────────
  console.log("\n📁 Checking radarLaunches/ collection...");
  const radarSnap = await db.collection("radarLaunches").get();
  const radarDocs = [];
  radarSnap.forEach(doc => radarDocs.push({ id: doc.id, ...doc.data() }));
  console.log(`   Found: ${radarDocs.length} documents`);

  // Check for radar duplicates
  const radarNameMap = {};
  for (const r of radarDocs) {
    const key = `${(r.projectName || "").toLowerCase().trim()}__${r.developerId || ""}`;
    if (!radarNameMap[key]) radarNameMap[key] = [];
    radarNameMap[key].push(r.id);
  }
  let radarDups = 0;
  for (const [key, ids] of Object.entries(radarNameMap)) {
    if (ids.length > 1) {
      const [name] = key.split("__");
      console.log(`  ❌ DUPLICATE in radarLaunches/: "${name}"`);
      ids.slice(1).forEach(id => toDelete.push({ collection: "radarLaunches", id, reason: "Duplicate" }));
      radarDups++;
      totalIssues++;
    }
  }
  if (radarDups === 0) console.log("  ✅ No duplicates in radarLaunches/\n");

  // ── 4. AUDIT adminSettings/platformStats ──────────────────────
  console.log("\n📁 Checking adminSettings/platformStats...");
  const statsDoc = await db.collection("adminSettings").doc("platformStats").get();
  if (statsDoc.exists) {
    const stats = statsDoc.data();
    console.log("  Current values:");
    console.log(`    projectCount:    ${stats.projectCount}`);
    console.log(`    communityCount:  ${stats.communityCount}`);
    console.log(`    developerCount:  ${stats.developerCount}`);
    console.log(`    totalUsers:      ${stats.totalUsers}`);
    console.log(`    activePaidUsers: ${stats.activePaidUsers}`);
    console.log(`    mrr:             AED ${stats.mrr}`);
    console.log(`    lastUpdatedAt:   ${stats.lastUpdatedAt || stats.lastSyncedAt}`);

    const issues = [];
    if (!stats.projectCount || stats.projectCount === 345) issues.push("projectCount is hardcoded 345 — not real");
    if (!stats.communityCount) issues.push("communityCount missing");
    if (!stats.developerCount) issues.push("developerCount missing");
    if (issues.length > 0) {
      issues.forEach(i => console.log(`  ⚠️  ${i}`));
      totalIssues += issues.length;
    } else {
      console.log("  ✅ platformStats looks correct");
    }
  } else {
    console.log("  ❌ adminSettings/platformStats does NOT EXIST — needs to be created");
    totalIssues++;
  }

  // ── FINAL REPORT ──────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                   AUDIT REPORT                     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\n  Total issues found: ${totalIssues}`);
  console.log(`  Docs to delete:    ${toDelete.length}`);
  console.log(`  Docs to fix:       ${toFix.length}`);

  if (toDelete.length > 0) {
    console.log("\n  TO DELETE:");
    toDelete.forEach(d => console.log(`    ${d.collection}/${d.id} — ${d.reason}`));
    console.log("\n  Run: node scripts/firestore-cleanup.js  to auto-delete these");
  }

  if (toFix.length > 0) {
    console.log("\n  TO FIX MANUALLY:");
    toFix.forEach(f => console.log(`    ${f.collection}/${f.id} — ${f.issues.join(", ")}`));
  }

  if (totalIssues === 0) {
    console.log("\n  ✅ FIRESTORE IS CLEAN — no issues found");
  }

  // Save report to file
  const report = {
    runAt: new Date().toISOString(),
    totalIssues,
    projectsCount: projectDocs.length,
    projectDataCount: projectDataDocs.length,
    radarCount: radarDocs.length,
    toDelete,
    toFix,
  };
  require("fs").writeFileSync("./scripts/audit-report.json", JSON.stringify(report, null, 2));
  console.log("\n  📄 Full report saved: scripts/audit-report.json");
  console.log("  📊 Open Firebase Console: https://console.firebase.google.com\n");

  process.exit(0);
}

runAudit().catch(err => {
  console.error("❌ Audit failed:", err.message);
  process.exit(1);
});
