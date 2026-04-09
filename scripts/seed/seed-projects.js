/**
 * DXB Analytics - Seed project variants
 * Run after seed-developments.js
 * Run: node scripts/seed/seed-projects.js
 */

const admin = require("firebase-admin");
const path = require("path");

const KEY_PATH = path.join(__dirname, "..", "serviceAccountKey.json");

try {
  const serviceAccount = require(KEY_PATH);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
  console.error("ERROR: scripts/serviceAccountKey.json not found");
  process.exit(1);
}

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

// 15 project variants: 3 per development
const PROJECTS = [
  // === Emaar Beachfront ===
  {
    id: "emaar-beachfront-1br",
    developmentId: "emaar-beachfront",
    name: "Emaar Beachfront - 1BR Apartment",
    variantLabel: "1BR",
    type: "1BR Apartment",
    category: "residential",
    priceFromAed: 2100000, priceToAed: 3200000, pricePerSqftAed: 3200,
    sizeSqftMin: 680, sizeSqftMax: 1000,
    bedrooms: 1, bathrooms: 2,
    availableUnits: 45, totalUnits: 120,
    grossYieldPct: 6.2, netYieldPct: 4.8,
    serviceChargePerSqft: 18,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 20, duringConstructionPct: 60, onHandoverPct: 20, postHandoverPct: 0, postHandoverMonths: 0, label: "20/60/20" },
  },
  {
    id: "emaar-beachfront-2br",
    developmentId: "emaar-beachfront",
    name: "Emaar Beachfront - 2BR Apartment",
    variantLabel: "2BR",
    type: "2BR Apartment",
    category: "residential",
    priceFromAed: 3800000, priceToAed: 5500000, pricePerSqftAed: 3400,
    sizeSqftMin: 1100, sizeSqftMax: 1550,
    bedrooms: 2, bathrooms: 3,
    availableUnits: 32, totalUnits: 95,
    grossYieldPct: 6.5, netYieldPct: 5.1,
    serviceChargePerSqft: 18,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 20, duringConstructionPct: 60, onHandoverPct: 20, postHandoverPct: 0, postHandoverMonths: 0, label: "20/60/20" },
  },
  {
    id: "emaar-beachfront-3br",
    developmentId: "emaar-beachfront",
    name: "Emaar Beachfront - 3BR Penthouse",
    variantLabel: "3BR",
    type: "Penthouse",
    category: "residential",
    priceFromAed: 7500000, priceToAed: 12000000, pricePerSqftAed: 3800,
    sizeSqftMin: 1980, sizeSqftMax: 3100,
    bedrooms: 3, bathrooms: 4,
    availableUnits: 8, totalUnits: 24,
    grossYieldPct: 5.8, netYieldPct: 4.5,
    serviceChargePerSqft: 22,
    mortgageEligible: true, maxLtv: 75,
    furnishing: "semi-furnished",
    paymentPlan: { downPaymentPct: 25, duringConstructionPct: 55, onHandoverPct: 20, postHandoverPct: 0, postHandoverMonths: 0, label: "25/55/20" },
  },
  // === Dubai Hills Estate ===
  {
    id: "dhe-2br-townhouse",
    developmentId: "dubai-hills-estate",
    name: "Dubai Hills Estate - 3BR Townhouse",
    variantLabel: "3BR Townhouse",
    type: "Townhouse",
    category: "residential",
    priceFromAed: 2900000, priceToAed: 3800000, pricePerSqftAed: 1650,
    sizeSqftMin: 1750, sizeSqftMax: 2300,
    bedrooms: 3, bathrooms: 4,
    availableUnits: 12, totalUnits: 180,
    grossYieldPct: 5.5, netYieldPct: 4.3,
    serviceChargePerSqft: 8,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  {
    id: "dhe-4br-villa",
    developmentId: "dubai-hills-estate",
    name: "Dubai Hills Estate - 4BR Villa",
    variantLabel: "4BR Villa",
    type: "Detached Villa",
    category: "residential",
    priceFromAed: 5200000, priceToAed: 7800000, pricePerSqftAed: 1550,
    sizeSqftMin: 3350, sizeSqftMax: 5000,
    bedrooms: 4, bathrooms: 5,
    availableUnits: 6, totalUnits: 85,
    grossYieldPct: 5.1, netYieldPct: 3.9,
    serviceChargePerSqft: 7,
    mortgageEligible: true, maxLtv: 75,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  {
    id: "dhe-5br-mansion",
    developmentId: "dubai-hills-estate",
    name: "Dubai Hills Estate - 5BR Mansion",
    variantLabel: "5BR Mansion",
    type: "Mansion",
    category: "residential",
    priceFromAed: 12000000, priceToAed: 18000000, pricePerSqftAed: 1800,
    sizeSqftMin: 6600, sizeSqftMax: 10000,
    bedrooms: 5, bathrooms: 7,
    availableUnits: 2, totalUnits: 18,
    grossYieldPct: 4.5, netYieldPct: 3.4,
    serviceChargePerSqft: 10,
    mortgageEligible: true, maxLtv: 70,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  // === Sobha Hartland ===
  {
    id: "sobha-hartland-1br",
    developmentId: "sobha-hartland",
    name: "Sobha Hartland - 1BR Apartment",
    variantLabel: "1BR",
    type: "1BR Apartment",
    category: "residential",
    priceFromAed: 1450000, priceToAed: 2100000, pricePerSqftAed: 2200,
    sizeSqftMin: 620, sizeSqftMax: 950,
    bedrooms: 1, bathrooms: 2,
    availableUnits: 55, totalUnits: 180,
    grossYieldPct: 6.8, netYieldPct: 5.3,
    serviceChargePerSqft: 14,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 20, duringConstructionPct: 40, onHandoverPct: 40, postHandoverPct: 0, postHandoverMonths: 0, label: "20/40/40" },
  },
  {
    id: "sobha-hartland-3br-villa",
    developmentId: "sobha-hartland",
    name: "Sobha Hartland - 3BR Forest Villa",
    variantLabel: "3BR Villa",
    type: "Semi-Detached Villa",
    category: "residential",
    priceFromAed: 4200000, priceToAed: 5800000, pricePerSqftAed: 1700,
    sizeSqftMin: 2500, sizeSqftMax: 3400,
    bedrooms: 3, bathrooms: 4,
    availableUnits: 18, totalUnits: 72,
    grossYieldPct: 5.2, netYieldPct: 4.0,
    serviceChargePerSqft: 9,
    mortgageEligible: true, maxLtv: 75,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 20, duringConstructionPct: 40, onHandoverPct: 40, postHandoverPct: 0, postHandoverMonths: 0, label: "20/40/40" },
  },
  {
    id: "sobha-hartland-penthouse",
    developmentId: "sobha-hartland",
    name: "Sobha Hartland - Penthouse",
    variantLabel: "4BR PH",
    type: "Penthouse",
    category: "residential",
    priceFromAed: 8500000, priceToAed: 13000000, pricePerSqftAed: 2400,
    sizeSqftMin: 3500, sizeSqftMax: 5400,
    bedrooms: 4, bathrooms: 5,
    availableUnits: 4, totalUnits: 12,
    grossYieldPct: 5.0, netYieldPct: 3.8,
    serviceChargePerSqft: 18,
    mortgageEligible: true, maxLtv: 70,
    furnishing: "semi-furnished",
    paymentPlan: { downPaymentPct: 25, duringConstructionPct: 35, onHandoverPct: 40, postHandoverPct: 0, postHandoverMonths: 0, label: "25/35/40" },
  },
  // === DAMAC Hills ===
  {
    id: "damac-hills-3br-villa",
    developmentId: "damac-hills",
    name: "DAMAC Hills - 3BR Villa",
    variantLabel: "3BR Villa",
    type: "Detached Villa",
    category: "residential",
    priceFromAed: 2800000, priceToAed: 3900000, pricePerSqftAed: 1100,
    sizeSqftMin: 2550, sizeSqftMax: 3500,
    bedrooms: 3, bathrooms: 4,
    availableUnits: 22, totalUnits: 240,
    grossYieldPct: 5.8, netYieldPct: 4.5,
    serviceChargePerSqft: 6,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  {
    id: "damac-hills-5br-villa",
    developmentId: "damac-hills",
    name: "DAMAC Hills - 5BR Villa",
    variantLabel: "5BR Villa",
    type: "Compound Villa",
    category: "residential",
    priceFromAed: 5500000, priceToAed: 8200000, pricePerSqftAed: 1250,
    sizeSqftMin: 4400, sizeSqftMax: 6500,
    bedrooms: 5, bathrooms: 6,
    availableUnits: 14, totalUnits: 140,
    grossYieldPct: 5.3, netYieldPct: 4.1,
    serviceChargePerSqft: 7,
    mortgageEligible: true, maxLtv: 75,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  {
    id: "damac-hills-2br-apt",
    developmentId: "damac-hills",
    name: "DAMAC Hills - 2BR Apartment",
    variantLabel: "2BR",
    type: "2BR Apartment",
    category: "residential",
    priceFromAed: 1300000, priceToAed: 1850000, pricePerSqftAed: 1200,
    sizeSqftMin: 1050, sizeSqftMax: 1500,
    bedrooms: 2, bathrooms: 3,
    availableUnits: 40, totalUnits: 220,
    grossYieldPct: 6.4, netYieldPct: 5.0,
    serviceChargePerSqft: 12,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  // === Bluewaters Island ===
  {
    id: "bluewaters-1br",
    developmentId: "bluewaters-island",
    name: "Bluewaters Residences - 1BR",
    variantLabel: "1BR",
    type: "1BR Apartment",
    category: "residential",
    priceFromAed: 2650000, priceToAed: 3900000, pricePerSqftAed: 3100,
    sizeSqftMin: 850, sizeSqftMax: 1250,
    bedrooms: 1, bathrooms: 2,
    availableUnits: 28, totalUnits: 85,
    grossYieldPct: 6.1, netYieldPct: 4.7,
    serviceChargePerSqft: 20,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "semi-furnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  {
    id: "bluewaters-3br-ph",
    developmentId: "bluewaters-island",
    name: "Bluewaters Residences - 3BR Penthouse",
    variantLabel: "3BR PH",
    type: "Penthouse",
    category: "residential",
    priceFromAed: 9500000, priceToAed: 15000000, pricePerSqftAed: 3600,
    sizeSqftMin: 2600, sizeSqftMax: 4200,
    bedrooms: 3, bathrooms: 4,
    availableUnits: 3, totalUnits: 10,
    grossYieldPct: 5.4, netYieldPct: 4.1,
    serviceChargePerSqft: 25,
    mortgageEligible: true, maxLtv: 70,
    furnishing: "fully-furnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
  {
    id: "bluewaters-2br-sea",
    developmentId: "bluewaters-island",
    name: "Bluewaters Residences - 2BR Sea View",
    variantLabel: "2BR",
    type: "2BR Apartment",
    category: "residential",
    priceFromAed: 4200000, priceToAed: 6100000, pricePerSqftAed: 3300,
    sizeSqftMin: 1280, sizeSqftMax: 1850,
    bedrooms: 2, bathrooms: 3,
    availableUnits: 18, totalUnits: 58,
    grossYieldPct: 5.9, netYieldPct: 4.6,
    serviceChargePerSqft: 22,
    mortgageEligible: true, maxLtv: 75,
    furnishing: "semi-furnished",
    paymentPlan: { downPaymentPct: 10, duringConstructionPct: 0, onHandoverPct: 90, postHandoverPct: 0, postHandoverMonths: 0, label: "10/90 (Ready)" },
  },
];

async function seed() {
  console.log("Seeding 15 project variants...\n");

  // First fetch all developments to denormalize from
  const devsSnap = await db.collection("developments").get();
  const devsMap = {};
  devsSnap.forEach(d => { devsMap[d.id] = d.data(); });

  for (const p of PROJECTS) {
    const { id, developmentId, ...data } = p;
    const parent = devsMap[developmentId];
    if (!parent) {
      console.error("  - SKIP:", p.name, "parent", developmentId, "not found");
      continue;
    }

    const goldenVisa = (p.priceFromAed || 0) >= 2000000;

    const payload = {
      ...data,
      developmentId,
      slug: id,
      // Denormalized from parent
      developmentName: parent.name,
      developerId: parent.developerId,
      developerName: parent.developerName,
      community: parent.community,
      subCommunity: parent.subCommunity,
      coordinates: parent.coordinates,
      metroDistanceKm: parent.metroDistanceKm,
      beachAccess: parent.beachAccess,
      tenure: parent.tenure,
      foreignOwnershipAllowed: parent.foreignOwnershipAllowed,
      reraProjectNumber: parent.reraProjectNumber,
      escrowBank: parent.escrowBank,
      dldStarRating: parent.dldStarRating,
      coverImageUrl: parent.coverImageUrl,
      expectedHandover: parent.expectedHandover,
      saleStatus: parent.saleStatus,
      constructionStatus: parent.constructionStatus,
      constructionPct: parent.constructionPct,
      // Computed
      goldenVisaEligible: goldenVisa,
      currency: "AED",
      visibility: "published",
      orgId: "dxb-analytics",
      createdAt: ts(),
      updatedAt: ts(),
      createdBy: "seed-script",
      updatedBy: "seed-script",
      disclosedAt: ts(),
    };

    await db.collection("projects").doc(id).set(payload, { merge: true });
    await db.collection("projects").doc(id).collection("auditLog").add({
      action: "create",
      userId: "seed-script",
      userEmail: "seed-script@dxb-analytics",
      timestamp: ts(),
      source: "seed-projects.js",
    });

    console.log("  +", p.name, "-", "AED", (p.priceFromAed/1e6).toFixed(1) + "M", goldenVisa ? "[GV]" : "");
  }

  console.log("\nDone. 15 projects seeded.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});