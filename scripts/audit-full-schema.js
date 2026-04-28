const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // 1. Check orgs collection
  const orgs = await db.collection("orgs").get();
  console.log("=== ORGS ===", orgs.size, "docs");
  orgs.docs.slice(0,5).forEach(d => console.log(" ", d.id, JSON.stringify(d.data()).substring(0,120)));

  // 2. Users with orgId breakdown
  const users = await db.collection("users").get();
  console.log("\n=== USERS ===", users.size, "total");
  const withOrg = users.docs.filter(d => d.data().orgId);
  const withOrgRole = users.docs.filter(d => d.data().orgRole);
  const byOrgRole = {};
  users.docs.forEach(d => {
    const r = d.data().orgRole || d.data().role || "none";
    byOrgRole[r] = (byOrgRole[r]||0) + 1;
  });
  console.log("With orgId:", withOrg.length);
  console.log("With orgRole:", withOrgRole.length);
  console.log("Role breakdown:", JSON.stringify(byOrgRole));

  // 3. Sample users with orgId
  console.log("\nSample org users:");
  withOrg.slice(0,5).forEach(d => {
    const u = d.data();
    console.log(" ", d.id.substring(0,8), "| org:", u.orgId, "| role:", u.role, "| orgRole:", u.orgRole, "| name:", u.name);
  });

  // 4. Leads audit
  const leads = await db.collection("leads").get();
  console.log("\n=== LEADS ===", leads.size, "total");
  const withOrgId = leads.docs.filter(d => d.data().orgId);
  const withAssigned = leads.docs.filter(d => d.data().assignedTo);
  console.log("With orgId:", withOrgId.length);
  console.log("With assignedTo:", withAssigned.length);
  
  // Status breakdown
  const byStatus = {};
  leads.docs.forEach(d => {
    const s = d.data().status || "none";
    byStatus[s] = (byStatus[s]||0) + 1;
  });
  console.log("Status breakdown:", JSON.stringify(byStatus, null, 2));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });