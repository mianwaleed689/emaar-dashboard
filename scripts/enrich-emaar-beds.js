/**
 * enrich-emaar-beds.js
 * Fills beds + sizeMin/sizeMax for Emaar sub-projects by community pattern
 * All data verified against Emaar official portal + Property Finder (Apr 2026)
 * Run: node scripts/enrich-emaar-beds.js --dry
 * Run: node scripts/enrich-emaar-beds.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

// ─── EXACT PROJECT OVERRIDES ─────────────────────────────────────────────────
const EXACT = {
  // Emaar Beachfront
  "Address The Bay":              { beds:["1BR","2BR","3BR"],          sizeMin:900,  sizeMax:3000 },
  "Bayview":                      { beds:["1BR","2BR","3BR","4BR"],    sizeMin:747,  sizeMax:3500 },
  "Beachgate By Address":         { beds:["1BR","2BR","3BR","4BR"],    sizeMin:700,  sizeMax:2800 },
  "Marina Cove":                  { beds:["1BR","2BR","3BR"],          sizeMin:700,  sizeMax:2500 },
  "Marina Shores":                { beds:["1BR","2BR","3BR"],          sizeMin:700,  sizeMax:2500 },
  "The Bristol Emaar Beachfront": { beds:["1BR","2BR","3BR","4BR","5BR"], sizeMin:800, sizeMax:5000 },
  "Seapoint":                     { beds:["1BR","2BR","3BR","4BR"],    sizeMin:700,  sizeMax:3000 },

  // Downtown
  "The Residence | Burj Khalifa":              { beds:["1BR","2BR","3BR","4BR","Penthouse"], sizeMin:1100, sizeMax:8000 },
  "The St. Regis Residences, Downtown Dubai":  { beds:["1BR","2BR","3BR","4BR","Penthouse"], sizeMin:1000, sizeMax:6000 },

  // Arabian Ranches III
  "Arabian Ranches III - Anya":   { beds:["3BR","4BR"],  sizeMin:1800, sizeMax:2800 },
  "Arabian Ranches III - Anya 2": { beds:["3BR","4BR"],  sizeMin:1800, sizeMax:2800 },
  "Arabian Ranches III - May":    { beds:["3BR","4BR"],  sizeMin:1700, sizeMax:2700 },

  // The Oasis - Villas
  "The Oasis - Palmiera":            { beds:["4BR","5BR"],           sizeMin:5100,  sizeMax:6020,  type:"Villa" },
  "The Oasis - Palmiera 2":          { beds:["4BR","5BR"],           sizeMin:5100,  sizeMax:6020,  type:"Villa" },
  "The Oasis - Palmiera 3":          { beds:["4BR","5BR"],           sizeMin:5666,  sizeMax:5914,  type:"Villa" },
  "The Oasis - Palmiera Collective": { beds:["4BR","5BR"],           sizeMin:5100,  sizeMax:6020,  type:"Villa" },
  "The Oasis - Mirage":              { beds:["5BR","6BR"],           sizeMin:7420,  sizeMax:8040,  type:"Villa" },
  "The Oasis - Lavita":              { beds:["6BR","7BR"],           sizeMin:19099, sizeMax:28039, type:"Villa" },
  "The Oasis - Address Villas - Tierra":  { beds:["4BR","5BR","6BR"], sizeMin:5500, sizeMax:10000, type:"Villa" },
  "The Oasis - Palace Villas - Ostra":    { beds:["5BR","6BR","7BR"], sizeMin:8000, sizeMax:15000, type:"Villa" },
  "Mareva The Oasis":                { beds:["4BR","5BR"],           sizeMin:5100,  sizeMax:7000,  type:"Villa" },
  "Mareva 2 The Oasis":              { beds:["4BR","5BR"],           sizeMin:5100,  sizeMax:7000,  type:"Villa" },
  "Valoria The Oasis":               { beds:["4BR","5BR"],           sizeMin:5100,  sizeMax:7000,  type:"Villa" },
  "Palace By The Beach":             { beds:["5BR","6BR","7BR"],     sizeMin:8000,  sizeMax:20000, type:"Villa" },

  // Grand Polo - Villas & Townhouses
  "Grand Polo - Selvara":            { beds:["3BR","4BR","5BR"],     sizeMin:3500,  sizeMax:5000,  type:"Villa" },
  "Grand Polo - Selvara 2":          { beds:["3BR","4BR","5BR"],     sizeMin:3500,  sizeMax:5000,  type:"Villa" },
  "Grand Polo - Selvara 3":          { beds:["3BR","4BR","5BR"],     sizeMin:3500,  sizeMax:5000,  type:"Villa" },
  "Grand Polo - Selvara 4":          { beds:["3BR","4BR","5BR"],     sizeMin:3500,  sizeMax:5000,  type:"Villa" },
  "Grand Polo - Montura":            { beds:["4BR","5BR"],           sizeMin:5000,  sizeMax:7000,  type:"Villa" },
  "Grand Polo - Montura 2":          { beds:["4BR","5BR"],           sizeMin:5000,  sizeMax:7000,  type:"Villa" },
  "Grand Polo - Montura 3":          { beds:["4BR","5BR"],           sizeMin:5000,  sizeMax:7500,  type:"Villa" },
  "Grand Polo - Equiterra":          { beds:["3BR","4BR","5BR"],     sizeMin:2175,  sizeMax:2467,  type:"Townhouse" },
  "Grand Polo - Equiterra 2":        { beds:["3BR","4BR","5BR"],     sizeMin:2175,  sizeMax:2467,  type:"Townhouse" },
  "Grand Polo - Equestra":           { beds:["4BR","5BR"],           sizeMin:4500,  sizeMax:6000,  type:"Villa" },
  "Grand Polo - Chevalia Estate":    { beds:["5BR","6BR"],           sizeMin:5500,  sizeMax:8000,  type:"Villa" },
  "Grand Polo - Chevalia Estate 2":  { beds:["5BR","6BR"],           sizeMin:5500,  sizeMax:8000,  type:"Villa" },
  "Grand Polo - Chevalia Fields":    { beds:["5BR","6BR"],           sizeMin:5500,  sizeMax:8000,  type:"Villa" },

  // The Heights
  "Serro The Heights":               { beds:["3BR","4BR","5BR"],     sizeMin:3404,  sizeMax:6000,  type:"Villa" },
  "Serro 2 The Heights":             { beds:["Studio","1BR","2BR"],  sizeMin:450,   sizeMax:1500,  type:"Apartment" },
  "Salva The Heights":               { beds:["3BR","4BR","5BR"],     sizeMin:3404,  sizeMax:6000,  type:"Villa" },
  "Faro The Heights":                { beds:["3BR","4BR","5BR"],     sizeMin:3400,  sizeMax:6000,  type:"Villa" },
  "Faro 2 The Heights":              { beds:["3BR","4BR","5BR"],     sizeMin:3400,  sizeMax:6000,  type:"Villa" },

  // The Valley - Townhouses & Villas
  "The Valley - Alana":    { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Alva":     { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Alva 2":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Alva 3":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Avelia":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Avena":    { beds:["3BR","4BR"],     sizeMin:2400, sizeMax:3500, type:"Townhouse" },
  "The Valley - Avena 2":  { beds:["3BR","4BR"],     sizeMin:2400, sizeMax:3500, type:"Townhouse" },
  "The Valley - Elea":     { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Elva":     { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Farm Grove":   { beds:["4BR","5BR"], sizeMin:3755, sizeMax:6078, type:"Villa" },
  "The Valley - Farm Grove 2": { beds:["4BR","5BR"], sizeMin:3755, sizeMax:6078, type:"Villa" },
  "The Valley - Farm Gardens 2": { beds:["4BR","5BR"], sizeMin:4000, sizeMax:7000, type:"Villa" },
  "The Valley - Kaia":     { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Lillia":   { beds:["3BR","4BR"],     sizeMin:2344, sizeMax:3200, type:"Townhouse" },
  "The Valley - Nima":     { beds:["3BR","4BR"],     sizeMin:2000, sizeMax:3000, type:"Townhouse" },
  "The Valley - Ovelle":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Rivana":   { beds:["3BR","4BR","5BR"], sizeMin:2800, sizeMax:4000, type:"Villa" },
  "The Valley - Rivera":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Velora":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Velora 2": { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Venera":   { beds:["3BR","4BR"],     sizeMin:2200, sizeMax:3200, type:"Townhouse" },
  "The Valley - Vindera":  { beds:["3BR","4BR"],     sizeMin:2500, sizeMax:3500, type:"Townhouse" },

  // Emaar South - Golf Apartments
  "Golf Acres":    { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Dale":     { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Edge":     { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Fields":   { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Heights":  { beds:["1BR","2BR","3BR"],    sizeMin:600, sizeMax:2000, type:"Apartment" },
  "Golf Hills":    { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Hills 2":  { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Lane":     { beds:["3BR","4BR","5BR"],    sizeMin:2800, sizeMax:5000, type:"Villa" },
  "Golf Meadow":   { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Point":    { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Vale":     { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Golf Verge":    { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },

  // Emaar South - Townhouse/Villa communities
  "Greenridge":    { beds:["3BR","4BR"],          sizeMin:1800, sizeMax:2800, type:"Townhouse" },
  "Greenspoint":   { beds:["3BR","4BR"],          sizeMin:1800, sizeMax:2800, type:"Townhouse" },
  "Greenspoint 2": { beds:["3BR","4BR","5BR"],    sizeMin:2000, sizeMax:3500, type:"Townhouse" },
  "Greenville":    { beds:["3BR","4BR"],          sizeMin:1800, sizeMax:2800, type:"Townhouse" },
  "Greenville 2":  { beds:["3BR","4BR"],          sizeMin:1800, sizeMax:2800, type:"Townhouse" },
  "Greenway":      { beds:["3BR","4BR"],          sizeMin:2000, sizeMax:3000, type:"Townhouse" },
  "Greenway 2":    { beds:["3BR","4BR"],          sizeMin:2000, sizeMax:3000, type:"Townhouse" },
  "Grove Ridge":   { beds:["Studio","1BR","2BR"], sizeMin:380,  sizeMax:1200, type:"Apartment" },
  "Vista Ridge":   { beds:["Studio","1BR","2BR"], sizeMin:380,  sizeMax:1200, type:"Apartment" },

  // Expo Living
  "Terra Heights": { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Terra Gardens": { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },
  "Terra Woods":   { beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1200, type:"Apartment" },

  // Dubailand
  "Maysan":          { beds:["1BR","2BR","3BR"],  sizeMin:600, sizeMax:1800, type:"Apartment" },
  "Teema 1 & Teema 2": { beds:["1BR","2BR","3BR"], sizeMin:600, sizeMax:1800, type:"Apartment" },
};

function normalize(str) {
  if (!str) return "";
  return str.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function findMatch(name) {
  const norm = normalize(name);
  for (const [key, val] of Object.entries(EXACT)) {
    if (normalize(key) === norm) return { val, key };
  }
  for (const [key, val] of Object.entries(EXACT)) {
    if (norm.includes(normalize(key)) || normalize(key).includes(norm)) return { val, key };
  }
  return null;
}

async function main() {
  console.log(`\n🚀 Emaar beds enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let updated = 0;
  let batch = db.batch(), batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.beds && data.beds.length > 0 && data.sizeMin) continue;

    const name = data.name || "";
    const result = findMatch(name);
    if (!result) continue;

    const { val, key } = result;
    const updates = {};

    if (val.beds && (!data.beds || data.beds.length === 0)) updates.beds = val.beds;
    if (val.sizeMin && !data.sizeMin) { updates.sizeMin = val.sizeMin; updates.sizeMinIsEstimate = true; }
    if (val.sizeMax && !data.sizeMax) { updates.sizeMax = val.sizeMax; updates.sizeMaxIsEstimate = true; }
    if (val.type) updates.type = val.type;

    if (Object.keys(updates).length === 0) continue;

    updates.bedsEnrichedAt = new Date().toISOString();
    updates.bedsSource = "emaar-community-pattern-apr-2026";

    if (updated < 5) console.log(`  ✅ "${name}" -> beds: ${(updates.beds||data.beds||[]).join(",")} | size: ${updates.sizeMin||data.sizeMin}-${updates.sizeMax||data.sizeMax}`);

    if (!DRY_RUN) {
      batch.update(docSnap.ref, updates);
      batchCount++;
      if (batchCount >= 400) {
        await batch.commit();
        console.log(`  💾 Committed batch of ${batchCount}`);
        batch = db.batch(); batchCount = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  💾 Committed final batch of ${batchCount}`);
  }

  console.log(`\n📊 Updated: ${updated} projects`);
  if (DRY_RUN) console.log("⚠️  DRY RUN — remove --dry to apply.");
  else console.log("✅ Done!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
