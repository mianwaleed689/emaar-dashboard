const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// ALL major Dubai developers with real data
const DEVELOPERS = [
  // Tier 1 — Government/Major
  {id:"emaar",          name:"Emaar Properties",          tier:1, onTime:92, projects:400, founded:1997, specialty:"Master communities, luxury",   areas:["Downtown Dubai","Dubai Marina","Dubai Hills Estate","Dubai Creek Harbour","Emaar Beachfront","Emaar South","Arabian Ranches","The Valley","The Oasis"]},
  {id:"nakheel",        name:"Nakheel",                   tier:1, onTime:85, projects:300, founded:1990, specialty:"Waterfront, Palm islands",      areas:["Palm Jumeirah","Palm Deira","Palm Jebel Ali","Jumeirah Village Circle","Jumeirah Village Triangle","Discovery Gardens","International City","Al Furjan","Jebel Ali"]},
  {id:"damac",          name:"Damac Properties",          tier:1, onTime:78, projects:200, founded:2002, specialty:"Luxury branded residences",     areas:["Business Bay","DAMAC Hills","DAMAC Hills 2","Dubai Marina","Akoya Oxygen"]},
  {id:"meraas",         name:"Meraas",                    tier:1, onTime:88, projects:50,  founded:2007, specialty:"Destination communities",       areas:["Bluewaters Island","City Walk","La Mer","Port de la Mer","Al Habtoor City","Dubai Harbour"]},
  {id:"dubai-properties",name:"Dubai Properties",        tier:1, onTime:82, projects:100, founded:2004, specialty:"Master communities",             areas:["Jumeirah Beach Residence","Business Bay","Mudon","Villanova","Dubai Wharf","Culture Village"]},
  {id:"meydan",         name:"Meydan Group",              tier:1, onTime:80, projects:100, founded:2007, specialty:"MBR City, equestrian",          areas:["Meydan","Mohammed Bin Rashid City","Nad Al Sheba"]},
  {id:"wasl",           name:"Wasl Asset Management",    tier:1, onTime:85, projects:80,  founded:2008, specialty:"Mixed use, hospitality",         areas:["Jumeirah Golf Estates","Wasl1","Za'abeel"]},
  {id:"aldar",          name:"Aldar Properties",          tier:1, onTime:90, projects:150, founded:2004, specialty:"Abu Dhabi, integrated communities", areas:["Yas Island","Al Raha Beach","Saadiyat Island"]},

  // Tier 2 — Major Private
  {id:"sobha",          name:"Sobha Realty",              tier:2, onTime:88, projects:30,  founded:1976, specialty:"Quality, in-house construction", areas:["Sobha Hartland","Sobha Reserve","Sobha One"]},
  {id:"majid-al-futtaim",name:"Majid Al Futtaim",        tier:2, onTime:85, projects:20,  founded:1992, specialty:"Master communities, retail",    areas:["Tilal Al Ghaf","Ghaf Woods"]},
  {id:"binghatti",      name:"Binghatti Developers",      tier:2, onTime:82, projects:60,  founded:2012, specialty:"Architectural design, mid-luxury", areas:["Business Bay","JVC","Dubai Silicon Oasis","Al Jaddaf"]},
  {id:"azizi",          name:"Azizi Developments",        tier:2, onTime:80, projects:200, founded:2007, specialty:"Affordable luxury, fast delivery", areas:["Meydan","Palm Jumeirah","Dubai Healthcare City","Studio City"]},
  {id:"danube",         name:"Danube Properties",         tier:2, onTime:90, projects:34,  founded:2014, specialty:"Affordable, flexible payments",  areas:["JVC","Arjan","Al Furjan","Meydan"]},
  {id:"ellington",      name:"Ellington Properties",      tier:2, onTime:92, projects:25,  founded:2014, specialty:"Design-led boutique",           areas:["JVC","Dubai Hills Estate","Business Bay","MBR City","Downtown Dubai"]},
  {id:"select-group",   name:"Select Group",              tier:2, onTime:85, projects:15,  founded:2002, specialty:"Waterfront luxury",             areas:["Business Bay","Dubai Marina","Palm Jumeirah"]},
  {id:"omniyat",        name:"Omniyat",                   tier:2, onTime:80, projects:10,  founded:2005, specialty:"Ultra luxury, iconic design",   areas:["Business Bay","Downtown Dubai","Palm Jumeirah"]},
  {id:"tiger-group",    name:"Tiger Group",               tier:2, onTime:75, projects:40,  founded:2007, specialty:"High-rise, commercial",         areas:["Business Bay","JLT","Dubai Sports City"]},
  {id:"mag",            name:"MAG Group",                 tier:2, onTime:80, projects:20,  founded:2003, specialty:"Sustainable, smart homes",      areas:["Meydan","Dubai South","JLT"]},

  // Tier 3 — Growing
  {id:"nshama",         name:"Nshama",                    tier:3, onTime:83, projects:15,  founded:2014, specialty:"Affordable family communities", areas:["Town Square","Rawda Apartments"]},
  {id:"deyaar",         name:"Deyaar Properties",         tier:3, onTime:82, projects:25,  founded:2002, specialty:"Mid-market residential",        areas:["Dubai Production City","Business Bay","Al Barsha"]},
  {id:"imtiaz",         name:"Imtiaz Developments",       tier:3, onTime:80, projects:10,  founded:2017, specialty:"Boutique luxury",               areas:["JVC","Business Bay"]},
  {id:"iman",           name:"Iman Developers",           tier:3, onTime:88, projects:15,  founded:2016, specialty:"Design-driven boutique",        areas:["JVC","Dubai Hills Estate","Al Furjan"]},
  {id:"reportage",      name:"Reportage Properties",      tier:3, onTime:78, projects:20,  founded:2014, specialty:"Affordable mid-market",         areas:["JVC","Dubailand","Abu Dhabi"]},
  {id:"samana",         name:"Samana Developers",         tier:3, onTime:75, projects:25,  founded:2017, specialty:"Pool apartments, affordable",   areas:["JVC","Dubai Studio City","Al Furjan"]},
  {id:"object1",        name:"Object 1",                  tier:3, onTime:78, projects:12,  founded:2019, specialty:"Boutique modern",               areas:["JVC","Business Bay"]},
  {id:"arada",          name:"Arada",                     tier:3, onTime:85, projects:10,  founded:2017, specialty:"Master communities Sharjah",    areas:["Sharjah","Aljada","Masaar"]},
  {id:"tecom",          name:"TECOM Investments",         tier:3, onTime:85, projects:50,  founded:2000, specialty:"Business districts, tech",      areas:["Dubai Internet City","Dubai Media City","Barsha Heights","Dubai Production City"]},
  {id:"union-properties",name:"Union Properties",        tier:3, onTime:72, projects:18,  founded:1987, specialty:"Motor City, mixed use",          areas:["Motor City","Green Community","DIFC"]},
  {id:"dubai-sports-city",name:"Dubai Sports City",      tier:3, onTime:78, projects:70,  founded:2003, specialty:"Sports themed community",       areas:["Dubai Sports City"]},
  {id:"dubai-investments",name:"Dubai Investments",      tier:3, onTime:80, projects:36,  founded:1994, specialty:"Industrial, residential",        areas:["Dubai Investment Park","Mirdif Hills"]},
];

