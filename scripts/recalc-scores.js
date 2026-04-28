const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").where("tier","==","verified").get();
  const batch = db.batch();

  snap.docs.forEach(d => {
    const n = d.data();
    const grossY = parseFloat(n.grossYield||0);
    const distM  = parseFloat(n.distMetro||99);
    const ppsf   = n.avgPpsf||0;

    let score = 40;
    // Yield component (max 20)
    if (grossY>=7)       score += 20;
    else if (grossY>=6)  score += 15;
    else if (grossY>=5)  score += 10;
    else if (grossY>0)   score += 5;
    // Metro (max 10)
    if (distM<1)         score += 10;
    else if (distM<3)    score += 7;
    else if (distM<5)    score += 4;
    else if (distM<10)   score += 2;
    // PPSF premium (max 8) — higher PPSF = more liquid market
    if (ppsf>=3000)      score += 8;
    else if (ppsf>=2000) score += 6;
    else if (ppsf>=1500) score += 4;
    else if (ppsf>=1000) score += 2;
    // Amenities (max 18)
    if (n.hasBeach)      score += 8;
    if (n.hasSchool)     score += 3;
    if (n.hasMall)       score += 4;
    if (n.hasHospital)   score += 3;
    // Golden Visa (max 7)
    if (n.goldenVisa)    score += 7;
    // Maturity (max 5)
    if ((n.totalProjects||0)>=10) score += 5;
    else if ((n.totalProjects||0)>=5) score += 3;

    score = Math.min(100, Math.round(score));

    batch.update(d.ref, { investmentScore: score, updatedAt: new Date().toISOString() });
    console.log(n.community.padEnd(30), "| score:", score, "| yield:", grossY, "| ppsf:", ppsf, "| metro:", distM+"km");
  });

  await batch.commit();
  console.log("\nDone — investment scores recalculated");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });