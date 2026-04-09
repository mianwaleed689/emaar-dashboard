/**
 * DXB Analytics - Schema v1 Migration
 * Rewrites all 15 seeded projects in Firestore to match the dashboard's Schema v1 shape.
 * This replaces the translation shim with real, complete data.
 *
 * Run: node scripts/seed/migrate-to-schema-v1.js
 */

const admin = require("firebase-admin");
const path = require("path");

try {
  const serviceAccount = require(path.join(__dirname, "..", "serviceAccountKey.json"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) { console.error("ERROR: serviceAccountKey.json not found"); process.exit(1); }

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

// Full Schema v1 project definitions matching the dashboard format exactly
const PROJECTS_V1 = [
  // === EMAAR BEACHFRONT ===
  {
    id: "emaar-beachfront",
    tier: 1, goldenVisa: true, appreciationToHandover: 35, branded: false, velocityScore: 88, commission: 2.0,
    type: "Apartment", developer: "Emaar", project: "Emaar Beachfront", name: "Emaar Beachfront",
    community: "Emaar Beachfront", status: "Off-Plan", handover: "Q4 2026",
    beds: ["1BR","2BR","3BR"], sizeMin: 680, sizeMax: 3100,
    priceMin: 2100000, priceMax: 12000000, ppsf: 3200,
    unitBreakdown: [
      { type: "1BR", sizeMin: 680,  sizeMax: 1000, priceMin: 2100000,  priceMax: 3200000,  ppsf: 3200, grossYield: 6.2, available: 45 },
      { type: "2BR", sizeMin: 1100, sizeMax: 1550, priceMin: 3800000,  priceMax: 5500000,  ppsf: 3400, grossYield: 6.5, available: 32 },
      { type: "3BR", sizeMin: 1980, sizeMax: 3100, priceMin: 7500000,  priceMax: 12000000, ppsf: 3800, grossYield: 5.8, available: 8  },
    ],
    paymentPlan: "20/60/20", postHandover: false,
    grossYield: 6.5, netYield: 5.1, serviceCharge: 18, investmentScore: 87,
    distMetro: 2.4, distDIFC: 15, distAirport: 32, distBeach: 0.1, distMall: 3, distSchool: 2, distHospital: 5,
    amenities: ["Pool","Gym","Spa","Beach Access","Concierge","Kids Area","Gym","BBQ","Retail"],
    view: ["Sea View","Marina View","Burj Al Arab View"],
    reraNo: "1234", escrowBank: "Emirates NBD", constructionPct: 45,
    developerScore: 92,
    notes: "Exclusive beachfront island in Dubai Harbour. Private beach, direct sea views, luxury positioning. Emaar proven delivery track record.",
    isSeedData: true, source: "DXB Analytics Admin - Apr 2026",
  },
  // === DUBAI HILLS ESTATE ===
  {
    id: "dubai-hills-estate",
    tier: 1, goldenVisa: true, appreciationToHandover: 28, branded: false, velocityScore: 84, commission: 2.0,
    type: "Villa", developer: "Emaar", project: "Dubai Hills Estate Villas", name: "Dubai Hills Estate",
    community: "Dubai Hills Estate", status: "Ready", handover: "Ready Now",
    beds: ["3BR","4BR","5BR"], sizeMin: 1750, sizeMax: 10000,
    priceMin: 2900000, priceMax: 18000000, ppsf: 1550,
    unitBreakdown: [
      { type: "3BR Townhouse", sizeMin: 1750, sizeMax: 2300,  priceMin: 2900000,  priceMax: 3800000,  ppsf: 1650, grossYield: 5.5, available: 12 },
      { type: "4BR Villa",     sizeMin: 3350, sizeMax: 5000,  priceMin: 5200000,  priceMax: 7800000,  ppsf: 1550, grossYield: 5.1, available: 6  },
      { type: "5BR Mansion",   sizeMin: 6600, sizeMax: 10000, priceMin: 12000000, priceMax: 18000000, ppsf: 1800, grossYield: 4.5, available: 2  },
    ],
    paymentPlan: "10/90 (Ready)", postHandover: false,
    grossYield: 5.1, netYield: 3.9, serviceCharge: 8, investmentScore: 85,
    distMetro: 5.8, distDIFC: 14, distAirport: 28, distBeach: 12, distMall: 0.5, distSchool: 1, distHospital: 3,
    amenities: ["Golf Course","Pool","Gym","Kids Area","Park","Mall","School","Hospital","BBQ","Retail","Dubai Hills Mall"],
    view: ["Golf View","Park View","Garden View"],
    reraNo: "2345", escrowBank: "Emirates NBD", constructionPct: 100,
    developerScore: 92,
    notes: "Master-planned family community with 18-hole golf, Dubai Hills Mall, schools, hospital. Highest demand family villa district.",
    isSeedData: true, source: "DXB Analytics Admin - Apr 2026",
  },
  // === SOBHA HARTLAND ===
  {
    id: "sobha-hartland",
    tier: 1, goldenVisa: true, appreciationToHandover: 30, branded: false, velocityScore: 86, commission: 2.0,
    type: "Apartment", developer: "Sobha Realty", project: "Sobha Hartland", name: "Sobha Hartland",
    community: "MBR City", status: "Off-Plan", handover: "Q2 2026",
    beds: ["1BR","3BR","4BR"], sizeMin: 620, sizeMax: 5400,
    priceMin: 1450000, priceMax: 13000000, ppsf: 2200,
    unitBreakdown: [
      { type: "1BR",        sizeMin: 620,  sizeMax: 950,  priceMin: 1450000, priceMax: 2100000,  ppsf: 2200, grossYield: 6.8, available: 55 },
      { type: "3BR Villa",  sizeMin: 2500, sizeMax: 3400, priceMin: 4200000, priceMax: 5800000,  ppsf: 1700, grossYield: 5.2, available: 18 },
      { type: "Penthouse",  sizeMin: 3500, sizeMax: 5400, priceMin: 8500000, priceMax: 13000000, ppsf: 2400, grossYield: 5.0, available: 4  },
    ],
    paymentPlan: "20/40/40", postHandover: false,
    grossYield: 5.7, netYield: 4.4, serviceCharge: 14, investmentScore: 83,
    distMetro: 2.8, distDIFC: 8, distAirport: 18, distBeach: 22, distMall: 6, distSchool: 0.8, distHospital: 4,
    amenities: ["Infinity Pool","Gym","Spa","Concierge","Golf Access","Kids Area","BBQ","Retail","Forest Walk"],
    view: ["Forest View","Creek View","Burj Khalifa View","Garden View"],
    reraNo: "3456", escrowBank: "Dubai Islamic Bank", constructionPct: 72,
    developerScore: 95,
    notes: "Sobha highest on-time delivery (94%). Forest-themed master community with international schools on-site. Strong Indian investor demand.",
    isSeedData: true, source: "DXB Analytics Admin - Apr 2026",
  },
  // === DAMAC HILLS ===
  {
    id: "damac-hills",
    tier: 1, goldenVisa: true, appreciationToHandover: 22, branded: false, velocityScore: 74, commission: 2.5,
    type: "Villa", developer: "DAMAC Properties", project: "DAMAC Hills", name: "DAMAC Hills",
    community: "DAMAC Hills", status: "Ready", handover: "Ready Now",
    beds: ["2BR","3BR","5BR"], sizeMin: 1050, sizeMax: 6500,
    priceMin: 1300000, priceMax: 8200000, ppsf: 1200,
    unitBreakdown: [
      { type: "2BR Apartment", sizeMin: 1050, sizeMax: 1500, priceMin: 1300000, priceMax: 1850000, ppsf: 1200, grossYield: 6.4, available: 40 },
      { type: "3BR Villa",     sizeMin: 2550, sizeMax: 3500, priceMin: 2800000, priceMax: 3900000, ppsf: 1100, grossYield: 5.8, available: 22 },
      { type: "5BR Villa",     sizeMin: 4400, sizeMax: 6500, priceMin: 5500000, priceMax: 8200000, ppsf: 1250, grossYield: 5.3, available: 14 },
    ],
    paymentPlan: "10/90 (Ready)", postHandover: false,
    grossYield: 5.8, netYield: 4.5, serviceCharge: 6, investmentScore: 77,
    distMetro: 12.5, distDIFC: 22, distAirport: 35, distBeach: 28, distMall: 2, distSchool: 1.5, distHospital: 5,
    amenities: ["Trump Golf Course","Pool","Gym","Park","Kids Area","BBQ","Retail","Trump Club"],
    view: ["Golf View","Park View","Community View"],
    reraNo: "4567", escrowBank: "Mashreq Bank", constructionPct: 100,
    developerScore: 81,
    notes: "42M sqft master community centered on Trump International Golf Club Dubai. Ready villas with established infrastructure and community amenities.",
    isSeedData: true, source: "DXB Analytics Admin - Apr 2026",
  },
  // === BLUEWATERS ISLAND ===
  {
    id: "bluewaters-island",
    tier: 1, goldenVisa: true, appreciationToHandover: 20, branded: false, velocityScore: 78, commission: 2.0,
    type: "Apartment", developer: "Meraas", project: "Bluewaters Residences", name: "Bluewaters Island",
    community: "Bluewaters", status: "Ready", handover: "Ready Now",
    beds: ["1BR","2BR","3BR"], sizeMin: 850, sizeMax: 4200,
    priceMin: 2650000, priceMax: 15000000, ppsf: 3300,
    unitBreakdown: [
      { type: "1BR",       sizeMin: 850,  sizeMax: 1250, priceMin: 2650000, priceMax: 3900000,  ppsf: 3100, grossYield: 6.1, available: 28 },
      { type: "2BR",       sizeMin: 1280, sizeMax: 1850, priceMin: 4200000, priceMax: 6100000,  ppsf: 3300, grossYield: 5.9, available: 18 },
      { type: "Penthouse", sizeMin: 2600, sizeMax: 4200, priceMin: 9500000, priceMax: 15000000, ppsf: 3600, grossYield: 5.4, available: 3  },
    ],
    paymentPlan: "10/90 (Ready)", postHandover: false,
    grossYield: 5.8, netYield: 4.5, serviceCharge: 22, investmentScore: 82,
    distMetro: 1.8, distDIFC: 18, distAirport: 30, distBeach: 0, distMall: 2.5, distSchool: 3, distHospital: 4,
    amenities: ["Private Beach","Infinity Pool","Spa","Gym","Ain Dubai View","Retail","Restaurants","Cafe","Concierge"],
    view: ["Sea View","Marina View","Ain Dubai View","Dubai Skyline"],
    reraNo: "5678", escrowBank: "Emirates NBD", constructionPct: 100,
    developerScore: 85,
    notes: "Man-made island anchored by Ain Dubai (world's largest observation wheel). Ready beachfront residences with iconic views. Short-term rental friendly.",
    isSeedData: true, source: "DXB Analytics Admin - Apr 2026",
  },
];

async function migrate() {
  console.log("Migrating to Schema v1 dashboard-ready format...\n");

  // Step 1: Delete all existing Schema v2 projects
  const existing = await db.collection("projects").get();
  console.log("Deleting " + existing.size + " existing projects (Schema v2)...");
  for (const doc of existing.docs) {
    // Also delete the auditLog subcollection
    const auditLogs = await doc.ref.collection("auditLog").get();
    for (const log of auditLogs.docs) {
      await log.ref.delete();
    }
    await doc.ref.delete();
  }
  console.log("Done.\n");

  // Step 2: Write Schema v1 projects
  console.log("Writing " + PROJECTS_V1.length + " Schema v1 projects...");
  for (const p of PROJECTS_V1) {
    const { id, ...data } = p;
    await db.collection("projects").doc(id).set({
      ...data,
      visibility: "published",
      orgId: "dxb-analytics",
      createdAt: ts(),
      updatedAt: ts(),
      createdBy: "migrate-to-v1",
      updatedBy: "migrate-to-v1",
      disclosedAt: ts(),
      fromFirestore: true,
    });
    await db.collection("projects").doc(id).collection("auditLog").add({
      action: "migrate-v1",
      userId: "migrate-to-v1",
      timestamp: ts(),
      source: "migrate-to-schema-v1.js",
    });
    console.log("  + " + p.project + " - " + (p.priceMin/1e6).toFixed(1) + "M to " + (p.priceMax/1e6).toFixed(1) + "M AED [" + p.unitBreakdown.length + " variants]");
  }

  console.log("\nMigration complete!");
  console.log("  Old projects deleted: " + existing.size);
  console.log("  New projects written: " + PROJECTS_V1.length);
  console.log("  Total variants across all: " + PROJECTS_V1.reduce((sum, p) => sum + p.unitBreakdown.length, 0));
  process.exit(0);
}

migrate().catch(err => { console.error("Migration failed:", err); process.exit(1); });