// ALL Dubai communities with real data
const COMMUNITIES = [
  // Premium/Luxury
  {id:"downtown-dubai",        name:"Downtown Dubai",          area:"Downtown",       avgPpsf:3200, grossYield:5.5, tier:"premium"},
  {id:"palm-jumeirah",         name:"Palm Jumeirah",           area:"Palm",           avgPpsf:3800, grossYield:5.2, tier:"premium"},
  {id:"dubai-marina",          name:"Dubai Marina",            area:"Marina",         avgPpsf:2200, grossYield:6.8, tier:"premium"},
  {id:"jumeirah-beach-residence",name:"Jumeirah Beach Residence",area:"JBR",         avgPpsf:2400, grossYield:6.5, tier:"premium"},
  {id:"bluewaters-island",     name:"Bluewaters Island",       area:"Bluewaters",     avgPpsf:3500, grossYield:5.8, tier:"premium"},
  {id:"city-walk",             name:"City Walk",               area:"Al Wasl",        avgPpsf:2800, grossYield:5.5, tier:"premium"},
  {id:"difc",                  name:"DIFC",                    area:"Trade Centre",   avgPpsf:3000, grossYield:5.0, tier:"premium"},
  {id:"la-mer",                name:"La Mer",                  area:"Jumeirah",       avgPpsf:2600, grossYield:5.8, tier:"premium"},
  {id:"dubai-harbour",         name:"Dubai Harbour",           area:"Dubai Harbour",  avgPpsf:3200, grossYield:5.5, tier:"premium"},
  {id:"emaar-beachfront",      name:"Emaar Beachfront",        area:"Dubai Harbour",  avgPpsf:3400, grossYield:5.8, tier:"premium"},
  {id:"sobha-hartland",        name:"Sobha Hartland",          area:"MBR City",       avgPpsf:2700, grossYield:5.8, tier:"premium"},
  {id:"palm-jebel-ali",        name:"Palm Jebel Ali",          area:"Jebel Ali",      avgPpsf:2800, grossYield:5.5, tier:"premium"},

  // Upper Mid
  {id:"dubai-hills-estate",    name:"Dubai Hills Estate",      area:"Dubai Hills",    avgPpsf:2100, grossYield:6.2, tier:"upper-mid"},
  {id:"dubai-creek-harbour",   name:"Dubai Creek Harbour",     area:"Creek Harbour",  avgPpsf:2200, grossYield:6.0, tier:"upper-mid"},
  {id:"business-bay",          name:"Business Bay",            area:"Business Bay",   avgPpsf:2000, grossYield:7.2, tier:"upper-mid"},
  {id:"jumeirah-lake-towers",  name:"Jumeirah Lake Towers",    area:"JLT",            avgPpsf:1650, grossYield:7.5, tier:"upper-mid"},
  {id:"al-barsha",             name:"Al Barsha",               area:"Al Barsha",      avgPpsf:1400, grossYield:6.8, tier:"upper-mid"},
  {id:"meydan",                name:"Meydan",                  area:"MBR City",       avgPpsf:1900, grossYield:6.5, tier:"upper-mid"},
  {id:"mohammed-bin-rashid-city",name:"Mohammed Bin Rashid City",area:"MBR City",     avgPpsf:2000, grossYield:6.2, tier:"upper-mid"},
  {id:"tilal-al-ghaf",         name:"Tilal Al Ghaf",           area:"Dubailand",      avgPpsf:1800, grossYield:6.2, tier:"upper-mid"},
  {id:"barsha-heights",        name:"Barsha Heights",          area:"Barsha Heights", avgPpsf:1400, grossYield:7.2, tier:"upper-mid"},
  {id:"al-jadaf",              name:"Al Jadaf",                area:"Al Jadaf",       avgPpsf:1500, grossYield:6.5, tier:"upper-mid"},
  {id:"zabeel",                name:"Zabeel",                  area:"Zabeel",         avgPpsf:2200, grossYield:5.8, tier:"upper-mid"},
  {id:"culture-village",       name:"Culture Village",         area:"Al Jadaf",       avgPpsf:1600, grossYield:6.2, tier:"upper-mid"},
  {id:"al-wasl",               name:"Al Wasl",                 area:"Al Wasl",        avgPpsf:2000, grossYield:5.5, tier:"upper-mid"},
  {id:"jumeirah",              name:"Jumeirah",                area:"Jumeirah",       avgPpsf:2800, grossYield:5.2, tier:"upper-mid"},
  {id:"al-sufouh",             name:"Al Sufouh",               area:"Al Sufouh",      avgPpsf:2200, grossYield:6.0, tier:"upper-mid"},

  // Mid Market
  {id:"jvc",                   name:"Jumeirah Village Circle", area:"JVC",            avgPpsf:1480, grossYield:7.8, tier:"mid"},
  {id:"jvt",                   name:"Jumeirah Village Triangle",area:"JVT",           avgPpsf:1500, grossYield:7.5, tier:"mid"},
  {id:"arjan",                 name:"Arjan",                   area:"Arjan",          avgPpsf:1400, grossYield:7.8, tier:"mid"},
  {id:"al-furjan",             name:"Al Furjan",               area:"Al Furjan",      avgPpsf:1350, grossYield:7.2, tier:"mid"},
  {id:"discovery-gardens",     name:"Discovery Gardens",       area:"Discovery Gardens",avgPpsf:950, grossYield:8.5, tier:"mid"},
  {id:"international-city",    name:"International City",      area:"International City",avgPpsf:900, grossYield:9.2, tier:"mid"},
  {id:"dubai-silicon-oasis",   name:"Dubai Silicon Oasis",     area:"Silicon Oasis",  avgPpsf:1100, grossYield:7.6, tier:"mid"},
  {id:"dubai-sports-city",     name:"Dubai Sports City",       area:"Sports City",    avgPpsf:1350, grossYield:7.2, tier:"mid"},
  {id:"motor-city",            name:"Motor City",              area:"Motor City",     avgPpsf:1600, grossYield:6.8, tier:"mid"},
  {id:"town-square",           name:"Town Square",             area:"Dubailand",      avgPpsf:1100, grossYield:7.5, tier:"mid"},
  {id:"dubailand",             name:"Dubailand",               area:"Dubailand",      avgPpsf:1200, grossYield:7.0, tier:"mid"},
  {id:"dubai-production-city", name:"Dubai Production City",   area:"Production City",avgPpsf:1200, grossYield:7.5, tier:"mid"},
  {id:"mirdif",                name:"Mirdif",                  area:"Mirdif",         avgPpsf:1100, grossYield:7.0, tier:"mid"},
  {id:"bur-dubai",             name:"Bur Dubai",               area:"Bur Dubai",      avgPpsf:1500, grossYield:6.5, tier:"mid"},
  {id:"deira",                 name:"Deira",                   area:"Deira",          avgPpsf:1200, grossYield:7.0, tier:"mid"},
  {id:"al-karama",             name:"Al Karama",               area:"Bur Dubai",      avgPpsf:1100, grossYield:7.5, tier:"mid"},
  {id:"ras-al-khor",           name:"Ras Al Khor",             area:"Ras Al Khor",    avgPpsf:1400, grossYield:6.5, tier:"mid"},
  {id:"mudon",                 name:"Mudon",                   area:"Dubailand",      avgPpsf:1400, grossYield:6.5, tier:"mid"},
  {id:"villanova",             name:"Villanova",               area:"Dubailand",      avgPpsf:1200, grossYield:6.8, tier:"mid"},

  // Emerging / Affordable
  {id:"emaar-south",           name:"Emaar South",             area:"Dubai South",    avgPpsf:1100, grossYield:7.5, tier:"emerging"},
  {id:"dubai-south",           name:"Dubai South",             area:"Dubai South",    avgPpsf:1050, grossYield:7.8, tier:"emerging"},
  {id:"palm-deira",            name:"Palm Deira",              area:"Deira",          avgPpsf:2200, grossYield:6.0, tier:"emerging"},
  {id:"damac-hills",           name:"DAMAC Hills",             area:"Dubailand",      avgPpsf:1600, grossYield:6.5, tier:"emerging"},
  {id:"damac-hills-2",         name:"DAMAC Hills 2",           area:"Dubailand",      avgPpsf:900,  grossYield:7.5, tier:"emerging"},
  {id:"arabian-ranches",       name:"Arabian Ranches",         area:"Dubailand",      avgPpsf:1700, grossYield:5.2, tier:"emerging"},
  {id:"arabian-ranches-3",     name:"Arabian Ranches 3",       area:"Dubailand",      avgPpsf:1600, grossYield:5.5, tier:"emerging"},
  {id:"the-valley",            name:"The Valley",              area:"Dubai-Al Ain Rd",avgPpsf:1300, grossYield:6.0, tier:"emerging"},
  {id:"the-oasis",             name:"The Oasis",               area:"Dubailand",      avgPpsf:2500, grossYield:5.5, tier:"emerging"},
  {id:"jebel-ali",             name:"Jebel Ali",               area:"Jebel Ali",      avgPpsf:1400, grossYield:6.8, tier:"emerging"},
  {id:"dubai-investment-park", name:"Dubai Investment Park",   area:"DIP",            avgPpsf:1050, grossYield:7.2, tier:"emerging"},
  {id:"dubai-maritime-city",   name:"Dubai Maritime City",     area:"Maritime",       avgPpsf:2200, grossYield:5.8, tier:"emerging"},
  {id:"the-world-islands",     name:"The World Islands",       area:"The World",      avgPpsf:4000, grossYield:4.5, tier:"emerging"},
  {id:"expo-city-dubai",       name:"Expo City Dubai",         area:"Dubai South",    avgPpsf:1400, grossYield:7.0, tier:"emerging"},
  {id:"sobha-reserve",         name:"Sobha Reserve",           area:"Dubailand",      avgPpsf:2200, grossYield:5.5, tier:"emerging"},
  {id:"nad-al-sheba",          name:"Nad Al Sheba",            area:"Nad Al Sheba",   avgPpsf:2000, grossYield:5.8, tier:"emerging"},
];

async function run() {
  // Save developers to a separate collection
  const devBatch = db.batch();
  DEVELOPERS.forEach(d=>{
    const ref = db.collection("developers").doc(d.id);
    devBatch.set(ref, {
      ...d,
      updatedAt: new Date().toISOString(),
    });
  });
  await devBatch.commit();
  console.log("Developers seeded:", DEVELOPERS.length);

  // Save communities lookup to a separate collection  
  const commBatch = db.batch();
  COMMUNITIES.forEach(c=>{
    const ref = db.collection("communityLookup").doc(c.id);
    commBatch.set(ref, {
      ...c,
      updatedAt: new Date().toISOString(),
    });
  });
  await commBatch.commit();
  console.log("Communities seeded:", COMMUNITIES.length);

  // Show summary
  console.log("\n=== DEVELOPERS BY TIER ===");
  const t1 = DEVELOPERS.filter(d=>d.tier===1);
  const t2 = DEVELOPERS.filter(d=>d.tier===2);
  const t3 = DEVELOPERS.filter(d=>d.tier===3);
  console.log("Tier 1 (Government/Major):", t1.length, t1.map(d=>d.name).join(", "));
  console.log("Tier 2 (Major Private):", t2.length, t2.map(d=>d.name).join(", "));
  console.log("Tier 3 (Growing):", t3.length, t3.map(d=>d.name).join(", "));

  console.log("\n=== COMMUNITIES BY TIER ===");
  ["premium","upper-mid","mid","emerging"].forEach(t=>{
    const comms = COMMUNITIES.filter(c=>c.tier===t);
    console.log(t.padEnd(12), comms.length, comms.map(c=>c.name).join(", ").substring(0,80));
  });

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});