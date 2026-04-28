const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // First add Jebel Ali as a verified community
  const jebelAli = {
    community: "Jebel Ali",
    tier: "verified",
    investmentScore: 68,
    grossYield: "7.5",
    netYield: "6.2",
    avgPpsf: 900,
    serviceCharge: 10,
    supplyRisk: "Low",
    distMetro: 1,
    distBeach: 5,
    distMall: 8,
    distSchool: 3,
    distHospital: 5,
    distAirport: 12,
    nearestMetro: "Jebel Ali (Red Line)",
    hasBeach: false,
    hasSchool: true,
    hasMall: true,
    hasMetro: true,
    goldenVisa: false,
    source: "research-verified-2026",
    updatedAt: new Date().toISOString(),
  };

  await db.collection("neighbourhoodScores").doc("jebel-ali").set(jebelAli);
  console.log("Jebel Ali added as verified");

  // Now run the full inheritance script
  const verifiedSnap = await db.collection("neighbourhoodScores").where("tier","==","verified").get();
  const verifiedMap = {};
  verifiedSnap.docs.forEach(d => { verifiedMap[d.data().community.toLowerCase()] = d.data(); });

  const EXTRA_MAP = {
    "Down Town Jabal Ali": "Jebel Ali",
    "JABEL ALI HILLS":     "Jebel Ali",
    "Jebel Ali":           "Jebel Ali",
    "Jebel Ali Village":   "Jebel Ali",
  };

  const dldSnap = await db.collection("neighbourhoodScores").where("tier","==","dld-registry").get();
  const batch = db.batch();

  dldSnap.docs.forEach(d => {
    const n = d.data();
    if (!EXTRA_MAP[n.community]) return;
    const source = verifiedMap["jebel ali"];
    if (!source) return;
    batch.update(d.ref, {
      grossYield: source.grossYield, netYield: source.netYield,
      serviceCharge: source.serviceCharge, supplyRisk: source.supplyRisk,
      distMetro: source.distMetro, distBeach: source.distBeach,
      distMall: source.distMall, distSchool: source.distSchool,
      distHospital: source.distHospital, distAirport: source.distAirport,
      nearestMetro: source.nearestMetro, hasBeach: source.hasBeach,
      hasSchool: source.hasSchool, hasMall: source.hasMall,
      hasMetro: source.hasMetro, goldenVisa: source.goldenVisa,
      avgPpsf: n.avgPpsf || source.avgPpsf,
      parentCommunity: "Jebel Ali",
      investmentScore: source.investmentScore,
      updatedAt: new Date().toISOString(),
    });
    console.log("Updated:", n.community);
  });

  await batch.commit();
  console.log("Done");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});