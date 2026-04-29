/**
 * scrape-mashrooi-details.js v2
 * 
 * Gets detailed data per project using the correct Mashrooi API fields:
 * - rooms (bed types)
 * - sizing (unit sizes in sqm)
 * - buidlings (floors, building number) — yes, DLD typo
 * - functions (unit breakdown: 129×1BR, 159×2BR etc.)
 * - totalUnits, totalArea (plot size)
 * - GPS coordinates
 * 
 * Run: node scripts/scrape-mashrooi-details.js --limit 20 --dry
 * Run: node scripts/scrape-mashrooi-details.js --limit 20
 * Run: node scripts/scrape-mashrooi-details.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const args = process.argv.slice(2);
const LIMIT = parseInt(args[args.indexOf("--limit") + 1]) || 0;
const DRY_RUN = args.includes("--dry");
const DELAY_MS = 1200;
const CONSUMER_ID = "gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F";

const OUTPUT_FILE = path.join(__dirname, "../data/mashrooi-details.json");
let details = {};
if (fs.existsSync(OUTPUT_FILE)) {
  details = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  console.log(`📂 Resuming: ${Object.keys(details).length} already fetched`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const params = {
    ApplicationKey: "MyBrowser", MethodIdentity: "guest", MethodPasscode: "",
    Platform: "DESKTOP", Method: "ANONYMOUS", DeviceKey: `dxb-analytics-${Date.now()}`,
  };
  return new Promise((resolve) => {
    const authHeader = "Basic " + Buffer.from(JSON.stringify(params)).toString("base64");
    const options = {
      hostname: "b2c.dubailand.gov.ae", path: "/mashrooi/authenticate", method: "POST",
      headers: {
        "consumer-id": CONSUMER_ID, "Authorization": authHeader,
        "Content-Type": "application/json", "Origin": "https://dubailand.gov.ae",
        "User-Agent": "Mozilla/5.0",
      }, timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(res.headers["token"] || res.headers["Token"] || null));
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

function getProject(projectNumber, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: "b2c.dubailand.gov.ae",
      path: `/mashrooi/projects/${projectNumber}`,
      method: "GET",
      headers: {
        "consumer-id": CONSUMER_ID, "Token": token,
        "Accept": "application/json", "Origin": "https://dubailand.gov.ae",
        "User-Agent": "Mozilla/5.0",
      }, timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const newToken = res.headers["token"] || res.headers["Token"] || null;
        try {
          if (res.statusCode === 401) return resolve({ auth: true, newToken });
          if (res.statusCode === 404) return resolve({ notFound: true, newToken });
          const json = JSON.parse(data);
          resolve({ json, newToken, status: res.statusCode });
        } catch(e) { resolve({ error: e.message, newToken }); }
      });
    });
    req.on("error", e => resolve({ error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ error: "timeout" }); });
    req.end();
  });
}

function parseProjectDetails(p) {
  const result = {};

  // ── Unit breakdown from functions ──────────────────────────────────────────
  const unitBreakdown = {};
  let totalResidential = 0;
  let totalCommercial = 0;

  if (p.functions && Array.isArray(p.functions)) {
    p.functions.forEach(fn => {
      const fnName = fn.name?.englishName || "";
      if (fn.rooms && Array.isArray(fn.rooms)) {
        fn.rooms.forEach(room => {
          const count = parseInt(room.value) || 0;
          const roomName = room.name?.englishName || "";
          if (fnName === "Residential" || fnName.includes("Residential")) {
            // Parse bed count: "1 B/R" → "1BR", "NA" → "Studio", "غير معرف" → "Studio"
            let bedType = "Studio";
            if (roomName.match(/(\d+)\s*B\/R/i)) {
              bedType = `${roomName.match(/(\d+)\s*B\/R/i)[1]}BR`;
            } else if (roomName.match(/(\d+)\s*bedroom/i)) {
              bedType = `${roomName.match(/(\d+)\s*bedroom/i)[1]}BR`;
            }
            unitBreakdown[bedType] = (unitBreakdown[bedType] || 0) + count;
            totalResidential += count;
          } else if (fnName === "Commercial" || fnName.includes("Commercial")) {
            totalCommercial += count;
          }
        });
      }
    });
  }

  if (Object.keys(unitBreakdown).length > 0) {
    result.unitBreakdown = unitBreakdown;
    result.totalResidentialUnits = totalResidential;
    result.totalCommercialUnits = totalCommercial;
    result.beds = Object.keys(unitBreakdown).sort();
  }

  // ── Sizing (sqm → sqft) ────────────────────────────────────────────────────
  if (p.sizing && Array.isArray(p.sizing) && p.sizing.length > 0) {
    const validSizes = p.sizing.filter(s => s > 0);
    if (validSizes.length > 0) {
      const minSqm = Math.min(...validSizes);
      const maxSqm = Math.max(...validSizes);
      result.sizeMinSqM = minSqm;
      result.sizeMaxSqM = maxSqm;
      result.sizeMin = Math.round(minSqm * 10.764); // sqm → sqft
      result.sizeMax = Math.round(maxSqm * 10.764);
    }
  }

  // ── Buildings / floors ─────────────────────────────────────────────────────
  if (p.buidlings && Array.isArray(p.buidlings) && p.buidlings.length > 0) {
    const building = p.buidlings[0];
    if (building.floorCount) result.totalFloors = building.floorCount;
    if (building.number) result.dldBuildingNumber = building.number;
  }

  // ── Title / core fields ────────────────────────────────────────────────────
  if (p.title) {
    if (p.title.totalUnits) result.totalUnits = Math.round(p.title.totalUnits);
    if (p.title.totalArea) result.plotSizeSqM = Math.round(p.title.totalArea);
    if (p.title.worth && p.title.worth > 0) result.projectValueAED = p.title.worth;
    if (p.title.developer?.name?.englishName) result.developerActualName = p.title.developer.name.englishName;
    if (p.title.developer?.number) result.developerActualNumber = p.title.developer.number;
  }

  // ── Location ───────────────────────────────────────────────────────────────
  if (p.location?.googleCoordinates) {
    result.lat = p.location.googleCoordinates.latitude;
    result.lng = p.location.googleCoordinates.longitude;
    result.coordinates = { lat: result.lat, lng: result.lng };
  }
  if (p.location?.area?.englishName) result.areaEn = p.location.area.englishName;
  if (p.location?.street?.englishName) result.streetEn = p.location.street.englishName;

  return result;
}

async function main() {
  console.log("🔑 Getting token...");
  let token = await getToken();
  if (!token) { console.error("❌ Auth failed"); process.exit(1); }
  console.log("✅ Auto-auth successful!\n");

  // Load all projects from Firestore
  const snap = await db.collection("projects").get();
  const docMap = {};
  snap.docs.forEach(d => {
    const p = d.data();
    const n = String(p.projectNumber || p.dldProjectNumber || "");
    if (n) docMap[n] = { ref: d.ref, data: p };
  });

  const projectNumbers = Object.keys(docMap).filter(n => n && /^\d+$/.test(n) && !details[n]);
  const toProcess = LIMIT > 0 ? projectNumbers.slice(0, LIMIT) : projectNumbers;

  console.log(`📋 Total projects: ${Object.keys(docMap).length} | Already done: ${Object.keys(details).length} | To process: ${toProcess.length}`);
  console.log(`⏱️  Est: ~${Math.round(toProcess.length * DELAY_MS / 60000)} min\n`);

  let processed = 0, withUnits = 0, withFloors = 0, errors = 0;
  let batch = db.batch(), bc = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const num = toProcess[i];

    let res = await getProject(num, token);
    if (res.newToken) token = res.newToken;

    if (res.auth) {
      console.log(`\n🔄 Re-authenticating...`);
      token = await getToken();
      if (!token) break;
      res = await getProject(num, token);
    }

    if (res.notFound) {
      details[num] = { notFound: true };
      processed++;
      await sleep(DELAY_MS);
      continue;
    }

    if (res.error || !res.json) {
      errors++;
      if (errors <= 3) console.log(`  ❌ #${num}: ${res.error || "no data"}`);
      await sleep(DELAY_MS);
      continue;
    }

    const project = res.json.response?.project;
    if (!project) { processed++; await sleep(DELAY_MS); continue; }

    const parsed = parseProjectDetails(project);
    details[num] = { ...parsed, fetchedAt: new Date().toISOString() };
    processed++;

    if (parsed.unitBreakdown) withUnits++;
    if (parsed.totalFloors) withFloors++;

    // Log first few
    if (withUnits <= 8) {
      const doc = docMap[num];
      const name = doc?.data?.name || num;
      console.log(`  ✅ #${num} "${name}"`);
      if (parsed.unitBreakdown) console.log(`     Units: ${JSON.stringify(parsed.unitBreakdown)} | Total: ${parsed.totalResidentialUnits}`);
      if (parsed.totalFloors) console.log(`     Floors: ${parsed.totalFloors} | Plot: ${parsed.plotSizeSqM} sqm`);
      if (parsed.sizeMin) console.log(`     Sizes: ${parsed.sizeMin}-${parsed.sizeMax} sqft`);
    }

    // Update Firestore
    if (!DRY_RUN && docMap[num]) {
      const existing = docMap[num].data;
      const updates = {};

      if (parsed.unitBreakdown) updates.unitBreakdown = parsed.unitBreakdown;
      if (parsed.beds?.length && (!existing.beds || existing.beds.length === 0)) updates.beds = parsed.beds;
      if (parsed.totalUnits && !existing.totalUnits) updates.totalUnits = parsed.totalUnits;
      if (parsed.totalResidentialUnits) updates.totalResidentialUnits = parsed.totalResidentialUnits;
      if (parsed.totalCommercialUnits) updates.totalCommercialUnits = parsed.totalCommercialUnits;
      if (parsed.totalFloors && !existing.totalFloors) updates.totalFloors = parsed.totalFloors;
      if (parsed.sizeMin && !existing.sizeMin) updates.sizeMin = parsed.sizeMin;
      if (parsed.sizeMax && !existing.sizeMax) updates.sizeMax = parsed.sizeMax;
      if (parsed.sizeMinSqM) updates.sizeMinSqM = parsed.sizeMinSqM;
      if (parsed.plotSizeSqM && !existing.plotSizeSqM) updates.plotSizeSqM = parsed.plotSizeSqM;
      if (parsed.coordinates && !existing.coordinates) updates.coordinates = parsed.coordinates;
      if (parsed.lat && !existing.lat) updates.lat = parsed.lat;
      if (parsed.lng && !existing.lng) updates.lng = parsed.lng;
      if (parsed.developerActualName && !existing.developerActual) updates.developerActual = parsed.developerActualName;
      if (parsed.projectValueAED) updates.projectValueAED = parsed.projectValueAED;
      if (parsed.dldBuildingNumber) updates.dldBuildingNumber = parsed.dldBuildingNumber;

      updates.mashrooiDetailEnrichedAt = new Date().toISOString();

      if (Object.keys(updates).length > 1) {
        batch.update(docMap[num].ref, updates);
        bc++;
        if (bc >= 400) {
          await batch.commit();
          console.log(`  💾 Committed batch of ${bc}`);
          batch = db.batch(); bc = 0;
        }
      }
    }

    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(details, null, 2));
      console.log(`  📊 ${i+1}/${toProcess.length} | With units: ${withUnits} | With floors: ${withFloors} | Errors: ${errors}`);
    }

    await sleep(DELAY_MS);
  }

  if (!DRY_RUN && bc > 0) {
    await batch.commit();
    console.log(`  💾 Final batch of ${bc}`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(details, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   With unit breakdown: ${withUnits}`);
  console.log(`   With floor count: ${withFloors}`);
  console.log(`   Errors: ${errors}`);
  if (DRY_RUN) console.log("\n⚠️  DRY RUN — remove --dry to apply to Firestore");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
