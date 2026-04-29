const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check verified published developers
  const snap = await db.collection("developers")
    .where("verified","==",true)
    .where("visibility","==","published")
    .get();
  
  console.log("Verified+Published developers:", snap.size);
  
  // Show top by totalProjects
  const devs = snap.docs.map(d=>d.data())
    .filter(d=>d.totalProjects>0)
    .sort((a,b)=>(b.totalProjects||0)-(a.totalProjects||0));
  
  console.log("\nTop 20 by project count:");
  devs.slice(0,20).forEach(d=>
    console.log((d.totalProjects||0).toString().padStart(5), d.name?.substring(0,40).padEnd(40), "| tier:", d.tier||"--")
  );
  
  // Check community filter
  const commSnap = await db.collection("communityLookup").get();
  console.log("\nCommunity lookup:", commSnap.size, "communities");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});