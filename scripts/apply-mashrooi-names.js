/**
 * apply-mashrooi-names.js
 * 
 * Reads data/mashrooi-names.json and updates Firestore projects with:
 * - Real English project name
 * - Actual developer name + number
 * - GPS coordinates
 * - Area name
 * - Construction % and status
 * 
 * Run AFTER scrape-mashrooi.js has collected the data.
 * Run: node scripts/apply-mashrooi-names.js --dry
 * Run: node scripts/apply-mashrooi-names.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const fs = require("fs"), path = require("path");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

const DATA_FILE = path.join(__dirname, "../data/mashrooi-names.json");
if (!fs.existsSync(DATA_FILE)) {
  console.error("❌ data/mashrooi-names.json not found. Run scrape-mashrooi.js first.");
  process.exit(1);
}

const MASHROOI = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const successful = Object.entries(MASHROOI).filter(([,v]) => v.success);
console.log(`📂 Loaded ${successful.length} successful lookups from mashrooi-names.json`);

function isNumberedName(name) {
  return /(?:Residences|Villas|Tower|Project|Phase)\s+\d+/.test(name) ||
         /^[\w\s]+-\s+(?:Residences|Villas|Project)\s+\d+$/.test(name);
}

async function main() {
  console.log(`\n🚀 Applying Mashrooi names ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snap = await db.collection("projects").get();
  console.log(`📦 Loaded ${snap.size} Firestore projects`);

  let matched = 0, renamed = 0, enriched = 0, skipped = 0;
  let batch = db.batch(), bc = 0;

  for (const doc of snap.docs) {
    const p = doc.data();
    const num = String(p.projectNumber || p.dldProjectNumber || "");
    if (!num) { skipped++; continue; }

    const m = MASHROOI[num];
    if (!m || !m.success) { skipped++; continue; }

    matched++;
    const u = {};

    // Rename if current name is a numbered placeholder
    if (m.nameEn && isNumberedName(p.name || "")) {
      u.name = m.nameEn;
      u.nameAr = m.nameAr || "";
      u.nameSource = "dld-mashrooi-api";
      renamed++;
    }

    // Developer (actual, not master)
    if (m.developerName && !p.developerActual) {
      u.developerActual = m.developerName;
      u.developerActualNumber = m.developerNumber;
    }

    // Coordinates
    if (m.lat && m.lng && !p.coordinates) {
      u.coordinates = { lat: m.lat, lng: m.lng };
      u.lat = m.lat;
      u.lng = m.lng;
    }

    // Area
    if (m.area && !p.areaEn) u.areaEn = m.area;
    if (m.street && !p.streetEn) u.streetEn = m.street;

    // Construction
    if (m.completionRatio !== undefined && m.completionRatio !== null) {
      u.constructionPct = m.completionRatio;
      if (m.completionRatio >= 100)     u.constructionBand = "Completed";
      else if (m.completionRatio >= 75) u.constructionBand = "Near Completion";
      else if (m.completionRatio >= 50) u.constructionBand = "Mid Construction";
      else if (m.completionRatio >= 25) u.constructionBand = "Early Construction";
      else if (m.completionRatio > 0)   u.constructionBand = "Foundation Stage";
      else                               u.constructionBand = "Pre-Construction";
    }

    if (m.status) {
      const statusMap = { "Finished": "Ready (DLD Registered)", "Active": "Off-Plan (RERA Registered)", "Cancelled": "Cancelled" };
      u.dldProjectStatus = statusMap[m.status] || m.status;
    }

    u.mashrooiEnrichedAt = new Date().toISOString();

    const meaningful = Object.keys(u).filter(k => !k.includes('At')).length;
    if (meaningful < 1) { skipped++; continue; }

    if (matched <= 5 || renamed <= 10) {
      console.log(`  ✅ #${num} "${p.name}" → "${u.name || p.name}" | Dev: ${u.developerActual || "-"}`);
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, u);
      bc++;
      if (bc >= 400) {
        await batch.commit();
        console.log(`  💾 Batch ${bc}`);
        batch = db.batch(); bc = 0;
      }
    }
    enriched++;
  }

  if (!DRY_RUN && bc > 0) {
    await batch.commit();
    console.log(`  💾 Final batch ${bc}`);
  }

  console.log(`\n📊 Matched: ${matched} | Renamed: ${renamed} | Enriched: ${enriched} | Skipped: ${skipped}`);
  if (DRY_RUN) console.log("⚠️  DRY RUN — remove --dry to apply.");
  else console.log("✅ Done!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
