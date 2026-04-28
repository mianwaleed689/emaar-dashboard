const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// These communities have verified research data — upgrade their tier
const VERIFIED_COMMUNITIES = [
  "Palm Jumeirah","Downtown Dubai","Dubai Marina","DIFC",
  "Jumeirah Beach Residence","Emirates Hills","Business Bay",
  "Jumeirah Lake Towers","Jumeirah Village Circle","Al Barsha",
  "Mirdif","Al Furjan","Dubai Silicon Oasis","International City",
  "Discovery Gardens","Jumeirah","Bur Dubai","Deira","Motor City",
  "Dubai Sports City","Town Square","Arjan","Dubai Investment Park",
  "Jumeirah Village Triangle","Dubai Creek Harbour",
  "Mohammed Bin Rashid City","Al Jaddaf","Barsha Heights",
  "Dubai Production City","Al Quoz","Al Karama","Oud Metha",
  "Al Sufouh","Jumeirah Golf Estates","Al Barari","DAMAC Hills",
  "DAMAC Hills 2","Tilal Al Ghaf","Sobha Hartland","Al Rashidiya",
  "Al Qusais","Ras Al Khor","The Springs","The Meadows","The Lakes",
  "Arabian Ranches","Mudon","City Walk","La Mer","Al Wasl",
  "Jebel Ali","The World","Dubai Harbour","Bluewaters Island",
  "Jumeirah Beach Residence (JBR)","DMCC Master Community",
  "District One (MBR City)","Meydan City","Sobha Hartland 2",
  "Dubai South","Expo City Dubai","Grand Polo Club & Resort",
  "Arabian Ranches III","The Heights","The Oasis","Emaar South",
  "Emaar Beachfront","Expo Living","Dubailand",
];

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const batch = db.batch();
  let updated = 0;

  snap.docs.forEach(d => {
    const n = d.data();
    if (VERIFIED_COMMUNITIES.includes(n.community) && n.tier !== "verified") {
      batch.update(d.ref, { tier: "verified" });
      console.log("Upgraded:", n.community);
      updated++;
    }
  });

  await batch.commit();
  console.log("\nTotal upgraded:", updated);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});