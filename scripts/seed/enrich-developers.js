const admin = require("firebase-admin");
const path = require("path");

try {
  const serviceAccount = require(path.join(__dirname, "..", "serviceAccountKey.json"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) { console.error("ERROR: serviceAccountKey.json not found"); process.exit(1); }

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

const ENRICHMENTS = {
  aldar: { arabicName:"الدار العقارية", reraLicenseNumber:"6", founded:2005, headquarters:"Abu Dhabi, UAE", website:"https://www.aldar.com", description:"Abu Dhabi's leading real estate developer and UAE's largest listed property company. Master developer behind Yas Island and Saadiyat Island.", onTimeRate:89, totalProjects:78, completedProjects:64, activeProjects:14, tier:"tier-1", reliabilityScore:91, publiclyListed:true, stockTicker:"ALDAR.AD" },
  azizi: { arabicName:"عزيزي للتطوير", reraLicenseNumber:"7", founded:2007, headquarters:"Dubai, UAE", website:"https://www.azizidevelopments.com", description:"Privately-owned developer with residential and mixed-use projects across Dubai's key districts.", onTimeRate:68, totalProjects:64, completedProjects:42, activeProjects:22, tier:"tier-1", reliabilityScore:72 },
  danube: { arabicName:"الدانوب العقارية", reraLicenseNumber:"9", founded:1993, headquarters:"Dubai, UAE", website:"https://www.danubeproperties.com", description:"Part of Danube Group. Known for affordable payment plans and middle-income deliveries.", onTimeRate:92, totalProjects:32, completedProjects:26, activeProjects:6, tier:"tier-1", reliabilityScore:89 },
  emaardev: { arabicName:"اعمار للتطوير", reraLicenseNumber:"10", founded:2017, headquarters:"Dubai, UAE", website:"https://www.emaardevelopment.com", description:"Subsidiary of Emaar Properties focused on UAE residential developments. Listed on DFM.", onTimeRate:85, totalProjects:48, completedProjects:36, activeProjects:12, tier:"tier-1", reliabilityScore:88, publiclyListed:true, stockTicker:"EMAARDEV.DU" },
  selectgroup: { reraLicenseNumber:"12", founded:2002, headquarters:"Dubai, UAE", website:"https://www.select-group.ae", description:"Developer of 15 Northside, The Residences at Marina Gate, and luxury waterfront projects in Dubai Marina.", onTimeRate:83, totalProjects:24, completedProjects:18, activeProjects:6, tier:"tier-2", reliabilityScore:82 },
  ellington: { reraLicenseNumber:"13", founded:2014, headquarters:"Dubai, UAE", website:"https://www.ellingtonproperties.ae", description:"Design-led developer focused on boutique residential projects across Dubai's premium communities.", onTimeRate:88, totalProjects:22, completedProjects:14, activeProjects:8, tier:"tier-2", reliabilityScore:86 },
  mag: { arabicName:"ماج للتطوير العقاري", reraLicenseNumber:"14", founded:1978, headquarters:"Dubai, UAE", website:"https://www.magpd.com", description:"MAG Group's real estate arm. Portfolio includes MAG Eye, MAG 5 Boulevard, and affordable luxury developments.", onTimeRate:74, totalProjects:28, completedProjects:20, activeProjects:8, tier:"tier-2", reliabilityScore:77 },
  deyaar: { arabicName:"ديار للتطوير", reraLicenseNumber:"15", founded:2002, headquarters:"Dubai, UAE", website:"https://www.deyaar.ae", description:"Dubai-listed developer offering residential, commercial, and mixed-use developments.", onTimeRate:79, totalProjects:34, completedProjects:28, activeProjects:6, tier:"tier-2", reliabilityScore:81, publiclyListed:true, stockTicker:"DEYAAR.DU" },
  samana: { reraLicenseNumber:"16", founded:2018, headquarters:"Dubai, UAE", website:"https://www.samanadevelopers.com", description:"Fast-growing developer specializing in boutique residential projects with hotel-inspired amenities.", onTimeRate:86, totalProjects:18, completedProjects:8, activeProjects:10, tier:"tier-2", reliabilityScore:83 },
  reportage: { reraLicenseNumber:"17", founded:2014, headquarters:"Abu Dhabi, UAE", website:"https://www.reportageproperties.com", description:"Multi-national developer with projects across UAE, Egypt, Saudi Arabia, Morocco, and Turkey.", onTimeRate:73, totalProjects:42, completedProjects:24, activeProjects:18, tier:"tier-2", reliabilityScore:76 },
  imtiaz: { reraLicenseNumber:"18", founded:2013, headquarters:"Dubai, UAE", website:"https://www.imtiaz.ae", description:"Dubai-based developer with projects in Dubailand, JVC, and Arjan communities.", onTimeRate:71, totalProjects:20, completedProjects:14, activeProjects:6, tier:"tier-2", reliabilityScore:74 },
  object1: { reraLicenseNumber:"19", founded:2020, headquarters:"Dubai, UAE", website:"https://www.object-1.ae", description:"Boutique developer focusing on high-design residential projects in Business Bay and Downtown.", onTimeRate:82, totalProjects:12, completedProjects:4, activeProjects:8, tier:"tier-2", reliabilityScore:78 },
  dubaiprops: { arabicName:"دبي العقارية", reraLicenseNumber:"20", founded:2002, headquarters:"Dubai, UAE", website:"https://www.dp.ae", description:"Master developer of Jumeirah Beach Residence, Business Bay, Culture Village, and Mudon communities.", onTimeRate:84, totalProjects:56, completedProjects:44, activeProjects:12, tier:"tier-2", reliabilityScore:85 },
  wasl: { arabicName:"وصل العقارية", reraLicenseNumber:"22", founded:2008, headquarters:"Dubai, UAE", website:"https://www.wasl.ae", description:"Wholly-owned subsidiary of Dubai Real Estate Corporation. Portfolio includes Wasl1, Wasl Gate, heritage properties.", onTimeRate:88, totalProjects:36, completedProjects:30, activeProjects:6, tier:"tier-2", reliabilityScore:86 },
  tiger: { reraLicenseNumber:"23", founded:1976, headquarters:"Dubai, UAE", website:"https://www.tiger-properties.com", description:"One of UAE's oldest developers with four decades of experience. Projects across Dubai, Sharjah, and Ajman.", onTimeRate:77, totalProjects:48, completedProjects:40, activeProjects:8, tier:"tier-2", reliabilityScore:80 },
  arada: { reraLicenseNumber:"24", founded:2017, headquarters:"Sharjah, UAE", website:"https://www.arada.com", description:"Joint venture between KBW Investments and Basma Group. Master developer of Aljada in Sharjah and Masaar.", onTimeRate:89, totalProjects:14, completedProjects:6, activeProjects:8, tier:"tier-2", reliabilityScore:88 },
  bloom: { reraLicenseNumber:"25", founded:2007, headquarters:"Abu Dhabi, UAE", website:"https://www.bloomholding.com", description:"Part of National Holding. Projects include Bloom Heights and Bloom Gardens in Abu Dhabi.", onTimeRate:81, totalProjects:18, completedProjects:13, activeProjects:5, tier:"tier-2", reliabilityScore:79 },
  darglobal: { reraLicenseNumber:"26", founded:2017, headquarters:"Dubai, UAE", website:"https://www.darglobal.co.uk", description:"London-listed developer specializing in branded residences with Trump, Elie Saab, W Hotels globally.", onTimeRate:76, totalProjects:12, completedProjects:4, activeProjects:8, tier:"tier-2", reliabilityScore:78, publiclyListed:true, stockTicker:"DAR.L" },
  hh: { reraLicenseNumber:"27", founded:2015, headquarters:"Dubai, UAE", website:"https://www.hhdevelopment.com", description:"Boutique developer focused on high-end residential projects in Downtown Dubai and Business Bay.", onTimeRate:80, totalProjects:10, completedProjects:6, activeProjects:4, tier:"tier-2", reliabilityScore:81 },
  lootah: { reraLicenseNumber:"28", founded:1960, headquarters:"Dubai, UAE", website:"https://www.lootah.ae", description:"One of Dubai's oldest real estate groups with six decades of experience across residential and commercial.", onTimeRate:85, totalProjects:32, completedProjects:28, activeProjects:4, tier:"tier-2", reliabilityScore:84 },
};

async function run() {
  console.log("Enriching developers with correct IDs...\n");
  let updated = 0;

  for (const [id, data] of Object.entries(ENRICHMENTS)) {
    const ref = db.collection("developers").doc(id);
    const snap = await ref.get();
    if (!snap.exists) { console.log("  - SKIP:", id, "(not in database)"); continue; }

    await ref.set({
      ...data,
      slug: id,
      visibility: "published",
      orgId: "dxb-analytics",
      updatedAt: ts(),
      updatedBy: "enrich-script",
      disclosedAt: ts(),
    }, { merge: true });

    await ref.collection("auditLog").add({
      action: "enrich",
      userId: "enrich-script",
      timestamp: ts(),
      source: "enrich-developers-v2.js",
    });

    console.log("  +", id, "->", snap.data().name);
    updated++;
  }

  console.log("\nEnriched", updated, "developers.");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });