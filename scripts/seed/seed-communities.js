/**
 * Seed 25 real Dubai communities into communityData collection
 * Run: node scripts/seed/seed-communities.js
 */
const admin = require("firebase-admin");
const path = require("path");

try {
  const serviceAccount = require(path.join(__dirname, "..", "serviceAccountKey.json"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) { console.error("ERROR: serviceAccountKey.json not found"); process.exit(1); }

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

const COMMUNITIES = [
  { id:"downtown-dubai", name:"Downtown Dubai", arabicName:"وسط مدينة دبي", area:"Downtown", type:"Ultra-Luxury", description:"Home to Burj Khalifa, Dubai Mall, and Dubai Fountain. The most iconic address in the city.", coordinates:{lat:25.1972,lng:55.2744}, totalProjects:85, developersActive:12, avgPpsf:2400, avgRentPerSqftYr:145, grossYieldPct:6.0, netYieldPct:4.7, metroDistanceKm:0.3, nearestMetroStation:"Burj Khalifa/Dubai Mall", beachAccess:false, parkAccess:true, schoolRating:8.2, restaurantCount:450, populationEstimate:18000 },
  { id:"dubai-marina", name:"Dubai Marina", arabicName:"دبي مارينا", area:"Marina", type:"Waterfront", description:"Man-made canal city with stunning waterfront towers, JBR beach, and vibrant nightlife.", coordinates:{lat:25.0805,lng:55.1403}, totalProjects:92, developersActive:18, avgPpsf:1850, avgRentPerSqftYr:115, grossYieldPct:6.2, netYieldPct:4.9, metroDistanceKm:0.5, nearestMetroStation:"DMCC", beachAccess:true, parkAccess:true, schoolRating:7.8, restaurantCount:380, populationEstimate:55000 },
  { id:"business-bay", name:"Business Bay", arabicName:"الخليج التجاري", area:"CBD", type:"Mixed-Use", description:"Dubai's central business district along the canal, blending office towers and residential high-rises.", coordinates:{lat:25.1866,lng:55.2648}, totalProjects:110, developersActive:22, avgPpsf:1650, avgRentPerSqftYr:105, grossYieldPct:6.4, netYieldPct:5.0, metroDistanceKm:0.4, nearestMetroStation:"Business Bay", beachAccess:false, parkAccess:true, schoolRating:7.5, restaurantCount:280, populationEstimate:42000 },
  { id:"palm-jumeirah", name:"Palm Jumeirah", arabicName:"نخلة جميرا", area:"Waterfront", type:"Beachfront", description:"The world's largest man-made island, shaped like a palm tree with luxury villas and beachfront towers.", coordinates:{lat:25.1124,lng:55.1390}, totalProjects:68, developersActive:15, avgPpsf:2800, avgRentPerSqftYr:165, grossYieldPct:5.9, netYieldPct:4.6, metroDistanceKm:3.5, nearestMetroStation:"Palm Jumeirah Tram", beachAccess:true, parkAccess:true, schoolRating:8.0, restaurantCount:220, populationEstimate:25000 },
  { id:"dubai-hills-estate", name:"Dubai Hills Estate", arabicName:"تلال دبي", area:"New Dubai", type:"Master Community", description:"Emaar's 2700-acre community built around an 18-hole championship golf course with Dubai Hills Mall.", coordinates:{lat:25.1089,lng:55.2513}, totalProjects:58, developersActive:8, avgPpsf:1550, avgRentPerSqftYr:92, grossYieldPct:5.9, netYieldPct:4.6, metroDistanceKm:5.8, nearestMetroStation:"Noor Bank", beachAccess:false, golfAccess:true, parkAccess:true, schoolRating:8.5, restaurantCount:120, populationEstimate:35000 },
  { id:"dubai-creek-harbour", name:"Dubai Creek Harbour", arabicName:"خور دبي", area:"Waterfront", type:"Waterfront", description:"Emaar's flagship waterfront district with Dubai Creek Tower and mixed-use developments.", coordinates:{lat:25.1983,lng:55.3378}, totalProjects:42, developersActive:5, avgPpsf:1900, avgRentPerSqftYr:110, grossYieldPct:5.8, netYieldPct:4.5, metroDistanceKm:2.0, nearestMetroStation:"Deira City Centre", beachAccess:false, parkAccess:true, schoolRating:7.9, restaurantCount:85, populationEstimate:18000 },
  { id:"emaar-beachfront", name:"Emaar Beachfront", arabicName:"اعمار بيتش فرونت", area:"Dubai Harbour", type:"Beachfront", description:"Exclusive island in Dubai Harbour with ultra-luxury beachfront towers and private beach.", coordinates:{lat:25.0921,lng:55.1364}, totalProjects:27, developersActive:1, avgPpsf:3200, avgRentPerSqftYr:185, grossYieldPct:5.8, netYieldPct:4.5, metroDistanceKm:2.4, nearestMetroStation:"Al Sufouh Tram", beachAccess:true, parkAccess:true, schoolRating:8.0, restaurantCount:75, populationEstimate:12000 },
  { id:"mbr-city", name:"MBR City", arabicName:"مدينة محمد بن راشد", area:"MBR City", type:"Master Community", description:"Mohammed Bin Rashid City — a vast master-planned community with Meydan racecourse and lagoons.", coordinates:{lat:25.1789,lng:55.3212}, totalProjects:120, developersActive:28, avgPpsf:1700, avgRentPerSqftYr:100, grossYieldPct:5.9, netYieldPct:4.6, metroDistanceKm:4.2, nearestMetroStation:"Business Bay", beachAccess:false, parkAccess:true, schoolRating:8.1, restaurantCount:180, populationEstimate:28000 },
  { id:"jvc", name:"Jumeirah Village Circle", arabicName:"قرية جميرا سركل", area:"New Dubai", type:"Mid-rise Mixed", description:"Family-friendly community with mid-rise apartments and townhouses. Most affordable premium location.", coordinates:{lat:25.0590,lng:55.2081}, totalProjects:185, developersActive:42, avgPpsf:1100, avgRentPerSqftYr:78, grossYieldPct:7.1, netYieldPct:5.6, metroDistanceKm:8.5, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:7.2, restaurantCount:260, populationEstimate:70000 },
  { id:"jvt", name:"Jumeirah Village Triangle", arabicName:"قرية جميرا تراينجل", area:"New Dubai", type:"Family Villas", description:"Sister community to JVC with more villas and townhouses, focused on family living.", coordinates:{lat:25.0517,lng:55.2033}, totalProjects:42, developersActive:12, avgPpsf:1050, avgRentPerSqftYr:72, grossYieldPct:6.9, netYieldPct:5.4, metroDistanceKm:9.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:7.0, restaurantCount:85, populationEstimate:22000 },
  { id:"arabian-ranches-3", name:"Arabian Ranches 3", arabicName:"المرابع العربية 3", area:"Dubailand", type:"Family Villas", description:"Emaar's third phase of the family villa community with lagoons and retail districts.", coordinates:{lat:25.0381,lng:55.2625}, totalProjects:18, developersActive:1, avgPpsf:1300, avgRentPerSqftYr:85, grossYieldPct:6.5, netYieldPct:5.1, metroDistanceKm:12.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:8.8, restaurantCount:45, populationEstimate:15000 },
  { id:"emaar-south", name:"Emaar South", arabicName:"اعمار الجنوب", area:"Dubai South", type:"Master Community", description:"Golf-centered community near Al Maktoum Airport and Expo City, mixing villas and apartments.", coordinates:{lat:24.8894,lng:55.1633}, totalProjects:32, developersActive:3, avgPpsf:1200, avgRentPerSqftYr:80, grossYieldPct:6.7, netYieldPct:5.2, metroDistanceKm:2.5, nearestMetroStation:"Expo 2020", beachAccess:false, golfAccess:true, parkAccess:true, schoolRating:7.8, restaurantCount:65, populationEstimate:18000 },
  { id:"the-valley", name:"The Valley", arabicName:"الوادي", area:"Dubailand", type:"Family Villas", description:"Emaar's suburban villa community with townhouses, parks, and retail in Dubailand.", coordinates:{lat:25.0122,lng:55.4389}, totalProjects:24, developersActive:1, avgPpsf:1150, avgRentPerSqftYr:72, grossYieldPct:6.3, netYieldPct:4.9, metroDistanceKm:18.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:7.5, restaurantCount:35, populationEstimate:12000 },
  { id:"the-oasis", name:"The Oasis", arabicName:"الواحة", area:"Dubailand", type:"Ultra-Luxury", description:"Emaar's ultra-luxury mansion community in Dubailand with a water theme across 100 million sqft.", coordinates:{lat:25.0458,lng:55.3478}, totalProjects:8, developersActive:1, avgPpsf:2200, avgRentPerSqftYr:130, grossYieldPct:5.9, netYieldPct:4.5, metroDistanceKm:14.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:8.0, restaurantCount:15, populationEstimate:5000 },
  { id:"damac-hills", name:"DAMAC Hills", arabicName:"داماك هيلز", area:"Dubailand", type:"Golf", description:"42 million sqft community centered around Trump International Golf Club Dubai.", coordinates:{lat:25.0258,lng:55.2608}, totalProjects:45, developersActive:3, avgPpsf:1150, avgRentPerSqftYr:75, grossYieldPct:6.5, netYieldPct:5.1, metroDistanceKm:12.5, nearestMetroStation:"None", beachAccess:false, golfAccess:true, parkAccess:true, schoolRating:7.6, restaurantCount:55, populationEstimate:20000 },
  { id:"damac-hills-2", name:"DAMAC Hills 2", arabicName:"داماك هيلز 2", area:"Dubailand", type:"Family Villas", description:"Affordable sister community to DAMAC Hills with villas, water attractions, and sports facilities.", coordinates:{lat:24.9983,lng:55.2858}, totalProjects:38, developersActive:1, avgPpsf:850, avgRentPerSqftYr:58, grossYieldPct:6.8, netYieldPct:5.3, metroDistanceKm:15.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:7.0, restaurantCount:30, populationEstimate:14000 },
  { id:"tilal-al-ghaf", name:"Tilal Al Ghaf", arabicName:"تلال الغاف", area:"Dubailand", type:"Luxury Villas", description:"Majid Al Futtaim development with lagoons, a recreational crystal lagoon, and luxury villas.", coordinates:{lat:25.0219,lng:55.2053}, totalProjects:22, developersActive:2, avgPpsf:1550, avgRentPerSqftYr:95, grossYieldPct:6.1, netYieldPct:4.7, metroDistanceKm:11.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:8.3, restaurantCount:40, populationEstimate:15000 },
  { id:"bluewaters-island", name:"Bluewaters Island", arabicName:"جزيرة بلوواترز", area:"Waterfront", type:"Beachfront", description:"Man-made island home to Ain Dubai (world's tallest observation wheel) and luxury residences.", coordinates:{lat:25.0790,lng:55.1238}, totalProjects:6, developersActive:1, avgPpsf:3100, avgRentPerSqftYr:175, grossYieldPct:5.6, netYieldPct:4.3, metroDistanceKm:1.8, nearestMetroStation:"JBR 1", beachAccess:true, parkAccess:true, schoolRating:7.5, restaurantCount:95, populationEstimate:8000 },
  { id:"city-walk", name:"City Walk", arabicName:"سيتي ووك", area:"New Dubai", type:"Mixed-Use", description:"Meraas open-air lifestyle district blending apartments, retail, dining, and entertainment.", coordinates:{lat:25.2055,lng:55.2625}, totalProjects:18, developersActive:2, avgPpsf:2100, avgRentPerSqftYr:125, grossYieldPct:6.0, netYieldPct:4.7, metroDistanceKm:1.5, nearestMetroStation:"World Trade Centre", beachAccess:false, parkAccess:true, schoolRating:8.0, restaurantCount:180, populationEstimate:11000 },
  { id:"mina-rashid", name:"Mina Rashid", arabicName:"ميناء راشد", area:"Bur Dubai", type:"Waterfront", description:"Heritage port area being transformed into a luxury marina destination with Sirius Star residences.", coordinates:{lat:25.2569,lng:55.2864}, totalProjects:14, developersActive:2, avgPpsf:1750, avgRentPerSqftYr:100, grossYieldPct:5.8, netYieldPct:4.5, metroDistanceKm:1.2, nearestMetroStation:"Al Ghubaiba", beachAccess:false, parkAccess:true, schoolRating:7.2, restaurantCount:55, populationEstimate:9000 },
  { id:"town-square", name:"Town Square Dubai", arabicName:"تاون سكوير دبي", area:"Dubailand", type:"Mid-rise Mixed", description:"Nshama's community-focused family development with townhouses, apartments, and central park.", coordinates:{lat:24.9394,lng:55.2961}, totalProjects:35, developersActive:1, avgPpsf:850, avgRentPerSqftYr:62, grossYieldPct:7.3, netYieldPct:5.7, metroDistanceKm:18.0, nearestMetroStation:"None", beachAccess:false, parkAccess:true, schoolRating:7.4, restaurantCount:45, populationEstimate:28000 },
  { id:"al-furjan", name:"Al Furjan", arabicName:"الفرجان", area:"New Dubai", type:"Mid-rise Mixed", description:"Nakheel community with villas, townhouses, and apartments near Ibn Battuta Mall.", coordinates:{lat:25.0303,lng:55.1433}, totalProjects:58, developersActive:14, avgPpsf:1050, avgRentPerSqftYr:72, grossYieldPct:6.9, netYieldPct:5.4, metroDistanceKm:0.8, nearestMetroStation:"Discovery Gardens", beachAccess:false, parkAccess:true, schoolRating:7.3, restaurantCount:85, populationEstimate:32000 },
  { id:"meydan", name:"Meydan", arabicName:"ميدان", area:"MBR City", type:"Luxury Villas", description:"Home to Meydan Racecourse and luxury villa communities with horse-racing heritage.", coordinates:{lat:25.1572,lng:55.3019}, totalProjects:42, developersActive:8, avgPpsf:1450, avgRentPerSqftYr:88, grossYieldPct:6.1, netYieldPct:4.7, metroDistanceKm:4.5, nearestMetroStation:"Business Bay", beachAccess:false, parkAccess:true, schoolRating:7.8, restaurantCount:75, populationEstimate:18000 },
  { id:"dubai-south", name:"Dubai South", arabicName:"دبي الجنوب", area:"Dubai South", type:"Master Community", description:"Aviation-themed master community near Al Maktoum Airport and Expo City with mixed residential districts.", coordinates:{lat:24.8942,lng:55.1639}, totalProjects:52, developersActive:12, avgPpsf:950, avgRentPerSqftYr:65, grossYieldPct:6.8, netYieldPct:5.3, metroDistanceKm:1.5, nearestMetroStation:"Expo 2020", beachAccess:false, parkAccess:true, schoolRating:7.5, restaurantCount:60, populationEstimate:25000 },
  { id:"expo-city", name:"Expo City Dubai", arabicName:"اكسبو سيتي دبي", area:"Expo City", type:"Mixed-Use", description:"Expo 2020 legacy area being transformed into a sustainable smart city with Expo City Residences.", coordinates:{lat:24.9608,lng:55.1531}, totalProjects:12, developersActive:2, avgPpsf:1300, avgRentPerSqftYr:82, grossYieldPct:6.3, netYieldPct:4.9, metroDistanceKm:0.5, nearestMetroStation:"Expo 2020", beachAccess:false, parkAccess:true, schoolRating:7.8, restaurantCount:40, populationEstimate:8000 },
];

async function seed() {
  console.log("Seeding 25 Dubai communities...\n");

  for (const c of COMMUNITIES) {
    const { id, ...data } = c;
    await db.collection("communityData").doc(id).set({
      ...data,
      slug: id,
      visibility: "published",
      orgId: "dxb-analytics",
      createdAt: ts(),
      updatedAt: ts(),
      createdBy: "seed-script",
      updatedBy: "seed-script",
      disclosedAt: ts(),
    }, { merge: true });

    await db.collection("communityData").doc(id).collection("auditLog").add({
      action: "create",
      userId: "seed-script",
      timestamp: ts(),
      source: "seed-communities.js",
    });

    console.log("  +", c.name, "- AED", c.avgPpsf + "/sqft -", c.grossYieldPct + "% yield");
  }

  console.log("\nDone. 25 communities seeded.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });