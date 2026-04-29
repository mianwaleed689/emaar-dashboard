/**
 * enrich-communities.js
 * 
 * Enriches community documents by aggregating from project data:
 * - avgYield, avgPpsf from projects in that community
 * - totalProjects, activeProjects count
 * - priceMin, priceMax range
 * - beds available in community
 * - coordinates from project GPS data
 * - investmentScore from existing communityInvestScore
 * - description auto-generated
 * 
 * Run: node scripts/enrich-communities.js --dry
 * Run: node scripts/enrich-communities.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

const EMIRATE = "Dubai";
const COUNTRY = "UAE";

function avg(arr) {
  const valid = arr.filter(v => v && v > 0);
  if (!valid.length) return null;
  return Math.round((valid.reduce((a,b) => a+b, 0) / valid.length) * 100) / 100;
}

function median(arr) {
  const valid = arr.filter(v => v && v > 0).sort((a,b) => a-b);
  if (!valid.length) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[mid] : Math.round((valid[mid-1]+valid[mid])/2);
}

function generateDescription(community, stats) {
  const { totalProjects, activeProjects, priceMin, avgPpsf, avgYield, topDeveloper, bedTypes } = stats;
  
  const priceStr = priceMin ? `Starting from AED ${(priceMin/1000000).toFixed(1)}M` : "";
  const yieldStr = avgYield ? `, with gross yields averaging ${avgYield}%` : "";
  const ppsfStr = avgPpsf ? ` at AED ${avgPpsf}/sqft` : "";
  const bedsStr = bedTypes?.length ? `Available in ${bedTypes.join(", ")} configurations.` : "";
  const devStr = topDeveloper ? ` Primarily developed by ${topDeveloper}.` : "";
  
  return `${community} is a ${EMIRATE} real estate community with ${totalProjects} registered projects (${activeProjects} active). ${priceStr}${ppsfStr}${yieldStr}.${devStr} ${bedsStr}`.trim();
}

async function main() {
  console.log(`\n🚀 Community enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  
  // Load all projects
  const projectSnap = await db.collection("projects").get();
  const projects = projectSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`📦 Loaded ${projects.length} projects`);

  // Load all communities
  const commSnap = await db.collection("communities").get();
  console.log(`📦 Loaded ${commSnap.size} communities`);

  // Group projects by community (exact)
  const byCommunity = {};
  projects.forEach(p => {
    const comm = p.community || p.communityName || "";
    if (!comm) return;
    if (!byCommunity[comm]) byCommunity[comm] = [];
    byCommunity[comm].push(p);
  });

  // Also build normalized map for fuzzy matching
  function normName(s) {
    return (s||"").toLowerCase()
      .replace(/\b(first|second|third|fourth|fifth)\b/gi,"")
      .replace(/\s+/g," ").trim();
  }
  const byNorm = {};
  Object.entries(byCommunity).forEach(([comm, projs]) => {
    const n = normName(comm);
    if (!byNorm[n]) byNorm[n] = [];
    byNorm[n].push(...projs);
  });

  let updated = 0, skipped = 0;
  let batch = db.batch(), bc = 0;

  for (const doc of commSnap.docs) {
    const c = doc.data();
    const name = c.name || c.communityName || doc.id;
    // Try exact match first, then normalized match
    const communityProjects = byCommunity[name] || byNorm[normName(name)] || [];
    
    if (communityProjects.length === 0) { skipped++; continue; }

    const updates = {};

    // ── Project counts ────────────────────────────────────────────────────
    const total = communityProjects.length;
    const active = communityProjects.filter(p => !p.archived && p.active !== false).length;
    const historical = communityProjects.filter(p => p.lifecycleStage === "historical").length;
    const offplan = communityProjects.filter(p => p.lifecycleStage !== "historical").length;

    if (!c.totalProjects) updates.totalProjects = total;
    updates.activeProjects = active;
    updates.historicalProjects = historical;
    updates.offplanProjects = offplan;

    // ── Price data ────────────────────────────────────────────────────────
    const prices = communityProjects.filter(p => p.priceMin && p.priceMin > 0 && !p.priceMinIsEstimate).map(p => p.priceMin);
    if (prices.length) {
      updates.priceMin = Math.min(...prices);
      updates.priceMax = Math.max(...prices);
      updates.priceMedian = median(prices);
    }

    // ── Yield ─────────────────────────────────────────────────────────────
    const yields = communityProjects.map(p => p.grossYield).filter(v => v && v > 0);
    const avgYieldVal = avg(yields);
    if (avgYieldVal && !c.avgYield) {
      updates.avgYield = avgYieldVal;
      updates.grossYield = avgYieldVal;
    }

    // ── PPSF ──────────────────────────────────────────────────────────────
    const ppsfs = communityProjects.map(p => p.ppsf || p.avgPpsf).filter(v => v && v > 0);
    const avgPpsfVal = avg(ppsfs);
    if (avgPpsfVal && !c.avgPpsf) {
      updates.avgPpsf = avgPpsfVal;
      updates.ppsf = avgPpsfVal;
    }

    // ── Investment score ──────────────────────────────────────────────────
    const scores = communityProjects.map(p => p.investmentScore || p.communityInvestScore).filter(v => v && v > 0);
    if (scores.length && !c.investmentScore) {
      updates.investmentScore = Math.round(avg(scores));
    }

    // ── Coordinates from projects ─────────────────────────────────────────
    if (!c.lat && !c.coordinates) {
      const withCoords = communityProjects.filter(p => p.lat && p.lng);
      if (withCoords.length) {
        const lats = withCoords.map(p => p.lat);
        const lngs = withCoords.map(p => p.lng);
        const centerLat = avg(lats);
        const centerLng = avg(lngs);
        if (centerLat && centerLng) {
          updates.lat = centerLat;
          updates.lng = centerLng;
          updates.coordinates = { lat: centerLat, lng: centerLng };
        }
      }
    }

    // ── Beds available ─────────────────────────────────────────────────────
    const allBeds = new Set();
    communityProjects.forEach(p => {
      if (p.beds && Array.isArray(p.beds)) p.beds.forEach(b => allBeds.add(b));
    });
    if (allBeds.size > 0) {
      const bedOrder = ["Studio","1BR","2BR","3BR","4BR","5BR","6BR","7BR"];
      updates.bedsAvailable = [...allBeds].sort((a,b) => bedOrder.indexOf(a) - bedOrder.indexOf(b));
    }

    // ── Top developer ─────────────────────────────────────────────────────
    const devCounts = {};
    communityProjects.forEach(p => {
      const dev = p.developer || "";
      if (dev) devCounts[dev] = (devCounts[dev] || 0) + 1;
    });
    const topDev = Object.entries(devCounts).sort((a,b) => b[1]-a[1])[0]?.[0];
    if (topDev) updates.topDeveloper = topDev;

    // ── Service charge ─────────────────────────────────────────────────────
    const scs = communityProjects.map(p => p.serviceCharge).filter(v => v && v > 0);
    if (scs.length && !c.avgServiceCharge) {
      updates.avgServiceCharge = avg(scs);
    }

    // ── Supply risk ────────────────────────────────────────────────────────
    const supplyRisks = communityProjects.map(p => p.supplyRisk).filter(v => v);
    if (supplyRisks.length && !c.supplyRisk) {
      const riskCounts = {};
      supplyRisks.forEach(r => riskCounts[r] = (riskCounts[r]||0)+1);
      updates.supplyRisk = Object.entries(riskCounts).sort((a,b)=>b[1]-a[1])[0][0];
    }

    // ── Location fields ────────────────────────────────────────────────────
    if (!c.emirate) updates.emirate = EMIRATE;
    if (!c.country) updates.country = COUNTRY;
    if (!c.city) updates.city = EMIRATE;

    // ── Description ───────────────────────────────────────────────────────
    if (!c.description && total > 0) {
      updates.description = generateDescription(name, {
        totalProjects: total,
        activeProjects: active,
        priceMin: updates.priceMin || c.priceMin,
        avgPpsf: avgPpsfVal,
        avgYield: avgYieldVal,
        topDeveloper: topDev,
        bedTypes: updates.bedsAvailable?.slice(0, 4),
      });
    }

    // ── Data quality ───────────────────────────────────────────────────────
    updates.communityEnrichedAt = new Date().toISOString();
    updates.dataSource = "aggregated-from-projects-apr-2026";

    const meaningful = Object.keys(updates).filter(k => !k.includes('At') && !k.includes('Source')).length;
    if (meaningful === 0) { skipped++; continue; }

    if (updated < 5) {
      console.log(`\n  ✅ "${name}" (${total} projects)`);
      if (updates.avgYield) console.log(`     Yield: ${updates.avgYield}%`);
      if (updates.avgPpsf) console.log(`     PPSF: AED ${updates.avgPpsf}`);
      if (updates.priceMin) console.log(`     Price: AED ${(updates.priceMin/1000000).toFixed(1)}M - ${((updates.priceMax||0)/1000000).toFixed(1)}M`);
      if (updates.coordinates) console.log(`     Coords: ${updates.coordinates.lat}, ${updates.coordinates.lng}`);
      if (updates.bedsAvailable) console.log(`     Beds: ${updates.bedsAvailable.join(", ")}`);
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, updates);
      bc++;
      if (bc >= 400) {
        await batch.commit();
        console.log(`  💾 Committed batch of ${bc}`);
        batch = db.batch(); bc = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && bc > 0) {
    await batch.commit();
    console.log(`  💾 Final batch of ${bc}`);
  }

  console.log(`\n📊 RESULTS:`);
  console.log(`  Updated: ${updated} communities`);
  console.log(`  Skipped: ${skipped} (no projects found)`);
  if (DRY_RUN) console.log("\n⚠️  DRY RUN — remove --dry to apply.");
  else console.log("\n✅ Done!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
