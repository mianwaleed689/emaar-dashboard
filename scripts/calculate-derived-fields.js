const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const docs = snap.docs.filter(d=>!d.data().archived);
  let fixed=0;
  const BATCH_SIZE=400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE){
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const updates = {};

      // 1. Net yield = gross yield - service charge overhead (~1.5%)
      if(p.grossYield && !p.netYield) {
        updates.netYield = Math.round((parseFloat(p.grossYield)-1.5)*10)/10;
      }

      // 2. Avg annual rent = yield × price
      if(p.grossYield && p.priceMin && !p.avgAnnualRent) {
        updates.avgAnnualRent = Math.round(parseFloat(p.grossYield)/100 * p.priceMin);
      }

      // 3. Golden Visa = price >= 2M
      if(!p.goldenVisa && p.priceMin >= 2000000) {
        updates.goldenVisa = true;
        updates.goldenVisaEligible = true;
      }

      // 4. Market segment from PPSF
      if(!p.marketSegment && (p.ppsf||p.avgPpsf)) {
        const ppsf = p.ppsf||p.avgPpsf||0;
        updates.marketSegment = ppsf>=3000?"Ultra Luxury":ppsf>=2000?"Luxury":ppsf>=1500?"Premium":ppsf>=1000?"Mid-Market":"Affordable";
      }

      if(Object.keys(updates).length>0){ batch.update(d.ref,updates); fixed++; }
    });
    await batch.commit();
  }

  console.log("Fixed:", fixed, "projects");
  
  // Run compare again
  const snap2 = await db.collection("projects").where("name","==","The World Project 2586").get();
  if(!snap2.empty) {
    const p = snap2.docs[0].data();
    console.log("\nThe World Project 2586 now:");
    console.log("Net Yield:", p.netYield||"--");
    console.log("Annual Rent:", p.avgAnnualRent?.toLocaleString()||"--");
    console.log("Golden Visa:", p.goldenVisa||"--");
    console.log("Market Segment:", p.marketSegment||"--");
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});