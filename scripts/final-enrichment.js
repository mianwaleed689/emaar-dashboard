const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Load our developers collection
  const devSnap = await db.collection("developers").get();
  const devMap = {};
  devSnap.docs.forEach(d=>{
    const dev = d.data();
    if(dev.name) devMap[dev.name.toLowerCase()] = dev;
  });
  console.log("Developers loaded:", Object.keys(devMap).length);

  // Load community data
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d=>{
    const n = d.data();
    if(n.community) nbhdMap[n.community.toLowerCase()] = n;
  });

  // Load projects
  const projSnap = await db.collection("projects").get();
  const docs = projSnap.docs.filter(d=>!d.data().archived);
  console.log("Projects to enrich:", docs.length);

  let enriched = 0;
  const BATCH_SIZE = 400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const updates = {};

      // 1. Developer details from our collection
      const dev = devMap[(p.developer||"").toLowerCase()];
      if(dev) {
        if(!p.developerTier && dev.tier) updates.developerTier = "tier-"+dev.tier;
        if(!p.developerTierLabel && dev.tier) updates.developerTierLabel = "Tier "+dev.tier;
        if(!p.developerWebsite && dev.website) updates.developerWebsite = dev.website;
        if(!p.developerFounded && dev.founded) updates.developerFounded = dev.founded;
        if(!p.developerSpecialty && dev.specialty) updates.developerSpecialty = dev.specialty;
        if(!p.developerOnTimeRate && dev.onTime) updates.developerOnTimeRate = dev.onTime;
      }

      // 2. Community details from neighbourhoodScores
      const nbhd = nbhdMap[(p.community||"").toLowerCase()];
      if(nbhd) {
        if(!p.nearestMetro && nbhd.nearestMetro)       updates.nearestMetro     = nbhd.nearestMetro;
        if(!p.distMetro && nbhd.distMetro)             updates.distMetro        = parseFloat(nbhd.distMetro);
        if(!p.nearestMall && nbhd.nearestMall)         updates.nearestMall      = nbhd.nearestMall;
        if(!p.distMall && nbhd.distMall)               updates.distMall         = parseFloat(nbhd.distMall);
        if(!p.nearestHospital && nbhd.nearestHospital) updates.nearestHospital  = nbhd.nearestHospital;
        if(!p.distHospital && nbhd.distHospital)       updates.distHospital     = parseFloat(nbhd.distHospital);
        if(!p.nearestSchool && nbhd.nearestSchool)     updates.nearestSchool    = nbhd.nearestSchool;
        if(!p.distSchool && nbhd.distSchool)           updates.distSchool       = parseFloat(nbhd.distSchool);
        if(!p.nearestBeach && nbhd.nearestBeach)       updates.nearestBeach     = nbhd.nearestBeach;
        if(!p.distBeach && nbhd.distBeach)             updates.distBeach        = parseFloat(nbhd.distBeach);
        if(!p.nearestSupermarket && nbhd.nearestSupermarket) updates.nearestSupermarket = nbhd.nearestSupermarket;
        if(!p.serviceCharge && nbhd.serviceCharge)    updates.serviceCharge    = nbhd.serviceCharge;
        if(!p.goldenVisa && nbhd.goldenVisa)           updates.goldenVisa       = nbhd.goldenVisa;
        if(!p.hasMetro && nbhd.hasMetro)               updates.hasMetro         = nbhd.hasMetro;
        if(!p.hasBeach && nbhd.hasBeach)               updates.hasBeach         = nbhd.hasBeach;
        if(!p.supplyRisk && nbhd.supplyRisk)           updates.supplyRisk       = nbhd.supplyRisk;
        if(!p.liquidity && nbhd.liquidity)             updates.liquidity        = nbhd.liquidity;
        if(!p.communityAvgPpsf && nbhd.avgPpsf)       updates.communityAvgPpsf = nbhd.avgPpsf;
        if(!p.communityMedianPPSF && nbhd.avgPpsf)    updates.communityMedianPPSF = nbhd.avgPpsf;
        if(!p.communityInvestScore && nbhd.investmentScore) updates.communityInvestScore = nbhd.investmentScore;
        if(!p.grossYield && nbhd.grossYield)           updates.grossYield       = parseFloat(nbhd.grossYield);
        if(!p.netYield && nbhd.netYield)               updates.netYield         = parseFloat(nbhd.netYield);

        // Estimate PPSF from community if missing
        if(!p.ppsf && nbhd.avgPpsf) updates.ppsf = nbhd.avgPpsf;

        // Estimate price from PPSF × typical size
        if(!p.priceMin && nbhd.avgPpsf) {
          updates.priceMin = Math.round(nbhd.avgPpsf * 700 / 50000) * 50000;
          updates.priceMinIsEstimate = true;
        }

        // Coordinates from community if missing
        if(!p.coordinates && nbhd.lat && nbhd.lng) {
          updates.coordinates = { lat: nbhd.lat, lng: nbhd.lng };
        }
      }

      // 3. Golden Visa eligibility based on price
      if(!p.goldenVisaEligible && p.priceMin >= 2000000) {
        updates.goldenVisaEligible = true;
      }

      // 4. Market segment based on PPSF
      if(!p.marketSegment && (p.ppsf||updates.ppsf)) {
        const ppsf = p.ppsf||updates.ppsf||0;
        updates.marketSegment = ppsf>=3000?"Ultra Luxury":ppsf>=2000?"Luxury":ppsf>=1500?"Premium":ppsf>=1000?"Mid-Market":"Affordable";
      }

      // 5. Property type from description
      if(!p.type&&!p.propertyType) {
        const desc = (p.description||"").toLowerCase();
        if(desc.includes("villa")) updates.type = "Villa";
        else if(desc.includes("townhouse")) updates.type = "Townhouse";
        else updates.type = "Apartment";
      }

      if(Object.keys(updates).length>0) {
        batch.update(d.ref, updates);
        enriched++;
      }
    });
    await batch.commit();
    console.log("Batch "+Math.floor(i/BATCH_SIZE+1)+" done — enriched: "+enriched);
  }

  console.log("\nTotal enriched:", enriched);

  // Final completeness check
  const snap2 = await db.collection("projects").get();
  const active = snap2.docs.map(d=>d.data()).filter(p=>!p.archived);
  const checks = [
    {label:"grossYield",      count:active.filter(p=>p.grossYield>0).length},
    {label:"ppsf",            count:active.filter(p=>p.ppsf>0).length},
    {label:"priceMin",        count:active.filter(p=>p.priceMin>0).length},
    {label:"nearestMetro",    count:active.filter(p=>p.nearestMetro).length},
    {label:"nearestMall",     count:active.filter(p=>p.nearestMall).length},
    {label:"nearestHospital", count:active.filter(p=>p.nearestHospital).length},
    {label:"developerTier",   count:active.filter(p=>p.developerTier).length},
    {label:"serviceCharge",   count:active.filter(p=>p.serviceCharge>0).length},
    {label:"goldenVisa",      count:active.filter(p=>p.goldenVisa).length},
    {label:"coordinates",     count:active.filter(p=>p.coordinates).length},
  ];
  console.log("\n=== FINAL COMPLETENESS ===");
  checks.forEach(c=>console.log(c.label.padEnd(20), c.count+"/"+active.length, Math.round(c.count/active.length*100)+"%"));
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});