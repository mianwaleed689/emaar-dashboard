const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function run() {
  console.log(APPLY ? "APPLYING" : "DRY RUN");

  // Load both collections
  const [roiSnap, commSnap] = await Promise.all([
    db.collection("communityROI").get(),
    db.collection("communities").where("verified", "==", true).get(),
  ]);

  console.log("communityROI docs:", roiSnap.size);
  console.log("verified communities:", commSnap.size);

  // Build ROI map by community name
  const roiMap = {};
  roiSnap.docs.forEach(d => { roiMap[d.id.toLowerCase()] = { id: d.id, ...d.data() }; });

  // Helper: extract best yield from yield object
  const bestYield = (yObj) => {
    if (!yObj || typeof yObj !== "object") return null;
    const vals = Object.values(yObj).filter(v => v && parseFloat(v) > 0).map(v => parseFloat(v));
    return vals.length ? Math.max(...vals) : null;
  };
  const avgYield = (yObj) => {
    if (!yObj || typeof yObj !== "object") return null;
    const vals = Object.values(yObj).filter(v => v && parseFloat(v) > 0).map(v => parseFloat(v));
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null;
  };

  // Build neighbourhood scores from verified communities + ROI data
  const nbhDocs = [];
  
  // First add communities that have ROI data
  roiSnap.docs.forEach(roiDoc => {
    const roi = roiDoc.data();
    const commName = roiDoc.id;
    
    // Find matching community doc
    const comm = commSnap.docs.find(d => {
      const n = d.data().name || d.data().community || "";
      return n.toLowerCase() === commName.toLowerCase() ||
             d.id.toLowerCase().replace(/-/g," ") === commName.toLowerCase();
    });
    const commData = comm ? comm.data() : {};

    const grossY = avgYield(roi.grossYield);
    const netY   = avgYield(roi.netYield);

    // Calculate investment score (0-100)
    let score = 50;
    if (grossY >= 7) score += 20;
    else if (grossY >= 6) score += 15;
    else if (grossY >= 5) score += 10;
    if (roi.occupancy >= 95) score += 15;
    else if (roi.occupancy >= 90) score += 10;
    if (roi.riskLevel === "Low") score += 15;
    else if (roi.riskLevel === "Low-Medium") score += 8;
    if (commData.medianPPSF > 0) score += 5;
    score = Math.min(100, Math.round(score));

    const doc = {
      community:       commName,
      tier:            "verified",
      investmentScore: score,
      grossYield:      grossY ? grossY.toFixed(1) : null,
      netYield:        netY ? netY.toFixed(1) : null,
      avgPpsf:         commData.medianPPSF || roi.avgPpsf || null,
      serviceCharge:   roi.serviceCharge || null,
      supplyRisk:      roi.riskLevel || "Medium",
      occupancy:       roi.occupancy || null,
      appreciation5yr: roi.appreciation5yr || null,
      appreciationYoY: roi.appreciationYoY || null,
      goldenVisa:      roi.goldenVisa || false,
      capitalGrowthDriver: roi.capitalGrowthDriver || null,
      totalTransactions: commData.totalTransactions || null,
      medianPrice:     commData.medianPrice || null,
      area:            commData.area || commData.parentArea || null,
      type:            commData.displayCategory || "Residential",
      hasSchool:       false,
      hasHospital:     false,
      hasMall:         false,
      hasBeach:        commName.toLowerCase().includes("beach") || commName.toLowerCase().includes("marina"),
      metroDistance:   null,
      updatedAt:       new Date().toISOString(),
      source:          "communityROI + communities",
    };

    console.log("ADD:", commName, "| score:", score, "| grossYield:", grossY, "| ppsf:", doc.avgPpsf);
    nbhDocs.push({ id: commName, data: doc });
  });

  // Then add remaining verified communities without ROI data
  commSnap.docs.forEach(d => {
    const data = d.data();
    const name = data.name || data.community || d.id;
    const alreadyAdded = nbhDocs.find(n => n.id.toLowerCase() === name.toLowerCase());
    if (alreadyAdded) return;

    const doc = {
      community:       name,
      tier:            "dld-registry",
      investmentScore: null,
      grossYield:      null,
      netYield:        null,
      avgPpsf:         data.medianPPSF || null,
      serviceCharge:   null,
      supplyRisk:      "Unknown",
      totalTransactions: data.totalTransactions || null,
      medianPrice:     data.medianPrice || null,
      area:            data.area || data.parentArea || null,
      type:            data.displayCategory || "Residential",
      totalProjects:   data.totalProjects || null,
      activeProjects:  data.activeProjects || null,
      completedProjects: data.completedProjects || null,
      updatedAt:       new Date().toISOString(),
      source:          "communities",
    };

    nbhDocs.push({ id: name, data: doc });
  });

  console.log("\nTotal to seed:", nbhDocs.length);
  console.log("Verified (with ROI):", nbhDocs.filter(n=>n.data.tier==="verified").length);
  console.log("DLD Registry:", nbhDocs.filter(n=>n.data.tier==="dld-registry").length);

  if (APPLY) {
    // Write in batches
    const BATCH_SIZE = 400;
    for (let i = 0; i < nbhDocs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      nbhDocs.slice(i, i + BATCH_SIZE).forEach(({ id, data }) => {
        const docId = id.toLowerCase().replace(/[^a-z0-9]/g, "-");
        batch.set(db.collection("neighbourhoodScores").doc(docId), data, { merge: true });
      });
      await batch.commit();
      console.log("Written batch", Math.floor(i/BATCH_SIZE)+1);
    }
    console.log("\nDone — neighbourhoodScores seeded with", nbhDocs.length, "docs");
  } else {
    console.log("\nRun with --apply to seed");
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });