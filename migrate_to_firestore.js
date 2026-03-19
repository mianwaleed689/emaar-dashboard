/**
 * DXB Analytics — One-Time Firestore Migration Script
 * Run this ONCE from your project root:
 *   node migrate_to_firestore.js
 *
 * What it does:
 * 1. Creates the 'developers' collection with Emaar as first entry
 * 2. Migrates all 48 projects from data.js → Firestore 'projects' collection
 * 3. Migrates financials → Firestore 'developerFinancials' collection
 * 4. Migrates communities → Firestore 'communities' collection
 * 5. Migrates yields → Firestore 'yields' collection
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc, writeBatch } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBEtQr19WTjSTxssB2TjJq-ENioG8Jpq6Q",
  authDomain: "dxb-analytics.firebaseapp.com",
  projectId: "dxb-analytics",
  storageBucket: "dxb-analytics.firebasestorage.app",
  messagingSenderId: "329487314073",
  appId: "1:329487314073:web:2a73aa4a5b770f58459c08"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── EMAAR PROJECTS (from data.js) ──
const emaarProjects = [
  { id:1, name:"The Golf Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1750000, sizeFrom:750, sizeTo:2200, ppsf:2333, payment:"20/30/50", construction:80, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/the-golf-residence" },
  { id:2, name:"Hills Park", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1210000, sizeFrom:650, sizeTo:1800, ppsf:1862, payment:"80/20", construction:75, branded:false, brand:"—", tier:"Mid-Market", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/hills-park" },
  { id:3, name:"Golf Grand", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2027", price:1529388, sizeFrom:700, sizeTo:2100, ppsf:2185, payment:"10/80/10", construction:96, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/golf-grand" },
  { id:4, name:"Parkside Views", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q3 2027", price:1450000, sizeFrom:900, sizeTo:2800, ppsf:1933, payment:"10/80/10", construction:74, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/parkside-views" },
  { id:5, name:"Greenside Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q3 2027", price:1645888, sizeFrom:700, sizeTo:2000, ppsf:2347, payment:"10/80/10", construction:61, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/greenside-residence" },
  { id:6, name:"Club Drive", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2028", price:1626566, sizeFrom:726, sizeTo:2622, ppsf:2240, payment:"10/90", construction:55, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/club-drive" },
  { id:7, name:"Golf Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q4 2028", price:1470000, sizeFrom:741, sizeTo:2322, ppsf:1984, payment:"10/70/20", construction:37, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://properties.emaar.com/en/properties/golf-hillside-at-dubai-hills-estate/" },
  { id:8, name:"Park Lane", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q4 2028", price:1480000, sizeFrom:700, sizeTo:2200, ppsf:2114, payment:"10/70/20", construction:33, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/park-lane" },
  { id:9, name:"Palace Residences Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q2 2028", price:1760888, sizeFrom:750, sizeTo:2500, ppsf:2348, payment:"80/20", construction:17, branded:true, brand:"Palace", tier:"Luxury Branded", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/palace-residences-hillside" },
  { id:10, name:"Greencrest", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1570000, sizeFrom:700, sizeTo:2200, ppsf:2629, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://properties.emaar.com/en/properties/greencrest-at-dubai-hills-estate/" },
  { id:11, name:"Vida Residences Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1800000, sizeFrom:700, sizeTo:2200, ppsf:2571, payment:"80/20", construction:8, branded:true, brand:"Vida", tier:"Luxury Branded", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/vida-residences-hillside" },
  { id:12, name:"Parkwood", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:1750000, sizeFrom:750, sizeTo:2400, ppsf:2333, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/parkwood" },
  { id:13, name:"Hillsedge", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:1840000, sizeFrom:700, sizeTo:2000, ppsf:2629, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/hillsedge" },
  { id:14, name:"Club Place", community:"Dubai Hills Estate", district:"DHE", type:"Apts & Duplex", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1450000, sizeFrom:700, sizeTo:2200, ppsf:2071, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/club-place" },
  { id:15, name:"Rosehill", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1600888, sizeFrom:700, sizeTo:2000, ppsf:2164, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://properties.emaar.com/en/properties/rosehill-dubai-hills-estate/" },
  { id:16, name:"Parkland", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1500000, sizeFrom:700, sizeTo:2200, ppsf:2143, payment:"80/20", construction:8, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/parkland" },
  { id:17, name:"The Cove II", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:1669000, sizeFrom:650, sizeTo:2800, ppsf:2568, payment:"10/70/20", construction:87, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/the-cove-2" },
  { id:18, name:"Creek Waters", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q3 2027", price:1750000, sizeFrom:700, sizeTo:2600, ppsf:2500, payment:"10/80/10", construction:62, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/creek-waters" },
  { id:19, name:"Creek Waters 2", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q4 2027", price:1938110, sizeFrom:700, sizeTo:2800, ppsf:2769, payment:"10/80/10", construction:63, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/creek-waters-2" },
  { id:20, name:"Oria", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q3 2028", price:1814888, sizeFrom:700, sizeTo:2200, ppsf:2593, payment:"10/80/10", construction:49, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/oria" },
  { id:21, name:"Albero", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1900000, sizeFrom:700, sizeTo:2200, ppsf:2586, payment:"10/70/20", construction:10, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/albero" },
  { id:22, name:"Montiva by Vida", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1910000, sizeFrom:700, sizeTo:2200, ppsf:2530, payment:"80/20", construction:5, branded:true, brand:"Vida", tier:"Luxury Branded", emaarUrl:"https://properties.emaar.com/en/properties/montiva-by-vida-at-dubai-creek-harbour/" },
  { id:23, name:"Silva", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1790888, sizeFrom:700, sizeTo:2200, ppsf:2400, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://off-planproperties.ae/projects/silva-emaar-dubai-creek/" },
  { id:24, name:"Creek Bay", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2030", price:1800000, sizeFrom:700, sizeTo:2200, ppsf:2400, payment:"10/70/20", construction:0, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://properties.emaar.com/en/properties/creek-bay-at-dubai-creek-harbour/" },
  { id:25, name:"Creek Haven", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2030", price:1860000, sizeFrom:700, sizeTo:2200, ppsf:2600, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://properties.emaar.com/en/properties/creek-haven-at-dubai-creek-harbour/" },
  { id:26, name:"Lyvia by Palace", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:2684888, sizeFrom:700, sizeTo:2500, ppsf:2400, payment:"80/20", construction:0, branded:true, brand:"Palace", tier:"Ultra-Lux Branded", emaarUrl:"https://properties.emaar.com/en/properties/lyvia-by-palace-at-dubai-creek-harbour/" },
  { id:27, name:"Altan", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1813888, sizeFrom:700, sizeTo:2200, ppsf:2450, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://properties.emaar.com/en/properties/altan-at-dubai-creek-harbour/" },
  { id:28, name:"Address The Bay", community:"Emaar Beachfront", district:"EBF", type:"Apts & PH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:3500000, sizeFrom:800, sizeTo:4500, ppsf:4375, payment:"80/20", construction:70, branded:true, brand:"Address", tier:"Ultra-Lux Branded", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/address-the-bay" },
  { id:29, name:"Beachgate by Address", community:"Emaar Beachfront", district:"EBF", type:"Apts, TH, PH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:3200000, sizeFrom:800, sizeTo:4000, ppsf:4000, payment:"80/20", construction:70, branded:true, brand:"Address", tier:"Ultra-Lux Branded", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/beachgate-by-address" },
  { id:30, name:"Seapoint", community:"Emaar Beachfront", district:"EBF", type:"Apts & Villas", beds:"1-4", status:"Under Construction", handover:"Q2 2028", price:3000000, sizeFrom:750, sizeTo:3500, ppsf:4000, payment:"80/20", construction:45, branded:false, brand:"—", tier:"Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/seapoint" },
  { id:31, name:"Bayview", community:"Emaar Beachfront", district:"EBF", type:"Apartments", beds:"1-4", status:"Under Construction", handover:"Q3 2028", price:3000000, sizeFrom:750, sizeTo:3500, ppsf:4000, payment:"80/20", construction:40, branded:true, brand:"Address", tier:"Ultra-Lux Branded", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/bayview" },
  { id:32, name:"Bristol Luxury Residences", community:"Emaar Beachfront", district:"EBF", type:"Branded Res.", beds:"1-4", status:"Off-Plan", handover:"Q3 2029", price:3500000, sizeFrom:800, sizeTo:4000, ppsf:4375, payment:"80/20", construction:15, branded:true, brand:"Bristol", tier:"Ultra-Lux Branded", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/bristol-luxury-residences" },
  { id:33, name:"Golf Verge", community:"Emaar South", district:"ES", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1200000, sizeFrom:650, sizeTo:1800, ppsf:1846, payment:"10/70/20", construction:5, branded:false, brand:"—", tier:"Affordable", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/golf-verge" },
  { id:34, name:"Golf Meadow", community:"Emaar South", district:"ES", type:"Apts & TH", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:1120000, sizeFrom:706, sizeTo:2869, ppsf:1587, payment:"10/70/20", construction:5, branded:false, brand:"—", tier:"Affordable", emaarUrl:"https://insiderealty.ae/en/projects/emaar-south-golf-meadow" },
  { id:35, name:"Terra Gardens", community:"Expo Living", district:"EL", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:1550000, sizeFrom:650, sizeTo:1800, ppsf:2089, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Affordable", emaarUrl:"https://properties.emaar.com/en/properties/terra-gardens-at-expo-living/" },
  { id:36, name:"Farm Gardens", community:"The Valley", district:"TV", type:"Villas", beds:"4-5", status:"Under Construction", handover:"Q3 2026", price:5100000, sizeFrom:4950, sizeTo:10004, ppsf:1475, payment:"80/20", construction:76, branded:false, brand:"—", tier:"Ultra-Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/farm-gardens" },
  { id:37, name:"Elora", community:"The Valley", district:"TV", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q4 2026", price:1600000, sizeFrom:2111, sizeTo:2608, ppsf:758, payment:"80/20", construction:30, branded:false, brand:"—", tier:"Mid-Market", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/elora" },
  { id:38, name:"Selvara", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:5670000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Ultra-Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/selvara" },
  { id:39, name:"Equestra", community:"Grand Polo Club", district:"GPC", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q2 2029", price:3700000, sizeFrom:2176, sizeTo:2176, ppsf:1700, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/equestra" },
  { id:40, name:"Equiterra", community:"Grand Polo Club", district:"GPC", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q3 2029", price:3500000, sizeFrom:2176, sizeTo:2176, ppsf:1608, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/equiterra" },
  { id:41, name:"Chevalia Estate 2", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"4-5", status:"Off-Plan", handover:"Q4 2029", price:7880000, sizeFrom:3800, sizeTo:5400, ppsf:2000, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Ultra-Luxury", emaarUrl:"https://www.luxhabitat.ae/developments/dubai/chevalia-estate-2/" },
  { id:42, name:"Selvara 3", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:6200000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Ultra-Luxury", emaarUrl:"https://berightproperties.com/project/selvara-3-by-emaar-at-grand-polo-club-and-resort" },
  { id:43, name:"Selvara 4", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:6200000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Ultra-Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/selvara-4" },
  { id:44, name:"Aurea", community:"Rashid Yachts & Marina", district:"RYM", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2030", price:2310000, sizeFrom:700, sizeTo:2500, ppsf:1933, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Premium", emaarUrl:"https://properties.emaar.com/en/properties/aurea-at-rashid-yachts-and-marina/" },
  { id:45, name:"Baystar by Vida", community:"Rashid Yachts & Marina", district:"RYM", type:"Apartments", beds:"1-4", status:"Off-Plan", handover:"Q4 2029", price:2100000, sizeFrom:700, sizeTo:3000, ppsf:1933, payment:"80/20", construction:5, branded:true, brand:"Vida", tier:"Luxury Branded", emaarUrl:"https://properties.emaar.com/en/properties/baystar-by-vida-at-rashid-yachts-marina/" },
  { id:46, name:"Marèva 2", community:"The Oasis", district:"TO", type:"Villas", beds:"4-6", status:"Off-Plan", handover:"Q1 2030", price:13830000, sizeFrom:7254, sizeTo:12779, ppsf:1857, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Ultra-Luxury", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/mareva-2" },
  { id:47, name:"Avarra by Palace", community:"Business Bay", district:"BB", type:"Apts & PH", beds:"1-4", status:"Off-Plan", handover:"Q2 2031", price:2700000, sizeFrom:750, sizeTo:3500, ppsf:3500, payment:"10/80/10", construction:0, branded:true, brand:"Palace", tier:"Ultra-Lux Branded", emaarUrl:"https://metropolitan.realestate/business-bay/avarra-palace-business-bay-dubai/" },
  { id:48, name:"Greencrest Heights", community:"The Heights CW", district:"TH", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q4 2029", price:2500000, sizeFrom:2200, sizeTo:3000, ppsf:1933, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Mid-Premium", emaarUrl:"https://providentestate.com/new-projects/greencrest-emaar-properties-dubai-hills-estate/" },
];

async function migrate() {
  console.log("🚀 Starting DXB Analytics Firestore Migration...\n");

  // ── 1. Create Emaar developer profile ──
  console.log("📋 Creating developer profile...");
  await setDoc(doc(db, "developers", "emaar"), {
    id: "emaar",
    name: "Emaar Properties",
    shortName: "Emaar",
    logo: "",
    founded: 1997,
    headquarters: "Dubai, UAE",
    listed: true,
    exchange: "DFM",
    ticker: "EMAAR",
    description: "Dubai's largest developer — master communities, branded residences, and retail/hospitality assets.",
    totalProjects: 48,
    totalCommunities: 11,
    active: true,
    phase: 1,
    addedAt: new Date().toISOString(),
  });
  console.log("  ✅ Emaar developer profile created\n");

  // ── 2. Migrate all 48 projects ──
  console.log("🏗️  Migrating 48 projects...");
  const batch1 = writeBatch(db);
  emaarProjects.forEach(p => {
    const docId = `emaar_${p.id}`;
    batch1.set(doc(db, "projects", docId), {
      ...p,
      developer: "Emaar Properties",
      developerId: "emaar",
      docId,
      migratedAt: new Date().toISOString(),
      dataSource: "data.js migration",
    });
  });
  await batch1.commit();
  console.log(`  ✅ ${emaarProjects.length} projects migrated\n`);

  // ── 3. Create placeholder for DAMAC (Phase 2) ──
  console.log("📋 Creating Phase 2 developer placeholders...");
  const phase2Devs = [
    { id: "damac", name: "DAMAC Properties", shortName: "DAMAC", listed: false, phase: 2, active: false },
    { id: "sobha", name: "Sobha Realty", shortName: "Sobha", listed: false, phase: 2, active: false },
    { id: "nakheel", name: "Nakheel", shortName: "Nakheel", listed: false, phase: 2, active: false },
    { id: "aldar", name: "Aldar Properties", shortName: "Aldar", listed: true, exchange: "ADX", phase: 2, active: false },
    { id: "meraas", name: "Meraas", shortName: "Meraas", listed: false, phase: 2, active: false },
    { id: "binghatti", name: "Binghatti Developers", shortName: "Binghatti", listed: false, phase: 2, active: false },
  ];
  const batch2 = writeBatch(db);
  phase2Devs.forEach(dev => {
    batch2.set(doc(db, "developers", dev.id), {
      ...dev,
      totalProjects: 0,
      description: "Coming in Phase 2 — Q3 2026",
      addedAt: new Date().toISOString(),
    });
  });
  await batch2.commit();
  console.log(`  ✅ ${phase2Devs.length} Phase 2 developers created\n`);

  console.log("🎉 Migration complete!");
  console.log("\nNext steps:");
  console.log("  1. Go to Firebase Console → Firestore");
  console.log("  2. Verify 'developers' collection has 7 docs");
  console.log("  3. Verify 'projects' collection has 48 docs (emaar_1 through emaar_48)");
  console.log("  4. The dashboard will now read from Firestore first");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
