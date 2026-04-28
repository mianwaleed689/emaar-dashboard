const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
  
  console.log("=== DATA QUALITY AUDIT ===\n");

  // 1. Score vs breakdown mismatch
  let scoreMismatch = 0;
  docs.forEach(n => {
    const grossY = parseFloat(n.grossYield||0);
    const distM  = parseFloat(n.distMetro||99);
    const ppsf   = n.avgPpsf||0;
    
    let calc = 40;
    if(grossY>=9) calc+=20; else if(grossY>=8) calc+=18; else if(grossY>=7) calc+=15; else if(grossY>=6) calc+=12; else if(grossY>=5) calc+=8;
    if(distM<0.5) calc+=12; else if(distM<1) calc+=10; else if(distM<2) calc+=7; else if(distM<3) calc+=5; else if(distM<5) calc+=2;
    if(ppsf>=4000) calc+=8; else if(ppsf>=3000) calc+=7; else if(ppsf>=2000) calc+=5; else if(ppsf>=1500) calc+=3; else if(ppsf>=1000) calc+=1;
    if(n.hasBeach)  calc+=8;
    if(n.hasMall)   calc+=3;
    if(n.hasSchool) calc+=2;
    if(n.hasMetro)  calc+=3;
    if(n.goldenVisa)calc+=5;
    calc = Math.min(100, calc);
    
    const diff = Math.abs((n.investmentScore||0) - calc);
    if(diff > 5) {
      scoreMismatch++;
      if(scoreMismatch<=10) console.log(`Score mismatch: ${n.community} stored:${n.investmentScore} calc:${calc} diff:${diff}`);
    }
  });
  console.log(`Total score mismatches (>5 diff): ${scoreMismatch}/259\n`);

  // 2. Waterfront communities missing hasBeach
  const waterfrontKeywords = ["beach","harbour","marina","island","waterfront","jumeira","palm","corniche","creek","port","mina","jbr"];
  const missingBeach = docs.filter(n => {
    const name = (n.community||"").toLowerCase();
    return waterfrontKeywords.some(k=>name.includes(k)) && !n.hasBeach;
  });
  console.log(`Waterfront communities missing hasBeach: ${missingBeach.length}`);
  missingBeach.forEach(n=>console.log(" ",n.community,"| distBeach:",n.distBeach));

  // 3. Communities with wrong tier
  const dldWithYield = docs.filter(n=>n.tier==="dld-registry"&&n.grossYield&&parseFloat(n.grossYield)>0);
  console.log(`\nDLD communities that have yield data (should be verified): ${dldWithYield.length}`);
  dldWithYield.slice(0,10).forEach(n=>console.log(" ",n.community,"yield:",n.grossYield));

  // 4. hasMetro vs distMetro inconsistency
  const metroMismatch = docs.filter(n => {
    const dist = parseFloat(n.distMetro||99);
    return (n.hasMetro && dist>2) || (!n.hasMetro && dist<1);
  });
  console.log(`\nMetro flag vs distance mismatch: ${metroMismatch.length}`);
  metroMismatch.slice(0,10).forEach(n=>console.log(" ",n.community,"hasMetro:",n.hasMetro,"dist:",n.distMetro));

  // 5. Golden Visa inconsistency — should be true for AED 2M+ communities
  const gvMissing = docs.filter(n => (n.avgPpsf||0)>=2000 && !n.goldenVisa && n.tier==="verified");
  console.log(`\nVerified communities PPSF 2000+ missing Golden Visa: ${gvMissing.length}`);
  gvMissing.forEach(n=>console.log(" ",n.community,"ppsf:",n.avgPpsf));

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});