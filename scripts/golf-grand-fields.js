const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").where("name","==","Golf Grand").get();
  const p = snap.docs[0].data();
  
  console.log("=== ALL GOLF GRAND FIELDS ===");
  Object.entries(p).sort().forEach(([k,v])=>{
    if(v!==null&&v!==undefined&&v!==0&&v!==""&&v!=="null") {
      console.log(k.padEnd(30), JSON.stringify(v).substring(0,60));
    }
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});