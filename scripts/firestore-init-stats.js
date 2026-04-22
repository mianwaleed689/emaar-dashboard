/**
 * DXB ANALYTICS — CREATE platformStats in Firestore
 * Run: node scripts/firestore-init-stats.js
 * 
 * Creates adminSettings/platformStats with real values.
 * This fixes the stats bar showing zeros in the app.
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initStats() {
  console.log("\n Creating adminSettings/platformStats...\n");

  // Count real projects in Firestore
  const projectsSnap = await db.collection("projects").get();
  const fsProjects = projectsSnap.size; // 48

  // Count users
  const usersSnap = await db.collection("users").get();
  const users = [];
  usersSnap.forEach(doc => users.push(doc.data()));

  const totalUsers      = users.length;
  const paidUsers       = users.filter(u => ["pro","enterprise"].includes(u.tier));
  const proUsers        = users.filter(u => u.tier === "pro").length;
  const enterpriseUsers = users.filter(u => u.tier === "enterprise").length;
  const mrr             = (proUsers * 99) + (enterpriseUsers * 499);

  const stats = {
    // Project counts
    // Static: 265 (181 Emaar + 84 others) + 48 Firestore = ~295 unique
    projectCount:     265 + fsProjects,   // total platform projects
    communityCount:   49,                 // 49 verified communities
    developerCount:   7,                  // 7 active developers
    firestoreProjects: fsProjects,        // admin-added via radar

    // User metrics
    totalUsers,
    agentCount:       paidUsers.length,
    activePaidUsers:  paidUsers.length,
    proUsers,
    enterpriseUsers,

    // Revenue
    mrr,
    arr: mrr * 12,

    // Meta
    lastUpdatedAt: new Date().toISOString(),
    updatedBy:     "init_script",
    version:       "2.9",
  };

  await db.collection("adminSettings").doc("platformStats").set(stats);

  console.log("✅ adminSettings/platformStats created:\n");
  console.log(`   projectCount:    ${stats.projectCount}`);
  console.log(`   communityCount:  ${stats.communityCount}`);
  console.log(`   developerCount:  ${stats.developerCount}`);
  console.log(`   totalUsers:      ${stats.totalUsers}`);
  console.log(`   activePaidUsers: ${stats.activePaidUsers}`);
  console.log(`   mrr:             AED ${stats.mrr}`);
  console.log(`   arr:             AED ${stats.arr}`);
  console.log(`\n✅ Done — refresh the dashboard to see correct stats.\n`);

  process.exit(0);
}

initStats().catch(err => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
