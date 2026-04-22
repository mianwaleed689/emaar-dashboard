/**
 * DXB Analytics — Firestore Migration via Admin SDK
 * Uses service account — bypasses security rules
 * 
 * SETUP (one time):
 * 1. Firebase Console → Project Settings → Service Accounts
 * 2. Click "Generate new private key" → downloads a JSON file
 * 3. Save it as serviceAccount.json in your project root
 * 4. npm install firebase-admin
 * 5. node migrate_admin.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "dxb-analytics",
});

const db = admin.firestore();

const emaarProjects = [
  { id:1, name:"The Golf Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1750000, sizeFrom:750, sizeTo:2200, ppsf:2333, payment:"20/30/50", construction:80, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:2, name:"Hills Park", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1210000, sizeFrom:650, sizeTo:1800, ppsf:1862, payment:"80/20", construction:75, branded:false, brand:"—", tier:"Mid-Market" },
  { id:3, name:"Golf Grand", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2027", price:1529388, sizeFrom:700, sizeTo:2100, ppsf:2185, payment:"10/80/10", construction:96, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:4, name:"Parkside Views", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q3 2027", price:1450000, sizeFrom:900, sizeTo:2800, ppsf:1933, payment:"10/80/10", construction:74, branded:false, brand:"—", tier:"Premium" },
  { id:5, name:"Greenside Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q3 2027", price:1645888, sizeFrom:700, sizeTo:2000, ppsf:2347, payment:"10/80/10", construction:61, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:6, name:"Club Drive", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2028", price:1626566, sizeFrom:726, sizeTo:2622, ppsf:2240, payment:"10/90", construction:55, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:7, name:"Golf Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q4 2028", price:1470000, sizeFrom:741, sizeTo:2322, ppsf:1984, payment:"10/70/20", construction:37, branded:false, brand:"—", tier:"Premium" },
  { id:8, name:"Park Lane", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q4 2028", price:1480000, sizeFrom:700, sizeTo:2200, ppsf:2114, payment:"10/70/20", construction:33, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:9, name:"Palace Residences Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q2 2028", price:1760888, sizeFrom:750, sizeTo:2500, ppsf:2348, payment:"80/20", construction:17, branded:true, brand:"Palace", tier:"Luxury Branded" },
  { id:10, name:"Greencrest", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1570000, sizeFrom:700, sizeTo:2200, ppsf:2629, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:11, name:"Vida Residences Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1800000, sizeFrom:700, sizeTo:2200, ppsf:2571, payment:"80/20", construction:8, branded:true, brand:"Vida", tier:"Luxury Branded" },
  { id:12, name:"Parkwood", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:1750000, sizeFrom:750, sizeTo:2400, ppsf:2333, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:13, name:"Hillsedge", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:1840000, sizeFrom:700, sizeTo:2000, ppsf:2629, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:14, name:"Club Place", community:"Dubai Hills Estate", district:"DHE", type:"Apts & Duplex", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1450000, sizeFrom:700, sizeTo:2200, ppsf:2071, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:15, name:"Rosehill", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1600888, sizeFrom:700, sizeTo:2000, ppsf:2164, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:16, name:"Parkland", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1500000, sizeFrom:700, sizeTo:2200, ppsf:2143, payment:"80/20", construction:8, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:17, name:"The Cove II", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:1669000, sizeFrom:650, sizeTo:2800, ppsf:2568, payment:"10/70/20", construction:87, branded:false, brand:"—", tier:"Mid-Premium" },
  { id:18, name:"Creek Waters", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q3 2027", price:1750000, sizeFrom:700, sizeTo:2600, ppsf:2500, payment:"10/80/10", construction:62, branded:false, brand:"—", tier:"Premium" },
  { id:19, name:"Creek Waters 2", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q4 2027", price:1938110, sizeFrom:700, sizeTo:2800, ppsf:2769, payment:"10/80/10", construction:63, branded:false, brand:"—", tier:"Premium" },
  { id:20, name:"Oria", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q3 2028", price:1814888, sizeFrom:700, sizeTo:2200, ppsf:2593, payment:"10/80/10", construction:49, branded:false, brand:"—", tier:"Premium" },
  { id:21, name:"Albero", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1900000, sizeFrom:700, sizeTo:2200, ppsf:2586, payment:"10/70/20", construction:10, branded:false, brand:"—", tier:"Premium" },
  { id:22, name:"Montiva by Vida", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1910000, sizeFrom:700, sizeTo:2200, ppsf:2530, payment:"80/20", construction:5, branded:true, brand:"Vida", tier:"Luxury Branded" },
  { id:23, name:"Silva", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1790888, sizeFrom:700, sizeTo:2200, ppsf:2400, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Premium" },
  { id:24, name:"Creek Bay", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2030", price:1800000, sizeFrom:700, sizeTo:2200, ppsf:2400, payment:"10/70/20", construction:0, branded:false, brand:"—", tier:"Premium" },
  { id:25, name:"Creek Haven", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2030", price:1860000, sizeFrom:700, sizeTo:2200, ppsf:2600, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Premium" },
  { id:26, name:"Lyvia by Palace", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:2684888, sizeFrom:700, sizeTo:2500, ppsf:2400, payment:"80/20", construction:0, branded:true, brand:"Palace", tier:"Ultra-Lux Branded" },
  { id:27, name:"Altan", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1813888, sizeFrom:700, sizeTo:2200, ppsf:2450, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Premium" },
  { id:28, name:"Address The Bay", community:"Emaar Beachfront", district:"EBF", type:"Apts & PH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:3500000, sizeFrom:800, sizeTo:4500, ppsf:4375, payment:"80/20", construction:70, branded:true, brand:"Address", tier:"Ultra-Lux Branded" },
  { id:29, name:"Beachgate by Address", community:"Emaar Beachfront", district:"EBF", type:"Apts, TH, PH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:3200000, sizeFrom:800, sizeTo:4000, ppsf:4000, payment:"80/20", construction:70, branded:true, brand:"Address", tier:"Ultra-Lux Branded" },
  { id:30, name:"Seapoint", community:"Emaar Beachfront", district:"EBF", type:"Apts & Villas", beds:"1-4", status:"Under Construction", handover:"Q2 2028", price:3000000, sizeFrom:750, sizeTo:3500, ppsf:4000, payment:"80/20", construction:45, branded:false, brand:"—", tier:"Luxury" },
  { id:31, name:"Bayview", community:"Emaar Beachfront", district:"EBF", type:"Apartments", beds:"1-4", status:"Under Construction", handover:"Q3 2028", price:3000000, sizeFrom:750, sizeTo:3500, ppsf:4000, payment:"80/20", construction:40, branded:true, brand:"Address", tier:"Ultra-Lux Branded" },
  { id:32, name:"Bristol Luxury Residences", community:"Emaar Beachfront", district:"EBF", type:"Branded Res.", beds:"1-4", status:"Off-Plan", handover:"Q3 2029", price:3500000, sizeFrom:800, sizeTo:4000, ppsf:4375, payment:"80/20", construction:15, branded:true, brand:"Bristol", tier:"Ultra-Lux Branded" },
  { id:33, name:"Golf Verge", community:"Emaar South", district:"ES", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1200000, sizeFrom:650, sizeTo:1800, ppsf:1846, payment:"10/70/20", construction:5, branded:false, brand:"—", tier:"Affordable" },
  { id:34, name:"Golf Meadow", community:"Emaar South", district:"ES", type:"Apts & TH", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1120000, sizeFrom:706, sizeTo:2869, ppsf:1587, payment:"10/70/20", construction:5, branded:false, brand:"—", tier:"Affordable" },
  { id:35, name:"Terra Gardens", community:"Expo Living", district:"EL", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:1550000, sizeFrom:650, sizeTo:1800, ppsf:2089, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Affordable" },
  { id:36, name:"Farm Gardens", community:"The Valley", district:"TV", type:"Villas", beds:"4-5", status:"Under Construction", handover:"Q3 2026", price:5100000, sizeFrom:4950, sizeTo:10004, ppsf:1475, payment:"80/20", construction:76, branded:false, brand:"—", tier:"Ultra-Luxury" },
  { id:37, name:"Elora", community:"The Valley", district:"TV", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q4 2026", price:1600000, sizeFrom:2111, sizeTo:2608, ppsf:758, payment:"80/20", construction:30, branded:false, brand:"—", tier:"Mid-Market" },
  { id:38, name:"Selvara", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:5670000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Ultra-Luxury" },
  { id:39, name:"Equestra", community:"Grand Polo Club", district:"GPC", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q2 2029", price:3700000, sizeFrom:2176, sizeTo:2176, ppsf:1700, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Luxury" },
  { id:40, name:"Equiterra", community:"Grand Polo Club", district:"GPC", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q3 2029", price:3500000, sizeFrom:2176, sizeTo:2176, ppsf:1608, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Luxury" },
  { id:41, name:"Chevalia Estate 2", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"4-5", status:"Off-Plan", handover:"Q4 2029", price:7880000, sizeFrom:3800, sizeTo:5400, ppsf:2000, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Ultra-Luxury" },
  { id:42, name:"Selvara 3", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:6200000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Ultra-Luxury" },
  { id:43, name:"Selvara 4", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:6200000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Ultra-Luxury" },
  { id:44, name:"Aurea", community:"Rashid Yachts & Marina", district:"RYM", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2030", price:2310000, sizeFrom:700, sizeTo:2500, ppsf:1933, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Premium" },
  { id:45, name:"Baystar by Vida", community:"Rashid Yachts & Marina", district:"RYM", type:"Apartments", beds:"1-4", status:"Off-Plan", handover:"Q4 2029", price:2100000, sizeFrom:700, sizeTo:3000, ppsf:1933, payment:"80/20", construction:5, branded:true, brand:"Vida", tier:"Luxury Branded" },
  { id:46, name:"Marèva 2", community:"The Oasis", district:"TO", type:"Villas", beds:"4-6", status:"Off-Plan", handover:"Q1 2030", price:13830000, sizeFrom:7254, sizeTo:12779, ppsf:1857, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Ultra-Luxury" },
  { id:47, name:"Avarra by Palace", community:"Business Bay", district:"BB", type:"Apts & PH", beds:"1-4", status:"Off-Plan", handover:"Q2 2031", price:2700000, sizeFrom:750, sizeTo:3500, ppsf:3500, payment:"10/80/10", construction:0, branded:true, brand:"Palace", tier:"Ultra-Lux Branded" },
  { id:48, name:"Greencrest Heights", community:"The Heights CW", district:"TH", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q4 2029", price:2500000, sizeFrom:2200, sizeTo:3000, ppsf:1933, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Mid-Premium" },
];

const phase2Devs = [
  { id:"damac", name:"DAMAC Properties", shortName:"DAMAC", listed:false, phase:2 },
  { id:"sobha", name:"Sobha Realty", shortName:"Sobha", listed:false, phase:2 },
  { id:"nakheel", name:"Nakheel", shortName:"Nakheel", listed:false, phase:2 },
  { id:"aldar", name:"Aldar Properties", shortName:"Aldar", listed:true, exchange:"ADX", phase:2 },
  { id:"meraas", name:"Meraas", shortName:"Meraas", listed:false, phase:2 },
  { id:"binghatti", name:"Binghatti Developers", shortName:"Binghatti", listed:false, phase:2 },
];

async function migrate() {
  console.log("🚀 Starting DXB Analytics Firestore Migration...\n");

  // 1. Create Emaar developer profile
  console.log("📋 Creating Emaar developer profile...");
  await db.collection("developers").doc("emaar").set({
    id:"emaar", name:"Emaar Properties", shortName:"Emaar",
    listed:true, exchange:"DFM", ticker:"EMAAR",
    founded:1997, headquarters:"Dubai, UAE",
    description:"Dubai's largest developer — master communities, branded residences, and retail/hospitality assets.",
    totalProjects:48, totalCommunities:11, active:true, phase:1,
    addedAt: new Date().toISOString(),
  });
  console.log("  ✅ Emaar profile created");

  // 2. Migrate 48 projects in batches
  console.log("\n🏗️  Migrating 48 projects...");
  const batchSize = 20;
  for (let i = 0; i < emaarProjects.length; i += batchSize) {
    const batch = db.batch();
    const chunk = emaarProjects.slice(i, i + batchSize);
    chunk.forEach(p => {
      const ref = db.collection("projects").doc(`emaar_${p.id}`);
      batch.set(ref, {
        ...p,
        developer:"Emaar Properties",
        developerId:"emaar",
        migratedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
    console.log(`  ✅ Batch ${Math.floor(i/batchSize)+1}: projects ${i+1}–${Math.min(i+batchSize, emaarProjects.length)}`);
  }

  // 3. Create Phase 2 developer placeholders
  console.log("\n📋 Creating Phase 2 developer placeholders...");
  const devBatch = db.batch();
  phase2Devs.forEach(dev => {
    devBatch.set(db.collection("developers").doc(dev.id), {
      ...dev, totalProjects:0, active:false,
      description:"Coming in Phase 2 — Q3 2026",
      addedAt: new Date().toISOString(),
    });
  });
  await devBatch.commit();
  console.log(`  ✅ ${phase2Devs.length} Phase 2 developers created`);

  console.log("\n🎉 Migration complete!");
  console.log("  → developers collection: 7 docs");
  console.log("  → projects collection: 48 docs (emaar_1 to emaar_48)");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
