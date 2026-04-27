const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

const DLD_FIXES = [
  { id: "jumeirah-village-circle",  offPlanPct: 72, yoyGrowth: 17.2, sector: "New Dubai" },
  { id: "dubai-south",              offPlanPct: 85, yoyGrowth: 25.4, sector: "Dubai South" },
  { id: "business-bay",             offPlanPct: 77, yoyGrowth: 8.4,  sector: "Trade Center" },
  { id: "dubai-marina",             offPlanPct: 45, yoyGrowth: 9.8,  sector: "New Dubai" },
  { id: "dubai-hills-estate",       offPlanPct: 55, yoyGrowth: 22.1, sector: "MBR City" },
  { id: "sobha-hartland",           offPlanPct: 68, yoyGrowth: 18.4, sector: "MBR City" },
  { id: "damac-hills-2",            offPlanPct: 80, yoyGrowth: 11.3, sector: "Dubailand" },
  { id: "jumeirah-lake-towers-jlt", offPlanPct: 42, yoyGrowth: 7.1,  sector: "New Dubai" },
  { id: "dubai-creek-harbour",      offPlanPct: 82, yoyGrowth: 19.6, sector: "MBR City" },
  { id: "palm-jumeirah",            offPlanPct: 15, yoyGrowth: 14.8, sector: "New Dubai" },
  { id: "al-furjan",                offPlanPct: 65, yoyGrowth: 16.4, sector: "Jebel Ali" },
  { id: "arabian-ranches-3",        offPlanPct: 71, yoyGrowth: 27.8, sector: "Dubailand" },
  { id: "international-city",       offPlanPct: 25, yoyGrowth: 8.3,  sector: "Dubailand" },
  { id: "wadi-al-safa-5",           offPlanPct: 78, yoyGrowth: 14.2, sector: "Dubailand" },
  { id: "dubai-silicon-oasis",      offPlanPct: 58, yoyGrowth: 28.5, sector: "Dubailand" },
  { id: "tilal-al-ghaf",            offPlanPct: 88, yoyGrowth: 21.4, sector: "Dubailand" },
  { id: "arjan",                    offPlanPct: 82, yoyGrowth: 28.5, sector: "New Dubai" },
  { id: "town-square",              offPlanPct: 62, yoyGrowth: 12.4, sector: "Dubailand" },
  { id: "downtown-dubai",           offPlanPct: 48, yoyGrowth: 12.3, sector: "Trade Center" },
  { id: "dubai-sports-city",        offPlanPct: 55, yoyGrowth: 15.4, sector: "New Dubai" },
  { id: "motor-city",               offPlanPct: 48, yoyGrowth: 19.2, sector: "New Dubai" },
  { id: "mirdif",                   offPlanPct: 22, yoyGrowth: 8.1,  sector: "Deira" },
  { id: "al-barsha-1",              offPlanPct: 38, yoyGrowth: 6.8,  sector: "New Dubai" },
  { id: "difc",                     offPlanPct: 35, yoyGrowth: 39.2, sector: "Trade Center" },
  { id: "discovery-gardens",        offPlanPct: 18, yoyGrowth: 9.2,  sector: "Jebel Ali" },
  { id: "al-yalayis-1",             offPlanPct: 85, yoyGrowth: 12.1, sector: "Jebel Ali" },
  { id: "nad-al-sheba",             offPlanPct: 72, yoyGrowth: 18.2, sector: "MBR City" },
  { id: "emaar-beachfront",         offPlanPct: 88, yoyGrowth: 16.8, sector: "New Dubai" },
  { id: "the-oasis-by-emaar",       offPlanPct: 98, yoyGrowth: 0,    sector: "Dubailand" },
  { id: "jumeirah-golf-estates",     offPlanPct: 58, yoyGrowth: 22.0, sector: "New Dubai" },
];

async function run() {
  console.log("\n📊 FIXING DLD VOLUMES...");
  let fixed = 0, skipped = 0;
  for (const fix of DLD_FIXES) {
    const ref = db.collection("dldVolumes").doc(fix.id);
    const doc = await ref.get();
    if (!doc.exists) { console.log(`  SKIP (not found): ${fix.id}`); skipped++; continue; }
    const data = doc.data();
    const updates = { offPlanPct: fix.offPlanPct, yoyGrowth: fix.yoyGrowth, sector: fix.sector };
    if (data.value && data.value > 1000000) {
      updates.value = parseFloat((data.value / 1000000000).toFixed(2));
      updates.valueRaw = data.value;
    }
    console.log(`  ${APPLY?"FIX":"DRY"}: ${data.community} — offPlan:${fix.offPlanPct}% yoy:+${fix.yoyGrowth}% ${updates.value?"val:AED "+updates.value+"B":""}`);
    if (APPLY) await ref.update({ ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    fixed++;
  }
  console.log(`\n✅ ${fixed} fixed, ${skipped} skipped`);
  if (!APPLY) console.log("Run with --apply to execute");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });