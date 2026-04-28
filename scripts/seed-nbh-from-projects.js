const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function run() {
  console.log(APPLY ? "APPLYING" : "DRY RUN");

  const projects = await db.collection("projects").get();
  console.log("Projects:", projects.size);

  // Group projects by community
  const commMap = {};
  projects.docs.forEach(d => {
    const data = d.data();
    const comm = data.community || data.area || "";
    if (!comm || comm === "Dubai") return;
    if (!commMap[comm]) commMap[comm] = [];
    commMap[comm].push(data);
  });

  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
  const first = (arr, key) => { const v = arr.find(p => p[key]); return v ? v[key] : null; };
  const any = (arr, key) => arr.some(p => p[key]);

  const nbhDocs = [];

  Object.entries(commMap).forEach(([comm, projs]) => {
    // Yield data
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
    const minPrice    = pricesMin.length ? Math.min(...pricesMin) : null;
    const maxPrice    = pricesMax.length ? Math.max(...pricesMax) : null;

    // Distance data
    const distMetro   = first(projs, "distMetro");
    const distMall    = first(projs, "distMall");
    const distBeach   = first(projs, "distBeach");
    const distSchool  = first(projs, "distSchool");
    const distHospital= first(projs, "distHospital");
    const distAirport = first(projs, "distAirport");
    const nearestMetro= first(projs, "nearestMetro");

    // Amenities
    const hasBeach    = any(projs, "distBeach") && projs.some(p=>parseFloat(p.distBeach||999)<2);
    const hasSchool   = any(projs, "distSchool") && projs.some(p=>parseFloat(p.distSchool||999)<2);
    const hasHospital = any(projs, "distHospital") && projs.some(p=>parseFloat(p.distHospital||999)<3);
    const hasMall     = any(projs, "distMall") && projs.some(p=>parseFloat(p.distMall||999)<2);
    const hasMetro    = any(projs, "distMetro") && projs.some(p=>parseFloat(p.distMetro||999)<1.5);
    const goldenVisa  = any(projs, "goldenVisa");

    // Property types
    const types = [...new Set(projs.map(p=>p.propertyType||p.type||"").filter(Boolean))];
    const hasVilla = types.some(t=>t.toLowerCase().includes("villa"));
    const hasApt   = types.some(t=>t.toLowerCase().includes("apt")||t.toLowerCase().includes("apartment"));

    // Investment score
    let score = 40;
    if (grossYield >= 7)      score += 20;
    else if (grossYield >= 6) score += 15;
    else if (grossYield >= 5) score += 10;
    else if (grossYield > 0)  score += 5;
    if (distMetro && parseFloat(distMetro) < 1)   score += 10;
    else if (distMetro && parseFloat(distMetro) < 2) score += 5;
    if (hasBeach)   score += 8;
    if (hasSchool)  score += 5;
    if (hasHospital)score += 5;
    if (hasMall)    score += 5;
    if (goldenVisa) score += 7;
    if (projs.length >= 10) score += 5; // mature community
    score = Math.min(100, Math.round(score));

    const doc = {
      community:        comm,
      tier:             "verified",
      investmentScore:  score,
      grossYield:       grossYield ? grossYield.toFixed(2) : null,
      netYield:         netYield ? netYield.toFixed(2) : null,
      avgPpsf:          avgPpsf ? Math.round(avgPpsf) : null,
      serviceCharge:    svcCharge ? Math.round(svcCharge) : null,
      priceMin:         minPrice || null,
      priceMax:         maxPrice || null,
      distMetro:        distMetro || null,
      distMall:         distMall || null,
      distBeach:        distBeach || null,
      distSchool:       distSchool || null,
      distHospital:     distHospital || null,
      distAirport:      distAirport || null,
      nearestMetro:     nearestMetro || null,
      hasBeach,
      hasSchool,
      hasHospital,
      hasMall,
      hasMetro,
      goldenVisa,
      propertyTypes:    types,
      hasVilla,
      hasApt,
      totalProjects:    projs.length,
      activeProjects:   projs.filter(p=>p.status==="active"||p.lifecycle==="active").length,
      supplyRisk:       projs.length > 15 ? "High" : projs.length > 8 ? "Medium" : "Low",
      area:             first(projs, "area") || comm,
      updatedAt:        new Date().toISOString(),
      source:           "projects",
    };

    console.log(comm, "| score:", score, "| grossYield:", grossYield?.toFixed(2)||"N/A", "| ppsf:", avgPpsf?.toFixed(0)||"N/A", "| projects:", projs.length);
    nbhDocs.push({ id: comm, data: doc });
  });

  console.log("\nTotal communities:", nbhDocs.length);

  if (APPLY) {
    // Clear old docs first
    const old = await db.collection("neighbourhoodScores").get();
    const delBatch = db.batch();
    old.docs.forEach(d => delBatch.delete(d.ref));
    await delBatch.commit();
    console.log("Cleared", old.size, "old docs");

    // Write new docs
    const batch = db.batch();
    nbhDocs.forEach(({ id, data }) => {
      const docId = id.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g,"-");
      batch.set(db.collection("neighbourhoodScores").doc(docId), data);
    });
    await batch.commit();
    console.log("Seeded", nbhDocs.length, "neighbourhood scores from projects");
  } else {
    console.log("\nRun with --apply to seed");
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });