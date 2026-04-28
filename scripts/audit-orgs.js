const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check organisations vs orgs
  const orgs = await db.collection("orgs").get();
  const organisations = await db.collection("organisations").get();
  
  console.log("=== orgs collection ===", orgs.size, "docs");
  orgs.docs.slice(0,3).forEach(d => console.log(" ", d.id, "—", Object.keys(d.data()).join(", ")));
  
  console.log("\n=== organisations collection ===", organisations.size, "docs");
  organisations.docs.slice(0,3).forEach(d => {
    const data = d.data();
    console.log(" ", d.id.substring(0,30), "— name:", data.name, "| plan:", data.plan, "| status:", data.status, "| type:", data.type);
    console.log("   fields:", Object.keys(data).join(", "));
  });

  // Check TeamTab to understand agent invitation flow
  const teamTab = require("fs").readFileSync("src/tabs/TeamTab.jsx", "latin1");
  const teamLines = teamTab.split("\n");
  console.log("\n=== TeamTab.jsx ===", teamLines.length, "lines");
  teamLines.slice(0, 80).forEach((l, i) => console.log(i+1, l));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });