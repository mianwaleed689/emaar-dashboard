const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check users collection structure
  const users = await db.collection("users").limit(3).get();
  console.log("=== USERS COLLECTION ===");
  console.log("Sample docs:", users.size);
  users.docs.forEach(d => {
    const data = d.data();
    console.log("ID:", d.id);
    console.log("Fields:", Object.keys(data).join(", "));
    console.log("role:", data.role, "| orgId:", data.orgId, "| name:", data.name || data.displayName);
    console.log("---");
  });

  // Check leads collection structure  
  const leads = await db.collection("leads").limit(3).get();
  console.log("\n=== LEADS COLLECTION ===");
  console.log("Total sample:", leads.size);
  if (leads.size > 0) {
    const d = leads.docs[0].data();
    console.log("Fields:", Object.keys(d).join(", "));
    console.log("orgId:", d.orgId, "| assignedTo:", d.assignedTo, "| status:", d.status);
  } else {
    console.log("Empty collection");
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });