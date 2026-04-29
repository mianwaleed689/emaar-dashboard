const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Comprehensive DLD zone → branded community name mapping
const COMMUNITY_MAP = {
  // JVC area
  "Jumeirah Village Circle":     "Jumeirah Village Circle",
  "Al Barsha South Fourth":      "Jumeirah Village Circle",
  
  // JVT area  
  "Jumeirah Village Triangle":   "Jumeirah Village Triangle",
  "Al Barsha South Fifth":       "Jumeirah Village Triangle",
  "Al Barshaa South Third":      "Arjan",
  "Al Barshaa South Second":     "Jumeirah Village Triangle",
  
  // Arjan/Dubai land
  "Arjan":                       "Arjan",
  
  // Tilal Al Ghaf / MBR City
  "Tilal Al Ghaf":               "Tilal Al Ghaf",
  "Hadaeq Sheikh Mohammed Bin Rashid": "Dubai Hills Estate",
  "Mohammed Bin Rashid City":    "Mohammed Bin Rashid City",
  "Meydan":                      "Meydan",
  "Al Merkadh":                  "Meydan",
  
  // Dubai South / Emaar South
  "Emaar South":                 "Emaar South",
  "Madinat Al Mataar":           "Emaar South",
  
  // Palm areas
  "Palm Deira":                  "Palm Deira",
  "Palm Jumeirah":               "Palm Jumeirah",
  "Palm Jabal Ali":              "Palm Jebel Ali",
  
  // Jebel Ali
  "Jebel Ali":                   "Jebel Ali",
  "Jabal Ali First":             "Jebel Ali",
  "Jabal Ali Industrial Second": "Jebel Ali Industrial",
  
  // Business Bay / Downtown
  "Business Bay":                "Business Bay",
  "Burj Khalifa":                "Downtown Dubai",
  "Downtown Dubai":              "Downtown Dubai",
  "Zabeel":                      "Zabeel",
  "Zaabeel First":               "Zabeel",
  "Zaabeel Second":              "Zabeel",
  
  // Dubai Marina / JBR
  "Dubai Marina":                "Dubai Marina",
  "Marsa Dubai":                 "Dubai Marina",
  "Jumeirah Beach Residence":    "Jumeirah Beach Residence",
  
  // Dubai Creek
  "Dubai Creek Harbour":         "Dubai Creek Harbour",
  "Al Khairan First":            "Dubai Creek Harbour",
  
  // Sports City / Motor City
  "Dubai Sports City":           "Dubai Sports City",
  "Al Hebiah Fourth":            "Dubai Sports City",
  "Al Hebiah First":             "Dubai Sports City",
  "Al Hebiah Second":            "Motor City",
  "Al Hebiah Third":             "Motor City",
  "Al Hebiah Fifth":             "Dubai Sports City",
  "Al Hebiah Sixth":             "Dubai Sports City",
  "Motor City":                  "Motor City",
  
  // Dubailand
  "Dubailand":                   "Dubailand",
  "Wadi Al Safa 2":              "Dubailand",
  "Wadi Al Safa 3":              "Dubailand",
  "Wadi Al Safa 4":              "Dubailand",
  "Wadi Al Safa 5":              "Dubailand",
  "Wadi Al Safa 7":              "Dubailand",
  "Dubai Land Residence Complex":"Dubailand",
  
  // Production City / IMPZ
  "Dubai Production City":       "Dubai Production City",
  "Me'Aisem First":              "Dubai Production City",
  "Me'Aisem Second":             "Dubai Production City",
  
  // Al Barsha
  "Al Barsha First":             "Al Barsha",
  "Al Barsha Second":            "Al Barsha",
  "Al Barsha Third":             "Al Barsha",
  "Barsha Heights":              "Barsha Heights",
  "Al Thanyah First":            "Barsha Heights",
  "Al Thanyah Third":            "Barsha Heights",
  "Al Thanyah Fifth":            "Barsha Heights",
  
  // Silicon Oasis
  "Dubai Silicon Oasis":         "Dubai Silicon Oasis",
  "Nadd Hessa":                  "Dubai Silicon Oasis",
  
  // Bur Dubai / Deira
  "Bur Dubai":                   "Bur Dubai",
  "Al Karama":                   "Al Karama",
  "Al Jadaf":                    "Al Jadaf",
  "Um Hurair Second":            "Bur Dubai",
  "Al Kifaf":                    "Bur Dubai",
  "Al Satwa":                    "Al Satwa",
  "Al Wasl":                     "Al Wasl",
  "Jumeirah":                    "Jumeirah",
  "Jumeirah First":              "Jumeirah",
  "Jumeirah Second":             "Jumeirah",
  
  // International City
  "International City":          "International City",
  "Al Warsan First":             "International City",
  "Warsan Fourth":               "International City",
  
  // Al Sufouh
  "Al Safouh First":             "Al Sufouh",
  "Al Safouh Second":            "Al Sufouh",
  "Al Sufouh Second":            "Al Sufouh",
  
  // Ras Al Khor
  "Ras Al Khor":                 "Ras Al Khor",
  "Ras Al Khor Industrial First":"Ras Al Khor",
  
  // Discovery Gardens
  "Discovery Gardens":           "Discovery Gardens",
  
  // Al Furjan
  "Al Furjan":                   "Al Furjan",
  
  // DIFC
  "DIFC":                        "DIFC",
  "Trade Center First":          "DIFC",
  "Trade Center Second":         "DIFC",
  
  // Dubai Investment Park
  "Dubai Investment Park":       "Dubai Investment Park",
  "Dubai Investment Park First": "Dubai Investment Park",
  "Dubai Investment Park Second":"Dubai Investment Park",
  
  // Dubai Hills
  "Dubai Hills Estate":          "Dubai Hills Estate",
  
  // Maritime / The World
  "Madinat Dubai Almelaheyah":   "Dubai Maritime City",
  "The World":                   "The World Islands",
  "World Islands":               "The World Islands",
  "Island 2":                    "The World Islands",
  
  // Sobha
  "Sobha Hartland":              "Sobha Hartland",
  
  // Others
  "Madinat Hind 4":              "DAMAC Hills 2",
  "Al Yufrah 1":                 "Tilal Al Ghaf",
  "Al Yelayiss 1":               "Tilal Al Ghaf",
  "Al Yelayiss 2":               "Tilal Al Ghaf",
  "Nad Al Shiba First":          "Meydan",
  "Bukadra":                     "Ras Al Khor",
  "Al Barsha South Third":       "Arjan",
  "Mirdif":                      "Mirdif",
  "Saih Shuaib 1":               "Emaar South",
  "Saih Shuaib 2":               "Emaar South",
  "Al Hebiah Sixth":             "Dubai Sports City",
};

// Also fix developer names properly
const DEV_MAP = {
  "Jumeirah Village":            "Nakheel",
  "Dubai Airports":              "Dubai Airports Corporation",
  "Dubai Real Estate Developer": "Dubai Properties",
};

async function run() {
  const snap = await db.collection("projects").get();
  const docs = snap.docs;
  let commFixed=0, devFixed=0;
  const BATCH_SIZE=400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const updates = {};
      
      // Fix community
      const mapped = COMMUNITY_MAP[p.community];
      if(mapped && mapped!==p.community) {
        updates.community = mapped;
        updates.dldAreaName = p.community; // preserve original
        commFixed++;
      }
      
      // Fix developer
      const devMapped = DEV_MAP[p.developer];
      if(devMapped) {
        updates.developer = devMapped;
        devFixed++;
      }
      
      if(Object.keys(updates).length>0) {
        batch.update(d.ref, updates);
      }
    });
    await batch.commit();
    console.log("Batch "+Math.floor(i/BATCH_SIZE+1)+" done");
  }

  console.log("\nCommunities remapped:", commFixed);
  console.log("Developers fixed:", devFixed);

  // Final community list
  const snap2 = await db.collection("projects").get();
  const projects = snap2.docs.map(d=>d.data()).filter(p=>!p.archived);
  const commCount={}, devCount={};
  projects.forEach(p=>{
    commCount[p.community||"?"]=(commCount[p.community||"?"]||0)+1;
    devCount[p.developer||"?"]=(devCount[p.developer||"?"]||0)+1;
  });

  console.log("\n=== FINAL DEVELOPERS ("+Object.keys(devCount).length+") ===");
  Object.entries(devCount).sort((a,b)=>b[1]-a[1]).forEach(([d,c])=>
    console.log(c.toString().padStart(5), d)
  );

  console.log("\n=== FINAL COMMUNITIES ("+Object.keys(commCount).length+") ===");
  Object.entries(commCount).sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>
    console.log(n.toString().padStart(5), c)
  );

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});