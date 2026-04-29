const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const { readFileSync } = require("fs");

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const DRY_RUN = process.argv.includes("--dry");
const UNITS_JSON = "./scripts/dld-units-enrichment.json";
const BATCH_SIZE = 400;

const unitData = JSON.parse(readFileSync(UNITS_JSON, "utf8"));
console.log(`Loaded unit data for ${Object.keys(unitData).length} projects`);

function normalize(str) {
  if (!str) return "";
  return str.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function findMatch(projectName) {
  const normName = normalize(projectName);
  for (const [key, val] of Object.entries(unitData)) {
    if (normalize(key) === normName) return { val, key };
  }
  for (const [key, val] of Object.entries(unitData)) {
    const normKey = normalize(key);
    if (normName.includes(normKey) || normKey.includes(normName)) return { val, key };
  }
  const nameWords = new Set(normName.split(" ").filter(w => w.length > 2));
  let bestMatch = null, bestScore = 0;
  for (const [key, val] of Object.entries(unitData)) {
    const keyWords = normalize(key).split(" ").filter(w => w.length > 2);
    if (!keyWords.length) continue;
    const overlap = keyWords.filter(w => nameWords.has(w)).length;
    const score = overlap / Math.max(keyWords.length, nameWords.size);
    if (score > bestScore && score >= 0.7) { bestScore = score; bestMatch = { val, key }; }
  }
  return bestMatch;
}

async function main() {
  console.log(`\nStarting enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`Loaded ${snapshot.size} projects from Firestore`);

  let matched = 0, notMatched = 0, updated = 0;
  const notMatchedNames = [];
  let batch = db.batch(), batchCount = 0;

  for (const projectDoc of snapshot.docs) {
    const data = projectDoc.data();
    const projectName = data.projectName || data.name || "";
    const result = findMatch(projectName);

    if (!result) { notMatched++; notMatchedNames.push(projectName); continue; }

    matched++;
    const { val: unitInfo, key: matchedKey } = result;
    const updates = {};
    if (unitInfo.sizeMin_sqft && !data.sizeMin)        updates.sizeMin        = unitInfo.sizeMin_sqft;
    if (unitInfo.sizeMax_sqft && !data.sizeMax)        updates.sizeMax        = unitInfo.sizeMax_sqft;
    if (unitInfo.floorMax     && !data.floorMax)       updates.floorMax       = unitInfo.floorMax;
    if (unitInfo.totalUnits   && !data.totalUnits)     updates.totalUnits     = unitInfo.totalUnits;
    if (unitInfo.unitBreakdown && !data.unitBreakdown) updates.unitBreakdown  = unitInfo.unitBreakdown;
    if (!Object.keys(updates).length) continue;

    updates.dldUnitsEnriched = true;
    updates.dldUnitsEnrichedAt = new Date().toISOString();

    if (updated < 5) {
      console.log(`  MATCH: "${projectName}" -> "${matchedKey}"`);
      console.log(`    sizeMin:${unitInfo.sizeMin_sqft} sizeMax:${unitInfo.sizeMax_sqft} floors:${unitInfo.floorMax} units:${unitInfo.totalUnits}`);
      const bd = Object.entries(unitInfo.unitBreakdown||{}).map(([k,v])=>`${k}(${v.count})`).join(", ");
      console.log(`    breakdown: ${bd}`);
    }

    if (!DRY_RUN) {
      batch.update(projectDoc.ref, updates);
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount}`);
        batch = db.batch(); batchCount = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount}`);
  }

  console.log(`\nRESULTS:`);
  console.log(`  Matched:  ${matched}/${snapshot.size}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  No match: ${notMatched}`);
  console.log(`\nUnmatched (first 20):`);
  notMatchedNames.slice(0, 20).forEach(n => console.log(`  - ${n}`));
  if (DRY_RUN) console.log("\nDRY RUN complete - no writes made. Remove --dry to apply.");
  else console.log("\nEnrichment complete!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
