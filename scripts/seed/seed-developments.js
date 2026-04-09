/**
 * DXB Analytics - Seed real Dubai developments + developers
 * Run once: node scripts/seed/seed-developments.js
 *
 * Requires: scripts/serviceAccountKey.json (Firebase Admin credentials)
 */

const admin = require("firebase-admin");
const path = require("path");

const KEY_PATH = path.join(__dirname, "..", "serviceAccountKey.json");

try {
  const serviceAccount = require(KEY_PATH);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
  console.error("ERROR: scripts/serviceAccountKey.json not found or invalid.");
  console.error("Download from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key");
  process.exit(1);
}

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

// ============================================================================
// DEVELOPERS (5 real Dubai developers)
// ============================================================================
const DEVELOPERS = [
  {
    id: "emaar",
    name: "Emaar Properties",
    arabicName: "اعمار العقارية",
    slug: "emaar-properties",
    reraLicenseNumber: "1",
    founded: 1997,
    headquarters: "Dubai, UAE",
    website: "https://www.emaar.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Emaar_logo.svg/2560px-Emaar_logo.svg.png",
    description: "Master developer of iconic Dubai landmarks including Burj Khalifa, Dubai Mall, and Downtown Dubai.",
    onTimeRate: 87,
    totalProjects: 142,
    completedProjects: 118,
    activeProjects: 24,
    tier: "tier-1",
    reliabilityScore: 92,
    publiclyListed: true,
    stockTicker: "EMAAR.DU",
    visibility: "published",
    orgId: "dxb-analytics",
  },
  {
    id: "damac",
    name: "DAMAC Properties",
    arabicName: "داماك العقارية",
    slug: "damac-properties",
    reraLicenseNumber: "2",
    founded: 2002,
    headquarters: "Dubai, UAE",
    website: "https://www.damacproperties.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/DAMAC_Properties_logo.svg/2560px-DAMAC_Properties_logo.svg.png",
    description: "Luxury real estate developer known for branded residences with Versace, Fendi, Bugatti, Cavalli, and Trump.",
    onTimeRate: 78,
    totalProjects: 98,
    completedProjects: 72,
    activeProjects: 26,
    tier: "tier-1",
    reliabilityScore: 81,
    publiclyListed: false,
    visibility: "published",
    orgId: "dxb-analytics",
  },
  {
    id: "sobha",
    name: "Sobha Realty",
    arabicName: "صوبا للعقارات",
    slug: "sobha-realty",
    reraLicenseNumber: "3",
    founded: 1976,
    headquarters: "Dubai, UAE",
    website: "https://www.sobharealty.com",
    logoUrl: "https://www.sobharealty.com/assets/img/logo.svg",
    description: "Backward-integrated real estate developer with in-house construction, renowned for quality finishes.",
    onTimeRate: 94,
    totalProjects: 38,
    completedProjects: 28,
    activeProjects: 10,
    tier: "tier-1",
    reliabilityScore: 95,
    publiclyListed: false,
    visibility: "published",
    orgId: "dxb-analytics",
  },
  {
    id: "meraas",
    name: "Meraas",
    arabicName: "مراس",
    slug: "meraas",
    reraLicenseNumber: "4",
    founded: 2007,
    headquarters: "Dubai, UAE",
    website: "https://www.meraas.com",
    logoUrl: "https://www.meraas.com/-/media/logos/meraas-logo.svg",
    description: "Dubai Holding subsidiary behind City Walk, Bluewaters, La Mer, and Port de La Mer.",
    onTimeRate: 82,
    totalProjects: 45,
    completedProjects: 32,
    activeProjects: 13,
    tier: "tier-1",
    reliabilityScore: 85,
    publiclyListed: false,
    visibility: "published",
    orgId: "dxb-analytics",
  },
  {
    id: "nakheel",
    name: "Nakheel",
    arabicName: "نخيل",
    slug: "nakheel",
    reraLicenseNumber: "5",
    founded: 2003,
    headquarters: "Dubai, UAE",
    website: "https://www.nakheel.com",
    logoUrl: "https://www.nakheel.com/assets/images/nakheel-logo.svg",
    description: "Master developer of Palm Jumeirah, Palm Jebel Ali, The World Islands, and Deira Islands.",
    onTimeRate: 71,
    totalProjects: 56,
    completedProjects: 44,
    activeProjects: 12,
    tier: "tier-1",
    reliabilityScore: 78,
    publiclyListed: false,
    visibility: "published",
    orgId: "dxb-analytics",
  },
];

// ============================================================================
// DEVELOPMENTS (5 real Dubai master-planned areas / flagship projects)
// ============================================================================
const DEVELOPMENTS = [
  {
    id: "emaar-beachfront",
    name: "Emaar Beachfront",
    arabicName: "اعمار بيتش فرونت",
    slug: "emaar-beachfront",
    developerId: "emaar",
    developerName: "Emaar Properties",
    community: "Emaar Beachfront",
    subCommunity: "Dubai Harbour",
    emirate: "Dubai",
    country: "AE",
    coordinates: { lat: 25.0921, lng: 55.1364 },
    metroDistanceKm: 2.4,
    nearestMetroStation: "Al Sufouh Tram",
    beachAccess: true,
    saleStatus: "off-plan",
    constructionStatus: "under-construction",
    constructionPct: 45,
    visibility: "published",
    tenure: "freehold",
    foreignOwnershipAllowed: true,
    dldClass: "unit",
    reraProjectNumber: "1001",
    reraDeveloperNumber: "1",
    trakheesiPermit: "TRK-EB-2023-001",
    dldRegistered: true,
    escrowAccount: "ESC-1001",
    escrowBank: "Emirates NBD",
    escrowFundedPct: 68,
    dldStarRating: 4,
    launchDate: "2019-07-15",
    expectedHandover: "2026-12-31",
    contractedHandover: "2025-06-30",
    coverImageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600",
    description: "An exclusive island destination offering ultra-luxury beachfront apartments with panoramic views of Dubai Marina, Palm Jumeirah, and the Arabian Gulf.",
    tags: ["beachfront", "luxury", "waterfront", "off-plan"],
    amenities: ["Private Beach", "Infinity Pool", "Gym", "Spa", "Concierge", "Valet", "Kids Play Area", "Marina Access"],
    views: ["Sea View", "Palm Jumeirah View", "Marina View", "Skyline View"],
    lifestyle: ["Beachfront", "Luxury", "Investor"],
    orgId: "dxb-analytics",
  },
  {
    id: "dubai-hills-estate",
    name: "Dubai Hills Estate",
    arabicName: "تلال دبي",
    slug: "dubai-hills-estate",
    developerId: "emaar",
    developerName: "Emaar Properties",
    community: "Dubai Hills Estate",
    subCommunity: "Mohammed Bin Rashid City",
    emirate: "Dubai",
    country: "AE",
    coordinates: { lat: 25.1089, lng: 55.2513 },
    metroDistanceKm: 5.8,
    nearestMetroStation: "Noor Bank",
    beachAccess: false,
    saleStatus: "ready",
    constructionStatus: "completed",
    constructionPct: 100,
    visibility: "published",
    tenure: "freehold",
    foreignOwnershipAllowed: true,
    dldClass: "villa",
    reraProjectNumber: "1002",
    reraDeveloperNumber: "1",
    trakheesiPermit: "TRK-DHE-2018-001",
    dldRegistered: true,
    escrowAccount: "ESC-1002",
    escrowBank: "Emirates NBD",
    escrowFundedPct: 100,
    dldStarRating: 4,
    launchDate: "2013-03-20",
    expectedHandover: "2019-12-31",
    contractedHandover: "2019-12-31",
    actualHandover: "2020-03-15",
    coverImageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600",
    description: "A 2,700-acre master-planned community with an 18-hole championship golf course, Dubai Hills Mall, schools, and mixed-use districts.",
    tags: ["golf", "family", "luxury", "ready"],
    amenities: ["Golf Course", "Dubai Hills Mall", "Schools", "Parks", "Cycling Tracks", "Tennis Courts", "Pools"],
    views: ["Golf View", "Park View", "Skyline View"],
    lifestyle: ["Family", "Golf", "Luxury"],
    orgId: "dxb-analytics",
  },
  {
    id: "sobha-hartland",
    name: "Sobha Hartland",
    arabicName: "صوبا هارتلاند",
    slug: "sobha-hartland",
    developerId: "sobha",
    developerName: "Sobha Realty",
    community: "MBR City",
    subCommunity: "Mohammed Bin Rashid City",
    emirate: "Dubai",
    country: "AE",
    coordinates: { lat: 25.1789, lng: 55.3212 },
    metroDistanceKm: 4.2,
    nearestMetroStation: "Business Bay",
    beachAccess: false,
    saleStatus: "off-plan",
    constructionStatus: "under-construction",
    constructionPct: 72,
    visibility: "published",
    tenure: "freehold",
    foreignOwnershipAllowed: true,
    dldClass: "unit",
    reraProjectNumber: "1003",
    reraDeveloperNumber: "3",
    trakheesiPermit: "TRK-SH-2017-001",
    dldRegistered: true,
    escrowAccount: "ESC-1003",
    escrowBank: "Mashreq Bank",
    escrowFundedPct: 85,
    dldStarRating: 4,
    launchDate: "2014-11-10",
    expectedHandover: "2026-06-30",
    contractedHandover: "2024-12-31",
    coverImageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600",
    description: "8-million square foot waterfront community featuring luxury villas, townhouses, and apartments with two international schools.",
    tags: ["waterfront", "luxury", "family", "off-plan", "schools"],
    amenities: ["Waterfront Promenade", "International Schools", "Forest Villas", "Retail District", "Healthcare"],
    views: ["Canal View", "Skyline View", "Park View"],
    lifestyle: ["Family", "Luxury", "Wellness"],
    orgId: "dxb-analytics",
  },
  {
    id: "damac-hills",
    name: "DAMAC Hills",
    arabicName: "داماك هيلز",
    slug: "damac-hills",
    developerId: "damac",
    developerName: "DAMAC Properties",
    community: "DAMAC Hills",
    subCommunity: "Dubailand",
    emirate: "Dubai",
    country: "AE",
    coordinates: { lat: 25.0258, lng: 55.2608 },
    metroDistanceKm: 12.5,
    nearestMetroStation: "None",
    beachAccess: false,
    saleStatus: "ready",
    constructionStatus: "completed",
    constructionPct: 100,
    visibility: "published",
    tenure: "freehold",
    foreignOwnershipAllowed: true,
    dldClass: "villa",
    reraProjectNumber: "1004",
    reraDeveloperNumber: "2",
    trakheesiPermit: "TRK-DH-2013-001",
    dldRegistered: true,
    escrowAccount: "ESC-1004",
    escrowBank: "ADCB",
    escrowFundedPct: 100,
    dldStarRating: 3,
    launchDate: "2013-05-22",
    expectedHandover: "2018-12-31",
    contractedHandover: "2018-12-31",
    actualHandover: "2019-06-20",
    coverImageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600",
    description: "42 million sq ft master community centered around the Trump International Golf Club Dubai, featuring luxury villas and branded residences.",
    tags: ["golf", "luxury", "ready", "branded"],
    amenities: ["Trump Golf Club", "Skate Park", "Stables", "Paintball", "Fishing Lake", "Retail"],
    views: ["Golf View", "Park View"],
    lifestyle: ["Golf", "Luxury", "Family"],
    orgId: "dxb-analytics",
  },
  {
    id: "bluewaters-island",
    name: "Bluewaters Island",
    arabicName: "جزيرة بلوواترز",
    slug: "bluewaters-island",
    developerId: "meraas",
    developerName: "Meraas",
    community: "Bluewaters",
    subCommunity: "Jumeirah Beach Residence",
    emirate: "Dubai",
    country: "AE",
    coordinates: { lat: 25.0790, lng: 55.1238 },
    metroDistanceKm: 1.8,
    nearestMetroStation: "Jumeirah Beach Residence 1",
    beachAccess: true,
    saleStatus: "ready",
    constructionStatus: "completed",
    constructionPct: 100,
    visibility: "published",
    tenure: "freehold",
    foreignOwnershipAllowed: true,
    dldClass: "unit",
    reraProjectNumber: "1005",
    reraDeveloperNumber: "4",
    trakheesiPermit: "TRK-BW-2014-001",
    dldRegistered: true,
    escrowAccount: "ESC-1005",
    escrowBank: "Emirates Islamic",
    escrowFundedPct: 100,
    dldStarRating: 4,
    launchDate: "2014-08-15",
    expectedHandover: "2019-12-31",
    contractedHandover: "2019-06-30",
    actualHandover: "2019-11-25",
    coverImageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600",
    description: "Man-made island home to Ain Dubai (the world's tallest observation wheel), luxury residences, and a vibrant retail and dining district.",
    tags: ["beachfront", "luxury", "waterfront", "ready", "iconic"],
    amenities: ["Ain Dubai", "Private Beach", "Retail District", "Restaurants", "Hotel", "Marina"],
    views: ["Sea View", "Ain Dubai View", "Marina View", "Skyline View"],
    lifestyle: ["Beachfront", "Luxury", "Urban"],
    orgId: "dxb-analytics",
  },
];

// ============================================================================
// SEED EXECUTION
// ============================================================================
async function seed() {
  console.log("Starting seed...\n");

  console.log("Writing developers...");
  for (const dev of DEVELOPERS) {
    const { id, ...data } = dev;
    await db.collection("developers").doc(id).set({
      ...data,
      createdAt: ts(),
      updatedAt: ts(),
      createdBy: "seed-script",
      updatedBy: "seed-script",
      disclosedAt: ts(),
    }, { merge: true });
    console.log("  + developer:", dev.name);
  }

  console.log("\nWriting developments...");
  for (const dev of DEVELOPMENTS) {
    const { id, ...data } = dev;
    await db.collection("developments").doc(id).set({
      ...data,
      createdAt: ts(),
      updatedAt: ts(),
      createdBy: "seed-script",
      updatedBy: "seed-script",
      disclosedAt: ts(),
    }, { merge: true });

    // Also write an audit log entry
    await db.collection("developments").doc(id).collection("auditLog").add({
      action: "create",
      userId: "seed-script",
      userEmail: "seed-script@dxb-analytics",
      timestamp: ts(),
      fieldsChanged: Object.keys(data),
      source: "seed-developments.js",
    });

    console.log("  + development:", dev.name);
  }

  console.log("\nSeed complete!");
  console.log("  Developers:", DEVELOPERS.length);
  console.log("  Developments:", DEVELOPMENTS.length);
  console.log("\nYou can now refresh the admin panel -> Data Manager V2");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});