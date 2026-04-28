const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function run() {
  console.log(APPLY ? "APPLYING" : "DRY RUN");

  // 1. Read existing organisations
  const orgsSnap = await db.collection("organisations").get();
  console.log("\n=== organisations (canonical) ===", orgsSnap.size, "docs");
  orgsSnap.docs.forEach(d => console.log(" ", d.id, "—", d.data().name, "| plan:", d.data().plan));

  // 2. Migrate orgs -> organisations (merge)
  const oldOrgs = await db.collection("orgs").get();
  console.log("\n=== orgs (to migrate+delete) ===", oldOrgs.size, "docs");
  
  for (const d of oldOrgs.docs) {
    const data = d.data();
    // Check if already in organisations
    const existing = await db.collection("organisations").doc(d.id).get();
    if (existing.exists) {
      console.log(`  MERGE: ${d.id} — already in organisations, merging managers/agents`);
      if (APPLY) {
        await db.collection("organisations").doc(d.id).update({
          managers: data.managers || [],
          agents: data.agents || [],
          memberCount: data.memberCount || 0,
          active: data.active !== false,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      console.log(`  MIGRATE: ${d.id} -> organisations`);
      if (APPLY) {
        await db.collection("organisations").doc(d.id).set({
          orgId: d.id,
          name: data.name || d.id,
          plan: data.plan || "trial",
          active: data.active !== false,
          managers: data.managers || [],
          agents: data.agents || [],
          memberCount: data.memberCount || 0,
          status: "active",
          type: "Agency",
          city: "Dubai",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
    // Delete from orgs
    console.log(`  DELETE: orgs/${d.id}`);
    if (APPLY) await db.collection("orgs").doc(d.id).delete();
  }

  // 3. Fix users — update orgId references if any point to orgs
  const users = await db.collection("users").get();
  let userFixes = 0;
  for (const d of users.docs) {
    const u = d.data();
    if (!u.orgId) continue;
    const orgExists = await db.collection("organisations").doc(u.orgId).get();
    if (!orgExists.exists) {
      console.log(`  USER FIX NEEDED: ${u.name} has orgId ${u.orgId} but no org doc exists`);
    }
    userFixes++;
  }
  console.log(`\n${userFixes} users with orgId verified`);

  // 4. Final state
  if (APPLY) {
    const finalOrgs = await db.collection("organisations").get();
    console.log("\n=== FINAL organisations ===", finalOrgs.size, "docs");
    finalOrgs.docs.forEach(d => {
      const data = d.data();
      console.log(` ${d.id} — ${data.name} | plan:${data.plan} | managers:${(data.managers||[]).length} | agents:${(data.agents||[]).length}`);
    });
  }

  if (!APPLY) console.log("\nRun with --apply to execute");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });