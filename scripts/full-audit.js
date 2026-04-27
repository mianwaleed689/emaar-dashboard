const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check communities count and sample
  const communities = await db.collection("communities").get();
  console.log("=== COMMUNITIES ===");
  console.log("Total docs:", communities.size);
  const sample = communities.docs.slice(0, 3).map(d => ({ id: d.id, name: d.data().name, displayCategory: d.data().displayCategory, visibility: d.data().visibility }));
  console.log("Sample:", JSON.stringify(sample, null, 2));

  // Check projects count and schema
  const projects = await db.collection("projects").get();
  console.log("\n=== PROJECTS ===");
  console.log("Total docs:", projects.size);
  const projSample = projects.docs.slice(0, 2).map(d => {
    const data = d.data();
    return { id: d.id, name: data.name || data.projectName, status: data.status, community: data.community, developer: data.developer, visibility: data.visibility };
  });
  console.log("Sample:", JSON.stringify(projSample, null, 2));
  
  // Check what fields a project has
  if (projects.docs.length > 0) {
    const firstProject = projects.docs[0].data();
    console.log("\nFirst project all fields:", Object.keys(firstProject).join(", "));
  }

  // Check developers
  const devs = await db.collection("developers").get();
  console.log("\n=== DEVELOPERS ===");
  console.log("Total docs:", devs.size);
  const verifiedDevs = devs.docs.filter(d => d.data().verified === true);
  console.log("Verified:", verifiedDevs.length);
  console.log("Sample verified:", verifiedDevs.slice(0,3).map(d => d.data().name).join(", "));

  // Check dldVolumes
  const dld = await db.collection("dldVolumes").get();
  console.log("\n=== DLD VOLUMES ===");
  console.log("Total docs:", dld.size);

  // Check priceHistory
  const ph = await db.collection("priceHistory").get();
  console.log("\n=== PRICE HISTORY ===");
  console.log("Total docs:", ph.size);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });