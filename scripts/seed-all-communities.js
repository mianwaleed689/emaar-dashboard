const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function run() {
  console.log(APPLY ? "APPLYING" : "DRY RUN");

  const [projectsSnap, commSnap] = await Promise.all([
    db.collection("projects").get(),
    db.collection("communities").get(),
  ]);

  console.log("Projects:", projectsSnap.size);
  console.log("Communities:", commSnap.size);

  // ── Build Emaar community data from projects ──────────────────
  const commMap = {};
  projectsSnap.docs.forEach(d => {
    const data = d.data();
    const comm = data.community || data.area || "";
    if (!comm || comm === "Dubai") return;
    if (!commMap[comm]) commMap[comm] = [];
    commMap[comm].push(data);
  });

  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
  const first = (arr, key) => { const v = arr.find(p => p[key]!=null); return v ? v[key] : null; };
  const any = (arr, key, threshold=null) => threshold
    ? arr.some(p=>parseFloat(p[key]||999)<threshold)
    : arr.some(p=>p[key]);

  const emaarCommunities = new Set();
  const nbhDocs = [];

  // Tier 1 — Emaar verified communities
  Object.entries(commMap).forEach(([comm, projs]) => {
    emaarCommunities.add(comm.toLowerCase());

    const grossYields = projs.map(p=>parseFloat(p.grossYield||0)).filter(v=>v>0);
    const netYields   = projs.map(p=>parseFloat(p.netYield||0)).filter(v=>v>0);
    const ppsfs       = projs.map(p=>parseFloat(p.ppsf||0)).filter(v=>v>0);
    const svcCharges  = projs.map(p=>parseFloat(p.serviceCharge||0)).filter(v=>v>0);
    const pricesMin   = projs.map(p=>parseFloat(p.priceMin||0)).filter(v=>v>0);
    const pricesMax   = projs.map(p=>parseFloat(p.priceMax||0)).filter(v=>v>0);

    const grossYield  = avg(grossYields);
    const netYield    = avg(netYields);
    const avgPpsf     = avg(ppsfs);
    const svcCharge   = avg(svcCharges);

    const distMetro   = first(projs, "distMetro");
    const distMall    = first(projs, "distMall");
    const distBeach   = first(projs, "distBeach");
    const distSchool  = first(projs, "distSchool");
    const distHospital= first(projs, "distHospital");
    const distAirport = first(projs, "distAirport");
    const nearestMetro= first(projs, "nearestMetro");
    const goldenVisa  = any(projs, "goldenVisa");

    const hasBeach    = distBeach!=null && parseFloat(distBeach)<2;
    const hasSchool   = distSchool!=null && parseFloat(distSchool)<2;
    const hasHospital = distHospital!=null && parseFloat(distHospital)<3;
    const hasMall     = distMall!=null && parseFloat(distMall)<2;
    const hasMetro    = distMetro!=null && parseFloat(distMetro)<1.5;

    const types = [...new Set(projs.map(p=>p.propertyType||p.type||"").filter(Boolean))];
    const hasVilla = types.some(t=>t.toLowerCase().includes("villa"));
    const hasApt   = types.some(t=>["apt","apartment","flat"].some(k=>t.toLowerCase().includes(k)));

    let score = 40;
    if (grossYield >= 7)       score += 20;
    else if (grossYield >= 6)  score += 15;
    else if (grossYield >= 5)  score += 10;
    else if (grossYield > 0)   score += 5;
    if (distMetro && parseFloat(distMetro) < 1)   score += 10;
    else if (distMetro && parseFloat(distMetro) < 2) score += 5;
    if (hasBeach)    score += 8;
    if (hasSchool)   score += 5;
    if (hasHospital) score += 5;
    if (hasMall)     score += 5;
    if (goldenVisa)  score += 7;
    if (projs.length >= 10) score += 5;
    score = Math.min(100, Math.round(score));

    nbhDocs.push({ id: comm, data: {
      community: comm, tier: "verified",
      investmentScore: score,
      grossYield: grossYield ? grossYield.toFixed(2) : null,
      netYield:   netYield   ? netYield.toFixed(2)   : null,
      avgPpsf:    avgPpsf    ? Math.round(avgPpsf)    : null,
      serviceCharge: svcCharge ? Math.round(svcCharge) : null,
      priceMin:   pricesMin.length ? Math.min(...pricesMin) : null,
      priceMax:   pricesMax.length ? Math.max(...pricesMax) : null,
      distMetro, distMall, distBeach, distSchool, distHospital, distAirport,
      nearestMetro, hasBeach, hasSchool, hasHospital, hasMall, hasMetro,
      goldenVisa, propertyTypes: types, hasVilla, hasApt,
      totalProjects: projs.length,
      activeProjects: projs.filter(p=>p.status==="active"||p.lifecycle==="active").length,
      supplyRisk: projs.length > 15 ? "High" : projs.length > 8 ? "Medium" : "Low",
      area: first(projs,"area") || comm,
      developer: "Emaar",
      updatedAt: new Date().toISOString(),
      source: "projects",
    }});
  });

  // Tier 2 — All other DLD communities
  commSnap.docs.forEach(d => {
    const data = d.data();
    const name = data.name || data.community || d.id;
    if (!name || emaarCommunities.has(name.toLowerCase())) return;

    nbhDocs.push({ id: name, data: {
      community:        name,
      tier:             "dld-registry",
      investmentScore:  null,
      grossYield:       null,
      netYield:         null,
      avgPpsf:          data.medianPPSF || data.p50PPSF || null,
      serviceCharge:    null,
      priceMin:         data.minRecentPrice || null,
      priceMax:         data.maxRecentPrice || null,
      medianPrice:      data.medianPrice || null,
      totalTransactions: data.totalTransactions || null,
      totalProjects:    data.totalProjects || null,
      activeProjects:   data.activeProjects || null,
      completedProjects: data.completedProjects || null,
      area:             data.area || data.parentArea || null,
      type:             data.displayCategory || data.type || "Residential",
      isMaster:         data.isMaster || false,
      verified:         data.verified || false,
      supplyRisk:       null,
      updatedAt:        new Date().toISOString(),
      source:           "communities",
    }});
  });

  console.log("\nTotal to seed:", nbhDocs.length);
  console.log("Tier 1 Verified (Emaar):", nbhDocs.filter(n=>n.data.tier==="verified").length);
  console.log("Tier 2 DLD Registry:",     nbhDocs.filter(n=>n.data.tier==="dld-registry").length);

  if (APPLY) {
    // Clear old
    const old = await db.collection("neighbourhoodScores").get();
    if (old.size > 0) {
      const delBatch = db.batch();
      old.docs.forEach(d => delBatch.delete(d.ref));
      await delBatch.commit();
      console.log("Cleared", old.size, "old docs");
    }

    // Write in batches of 400
    for (let i = 0; i < nbhDocs.length; i += 400) {
      const batch = db.batch();
      nbhDocs.slice(i, i+400).forEach(({id, data}) => {
        const docId = id.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").substring(0,100);
        batch.set(db.collection("neighbourhoodScores").doc(docId), data);
      });
      await batch.commit();
      console.log("Written batch", Math.floor(i/400)+1, "—", Math.min(i+400, nbhDocs.length), "docs");
    }
    console.log("\nDone — seeded", nbhDocs.length, "neighbourhoodScores");
  } else {
    console.log("\nRun with --apply to seed");
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });