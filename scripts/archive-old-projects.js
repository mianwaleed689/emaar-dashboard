const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d=>({ref:d.ref,...d.data()}));
  
  // Archive old projects (handover before 2025)
  const batch1 = db.batch();
  let archived = 0;
  projects.forEach(p=>{
    if(p.handoverQuarter) {
      const year = parseInt(p.handoverQuarter.split(" ")[1]);
      if(year < 2025 && p.dldImported) {
        batch1.update(p.ref, { archived: true, status:"Completed", lifecycle:"Completed" });
        archived++;
      }
    }
  });
  await batch1.commit();
  console.log("Archived old projects:", archived);
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});