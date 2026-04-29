const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// COMMUNITY SYNC SCRIPT
// Run this whenever projects are added/updated
// It recalculates community stats from actual project data

async function syncCommunitiesFromProjects() {
  console.log("Starting community sync from projects...\n");

  // Load all projects
  const projectsSnap = await db.collection("projects").get();
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Total projects:", projects.length);

  // Group by community
  const byComm = {};
  projects.forEach(p => {
    const comm = (p.community || p.area || "").trim();
    if (!comm) return;
    if (!byComm[comm]) byComm[comm] = [];
    byComm[comm].push(p);
  });

  console.log("Communities with projects:", Object.keys(byComm).length);

  // Load all neighbourhoodScores
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d => {
    nbhdMap[d.data().community] = { ref: d.ref, ...d.data() };
  });

  const batch = db.batch();
  let updated = 0;
  let notFound = [];

  for (const [comm, projs] of Object.entries(byComm)) {
    // Find matching community in neighbourhoodScores
    const nbhd = nbhdMap[comm] || 
      Object.values(nbhdMap).find(n => 
        n.community.toLowerCase() === comm.toLowerCase()
      );

    if (!nbhd) {
      notFound.push(comm);
      continue;
    }

    // Calculate stats from projects
    const totalProjects  = projs.length;
    const prices         = projs.filter(p => p.priceMin > 0).map(p => p.priceMin);
    const ppsfs          = projs.filter(p => p.ppsf > 0 || p.avgPpsf > 0).map(p => p.ppsf || p.avgPpsf);
    const offplanCount   = projs.filter(p => p.status === "Off-Plan" || p.isOffPlan).length;
    const readyCount     = projs.filter(p => p.status === "Ready" || p.status === "Completed").length;
    const hasVilla       = projs.some(p => (p.type||"").toLowerCase().includes("villa"));
    const hasApt         = projs.some(p => (p.type||"").toLowerCase().includes("apt") || (p.type||"").toLowerCase().includes("flat"));

    // Price stats
    const priceMin = prices.length > 0 ? Math.min(...prices) : null;
    const priceMax = prices.length > 0 ? Math.max(...prices) : null;

    // PPSF from projects (weighted by unit count)
    let projectPpsf = null;
    if (ppsfs.length > 0) {
      projectPpsf = Math.round(ppsfs.reduce((s, p) => s + p, 0) / ppsfs.length);
    }

    // Supply risk calculation
    // More off-plan projects = higher supply risk
    let supplyRisk = nbhd.supplyRisk || "Low";
    if (offplanCount >= 10)     supplyRisk = "High";
    else if (offplanCount >= 5) supplyRisk = "Medium";
    else if (offplanCount >= 3) supplyRisk = "Low-Medium";
    else                        supplyRisk = "Low";

    // Golden Visa eligibility — if any project has min price >= 2M
    const goldenVisa = priceMin ? priceMin >= 2000000 : nbhd.goldenVisa;

    // Build update
    const updates = {
      totalProjects,
      offplanCount,
      readyCount,
      hasVilla:    hasVilla || nbhd.hasVilla || false,
      hasApt:      hasApt || nbhd.hasApt || false,
      supplyRisk,
      goldenVisa,
      updatedAt:   new Date().toISOString(),
      dataSource:  "project-sync-2026",
    };

    // Only update PPSF if we have project data and it's reasonable
    if (projectPpsf && projectPpsf > 500 && projectPpsf < 10000) {
      // Weighted average: 70% existing research data + 30% project data
      const existingPpsf = nbhd.avgPpsf || projectPpsf;
      updates.avgPpsf = Math.round(existingPpsf * 0.7 + projectPpsf * 0.3);
    }

    if (priceMin && priceMin > 0) updates.priceMin = priceMin;
    if (priceMax && priceMax > 0) updates.priceMax = priceMax;

    // Recalculate investment score
    const grossY = parseFloat(nbhd.grossYield || 0);
    const distM  = parseFloat(nbhd.distMetro || 99);
    const ppsf   = updates.avgPpsf || nbhd.avgPpsf || 0;
    let score = 0;
    if(grossY>=9) score+=30; else if(grossY>=8) score+=26; else if(grossY>=7) score+=22; else if(grossY>=6) score+=16; else if(grossY>=5) score+=10; else score+=5;
    const txns = nbhd.dldTransactions || 0;
    if(txns>=3000) score+=25; else if(txns>=1000) score+=20; else if(txns>=500) score+=14; else if(txns>=200) score+=8; else if(txns>=50) score+=4;
    if(ppsf>=3000) score+=12; else if(ppsf>=2000) score+=16; else if(ppsf>=1500) score+=18; else if(ppsf>=1000) score+=20; else if(ppsf>=700) score+=16; else score+=8;
    if(supplyRisk==="Low") score+=15; else if(supplyRisk==="Low-Medium") score+=12; else if(supplyRisk==="Medium") score+=10; else if(supplyRisk==="High") score+=3; else score+=7;
    if(distM<0.5) score+=10; else if(distM<1) score+=8; else if(distM<2) score+=6; else if(distM<3) score+=4; else if(distM<5) score+=2;
    updates.investmentScore = Math.min(100, Math.round(score));

    batch.update(nbhd.ref, updates);
    updated++;
    console.log(`${comm.padEnd(35)} | projects:${totalProjects} | offplan:${offplanCount} | risk:${supplyRisk} | score:${updates.investmentScore}`);
  }

  await batch.commit();
  console.log("\n=== SYNC COMPLETE ===");
  console.log("Communities updated:", updated);
  console.log("Communities not found:", notFound.length);
  if(notFound.length) {
    console.log("Not found:", notFound.slice(0,10).join(", "));
  }
  process.exit(0);
}

syncCommunitiesFromProjects().catch(e=>{console.error(e);process.exit(1);});