const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

const C=[{"m": "Treppan Living Prive", "h": "Q4 2028", "pp": "40/60", "b": ["1BR", "2BR", "4BR"], "s": 1029, "p": 3243000, "u": 65, "comm": "Dubai Islands"}, {"m": "Zazen Acacia Residences", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 450, "p": 800000, "u": 48, "comm": "Emaar South"}, {"m": "Prestige Gardens By Prestige One", "h": "Q3 2028", "pp": "20/45/35", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 1200000, "u": 48, "comm": "Al Satwa"}, {"m": "Sanctuary By Prestige One", "h": "Q3 2027", "pp": "20/45/35", "b": ["1BR", "2BR", "3BR"], "s": 600, "p": 1800000, "comm": "Dubai Islands"}, {"m": "Golf Terrace Residences By Asak", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Jumeirah Golf Estates"}, {"m": "Zura Residences", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Expo City Dubai"}, {"m": "Marquis Horizon", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Expo City Dubai"}, {"m": "Bottega Nove By Lalav", "h": "Q4 2026", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 450, "p": 700000, "comm": "Dubailand"}, {"m": "Cedarwood Estates", "h": "Q4 2027", "pp": "60/40", "b": ["3BR", "4BR"], "s": 2000, "p": 2500000, "comm": "Jumeirah Golf Estates"}, {"m": "Linea By Holm", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 900000, "comm": "Al Satwa"}, {"m": "Blossom 40", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "The Tides By Amis", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1500000, "comm": "Dubai Islands"}, {"m": "Avenew888-Loom", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Expo City Dubai"}, {"m": "Nirvana Residences - I", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Jumeirah Golf Estates"}, {"m": "Hearth Heights By Enawt Real Estate Development", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Al Barsha South Fourth"}, {"m": "Tura Residence", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 600, "p": 900000, "comm": "Nad Al Sheba"}, {"m": "Sol Terra Casa I", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Al Barsha South Fourth"}, {"m": "Barari Parks By Bahat", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Villa Dell Arte", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 800, "p": 1800000, "comm": "Dubai Islands"}, {"m": "The Cape", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Terva Homes", "h": "Q4 2027", "pp": "60/40", "b": ["3BR", "4BR"], "s": 1800, "p": 2000000, "comm": "Dubai South"}, {"m": "Ahs Tower", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR", "3BR"], "s": 450, "p": 1200000, "comm": "DIFC"}, {"m": "Ayami Residence, By Ayat Development", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Warsan"}, {"m": "Zyra Hills", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 600, "p": 800000, "comm": "Warsan"}, {"m": "Rr Grand", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Expo City Dubai"}, {"m": "Amis & Gpd Presents Fleur De Jardin Villas", "h": "Q4 2027", "pp": "60/40", "b": ["3BR", "4BR", "5BR"], "s": 2500, "p": 3500000, "comm": "Dubailand"}, {"m": "Villa Del Garda Residences", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 800, "p": 1800000, "comm": "Dubai Islands"}, {"m": "Yigo26", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Warsan"}, {"m": "Cheval Residences", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1500000, "comm": "Dubai Islands"}, {"m": "The Wilds Residences", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Dubailand"}, {"m": "R Home Mh", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Bukadra"}, {"m": "Rabdan Gardens", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 900000, "comm": "Al Satwa"}, {"m": "Casa Altia", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 600, "p": 900000, "comm": "Jebel Ali"}, {"m": "09 Life Residences", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Noore", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Lunaya", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubai South"}, {"m": "Nejm 1", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Ajwan Residences", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Expo City Dubai"}, {"m": "Sorrento", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Dubai Sports City"}, {"m": "Hado By Beyond", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1500000, "comm": "Dubai Islands"}, {"m": "Art House Private Residences By Viva", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "At 85 Residences", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Jebel Ali"}, {"m": "Best Town Villas", "h": "Q4 2027", "pp": "60/40", "b": ["3BR", "4BR"], "s": 1800, "p": 2200000, "comm": "Al Barsha South Fifth"}, {"m": "Piazza Roma", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Dubai Sports City"}, {"m": "Longfor International Center", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR", "3BR"], "s": 450, "p": 700000, "comm": "Warsan"}, {"m": "Cybele By Wadan", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Babette Sapphire Residence", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 800000, "comm": "Al Jadaf"}, {"m": "Dar Al Aiham One", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Warsan"}, {"m": "South Lofts By Premier Choice", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubai South"}, {"m": "Myra Onyx", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Nad Al Hamar"}, {"m": "Serra Residence By Wujod", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Empire Gardens", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "Liora", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1500000, "comm": "Dubai Islands"}, {"m": "Rabdan Square", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Nad Al Sheba"}, {"m": "Enchante By Grid", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Al Barsha South"}, {"m": "Stories By Mirfa", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Expo City Dubai"}, {"m": "Coventry 49", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Expo City Dubai"}, {"m": "Hqa By Arista", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 700000, "comm": "Jebel Ali"}, {"m": "Art House Hills By Adaan And Tuscany", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Al Barsha South"}, {"m": "Bararigate By Ade", "h": "Q4 2026", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubailand"}, {"m": "The Meriva Collection", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1600000, "comm": "Dubai Islands"}, {"m": "Cetara", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Dubai Sports City"}, {"m": "Park Residency", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Warsan"}, {"m": "Kaia", "h": "Q4 2027", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1500000, "comm": "Dubai Islands"}, {"m": "Coventry Curve", "h": "Q4 2027", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "comm": "Dubai South"}, {"m": "Cresswell Plaza", "h": "Q4 2027", "pp": "60/40", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 650000, "comm": "Expo City Dubai"}];

// Auto-generate description from project fields
function genDesc(p){
  const name=p.name||"";
  const dev=p.developerActual||p.developer||"";
  const comm=p.masterProject||p.community||"";
  const beds=p.beds||[];
  const h=p.handoverDate||p.completionDate||"";
  const price=p.priceMin?`Starting from AED ${(p.priceMin/1000000).toFixed(1)}M`:"";
  const bedStr=beds.length>0?beds.join(", ")+" apartments":"residential units";
  
  const communityDesc={
    "Business Bay":"in the heart of Dubai's dynamic business and residential district, with stunning canal and city views",
    "Downtown Dubai":"minutes from the iconic Burj Khalifa and Dubai Mall, in the most prestigious address in the city",
    "Dubai Marina":"in the vibrant waterfront community with marina views and easy access to JBR Beach",
    "Jumeirah Village Circle":"in the family-friendly community of JVC, offering excellent connectivity and strong rental yields",
    "Palm Jumeirah":"on Dubai's iconic palm-shaped island, offering luxury waterfront living",
    "Dubai Hills Estate":"in Emaar's master-planned green community, surrounding an 18-hole championship golf course",
    "Al Furjan":"in the well-connected mid-market community with metro access and community facilities",
    "Dubai Islands":"on Dubai's new waterfront island destination, offering beach access and resort-style living",
    "Emaar South":"in the golf course community adjacent to Expo City Dubai and Al Maktoum International Airport",
    "The Oasis":"in Emaar's ultra-luxury villa community, surrounded by crystal lagoons and lush landscapes",
    "DAMAC Lagoons":"in DAMAC's Mediterranean-inspired community with lagoons, sandy beaches, and resort amenities",
    "Arabian Ranches III":"in Emaar's established villa community, designed for family living with parks and cycling tracks",
  }
  
  const locDesc=communityDesc[comm]||`in ${comm}, Dubai`;
  const handoverStr=h?` Handover ${h}.`:"";
  const priceStr=price?` ${price}.`:"";
  
  return `${name} by ${dev} is a residential development ${locDesc}. Offering ${bedStr} with contemporary design and premium finishes.${priceStr}${handoverStr} A compelling investment opportunity in one of Dubai's most sought-after locations.`;
}

async function main(){
  console.log("Loading all projects...");
  const snap=await db.collection("projects").get();
  const nameMap={};
  snap.docs.forEach(d=>{nameMap[(d.data().name||"").toLowerCase().trim()]=d;});
  
  let batch=db.batch(),bc=0,updated=0,descUpdated=0,notFound=0;
  const now=new Date().toISOString();
  
  // Step 1: Update remaining 66 projects with handover/price/beds
  console.log("\nStep 1: Updating remaining missing data...");
  for(const c of C){
    const doc=nameMap[c.m.toLowerCase().trim()];
    if(!doc){notFound++;continue;}
    const p=doc.data();
    const u={dataEnrichedAt:now,dataSource:"web-verified-2025"};
    if(c.h&&!p.handoverDate&&!p.completionDate){u.handoverDate=c.h;u.completionDate=c.h;}
    if(c.pp&&(!p.paymentPlan||p.paymentPlan==="20/60/20"||p.paymentPlan==="20/80")){u.paymentPlan=c.pp;}
    if(c.b&&c.b.length>0&&(!p.beds||p.beds.length===0)){u.beds=c.b;}
    if(c.s&&(!p.sizeMin||p.sizeMin<=0)){u.sizeMin=c.s;}
    if(c.p&&(!p.priceMin||p.priceMin<=0)){u.priceMin=c.p;}
    if(c.u&&(!p.totalUnits||p.totalUnits<=0)){u.totalUnits=c.u;}
    if(Object.keys(u).length>2){
      batch.update(doc.ref,u);bc++;updated++;
      console.log("OK",c.m);
      if(bc>=400){await batch.commit();batch=db.batch();bc=0;}
    }
  }
  
  // Step 2: Auto-generate descriptions for all projects missing them
  console.log("\nStep 2: Auto-generating descriptions...");
  snap.docs.forEach(d=>{
    const p=d.data();
    if(!p.description||p.description.length<20){
      const desc=genDesc(p);
      batch.update(d.ref,{description:desc,descriptionSource:"auto-generated",descriptionGeneratedAt:now});
      bc++;descUpdated++;
      if(bc>=400){batch.commit();batch=db.batch();bc=0;}
    }
  });
  
  if(bc>0)await batch.commit();
  console.log("\nDone!");
  console.log("Updated missing data:",updated,"Not found:",notFound);
  console.log("Descriptions generated:",descUpdated);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
