const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// TRUE waterfront communities only — must actually be on water
const TRUE_WATERFRONT = new Set([
  "Palm Jumeirah","Palm Jabal Ali","Palm Jebel Ali",
  "Jumeirah Beach Residence","Jumeirah Beach Residence (JBR)",
  "Dubai Marina","Emaar Beachfront","La Mer","Port de La Mer",
  "Pearl Jumeira","Jumeira Bay","The World","Dubai Harbour",
  "Bluewaters Island","Dubai Islands","Mina Rashid",
  "Rashid Yachts & Marina","Dubai Creek Harbour",
  "Al Sufouh","Madinat Jumeirah Living",
  "Jumeirah 1","Jumeirah 2","Jumeirah 3","Jumeirah Second",
  "Dubai Maritime City","Corniche Deira",
]);

function calcScore(n) {
  const grossY = parseFloat(n.grossYield||0);
  const distM  = parseFloat(n.distMetro||99);
  const ppsf   = n.avgPpsf||0;
  let score = 40;
  if(grossY>=9) score+=20; else if(grossY>=8) score+=18; else if(grossY>=7) score+=15; else if(grossY>=6) score+=12; else if(grossY>=5) score+=8;
  if(distM<0.5) score+=12; else if(distM<1) score+=10; else if(distM<2) score+=7; else if(distM<3) score+=5; else if(distM<5) score+=2;
  if(ppsf>=4000) score+=8; else if(ppsf>=3000) score+=7; else if(ppsf>=2000) score+=5; else if(ppsf>=1500) score+=3; else if(ppsf>=1000) score+=1;
  if(n.hasBeach)  score+=8;
  if(n.hasMall)   score+=3;
  if(n.hasSchool) score+=2;
  if(n.hasMetro)  score+=3;
  if(n.goldenVisa)score+=5;
  return Math.min(100, Math.round(score));
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const docs = snap.docs.map(d=>({ref:d.ref,...d.data()}));
  
  // Process in batches of 400
  const BATCH_SIZE = 400;
  let totalFixed = 0;
  
  for(let i=0; i<docs.length; i+=BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i+BATCH_SIZE);
    
    chunk.forEach(n => {
      const updates = {};
      
      // 1. Fix hasBeach — only true waterfront communities
      const isWaterfront = TRUE_WATERFRONT.has(n.community);
      const beachDist = parseFloat(n.distBeach||99);
      const correctBeach = isWaterfront || beachDist <= 1.5;
      if(n.hasBeach !== correctBeach) {
        updates.hasBeach = correctBeach;
      }

      // 2. Fix hasMetro based on actual distance
      const metroCorrect = parseFloat(n.distMetro||99) <= 1.5;
      if(n.hasMetro !== metroCorrect) updates.hasMetro = metroCorrect;

      // 3. Fix hasSchool based on distance
      const schoolCorrect = parseFloat(n.distSchool||99) <= 3;
      if(n.hasSchool !== schoolCorrect) updates.hasSchool = schoolCorrect;

      // 4. Fix hasMall based on distance  
      const mallCorrect = parseFloat(n.distMall||99) <= 3;
      if(n.hasMall !== mallCorrect) updates.hasMall = mallCorrect;

      // 5. Fix hasSports
      const sportsCorrect = parseFloat(n.distSports||99) <= 3;
      if(n.hasSports !== sportsCorrect) updates.hasSports = sportsCorrect;

      // Apply beach fix before recalculating score
      const nFixed = {...n, ...updates};
      
      // 6. Recalculate investment score with correct data
      const newScore = calcScore(nFixed);
      if(Math.abs((n.investmentScore||0) - newScore) > 2) {
        updates.investmentScore = newScore;
      }

      if(Object.keys(updates).length > 0) {
        batch.update(n.ref, updates);
        totalFixed++;
      }
    });
    
    await batch.commit();
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} committed`);
  }

  console.log("\nTotal communities fixed:", totalFixed);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});