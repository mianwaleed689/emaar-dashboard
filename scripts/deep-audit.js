const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check the one published project
  const pub = await db.collection("projects").where("visibility", "==", "published").get();
  console.log("=== PUBLISHED PROJECTS ===");
  pub.docs.forEach(d => console.log(d.id, d.data().name));

  // Check DLD volume field names
  const dld = await db.collection("dldVolumes").limit(2).get();
  console.log("\n=== DLD VOLUME FIELD NAMES ===");
  dld.docs.forEach(d => console.log(d.id, "fields:", Object.keys(d.data()).join(", ")));
  console.log("Sample data:", JSON.stringify(dld.docs[0]?.data(), null, 2));

  // Check what communities the hidden projects use
  const projects = await db.collection("projects").get();
  const communities = new Set(projects.docs.map(d => d.data().community).filter(Boolean));
  console.log("\n=== PROJECT COMMUNITIES ===");
  console.log([...communities].sort().join("\n"));

  // Check hidden project sample - full data
  const hidden = projects.docs.filter(d => d.data().visibility === "hidden").slice(0, 1);
  if (hidden.length) {
    const data = hidden[0].data();
    console.log("\n=== SAMPLE HIDDEN PROJECT ===");
    console.log("Name:", data.name);
    console.log("Developer:", data.developer);
    console.log("Community:", data.community);
    console.log("Type:", data.type, "|", data.propertyType);
    console.log("Price:", data.priceMin, "-", data.priceMax);
    console.log("Units:", data.totalUnits);
    console.log("Handover:", data.handover);
    console.log("Payment Plan:", data.paymentPlan);
    console.log("Status:", data.status);
    console.log("Beds:", data.beds);
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });