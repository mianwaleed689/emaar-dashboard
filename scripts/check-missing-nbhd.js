const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdNames = new Set(nbhdSnap.docs.map(d=>d.data().community?.toLowerCase()));
  
  const missing = ["Dubailand","Emaar South","Palm Deira","Palm Jumeirah","Al Jadaf","DAMAC Hills 2","Dubai Silicon Oasis","The World Islands","Jebel Ali Industrial"];
  
  missing.forEach(c=>{
    const exists = nbhdNames.has(c.toLowerCase());
    console.log(c.padEnd(30), exists?"EXISTS":"MISSING FROM NEIGHBOURHOODSCORES");
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});