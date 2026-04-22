/**
 * DXB ANALYTICS — NATIONALITY NORMALIZER v2
 * Processes in batches to avoid memory issues with 232k leads
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const NAT_MAP = {
  // UAE
  "united arab emirates": "🇦🇪 Emirati", "emirati": "🇦🇪 Emirati", "uae": "🇦🇪 Emirati", "arab emirates": "🇦🇪 Emirati",
  // Saudi
  "saudia": "🇸🇦 Saudi Arabian", "saudi": "🇸🇦 Saudi Arabian", "saudi arabia": "🇸🇦 Saudi Arabian", "saudi arabian": "🇸🇦 Saudi Arabian", "ksa": "🇸🇦 Saudi Arabian",
  // India
  "india": "🇮🇳 Indian", "indian": "🇮🇳 Indian",
  // Pakistan
  "pakistan": "🇵🇰 Pakistani", "pakistani": "🇵🇰 Pakistani",
  // UK
  "united kingdom": "🇬🇧 British", "british": "🇬🇧 British", "uk": "🇬🇧 British", "england": "🇬🇧 British", "great britain": "🇬🇧 British",
  // Canada
  "canada": "🇨🇦 Canadian", "canadian": "🇨🇦 Canadian",
  // Egypt
  "egypt": "🇪🇬 Egyptian", "egyptian": "🇪🇬 Egyptian",
  // Jordan
  "jordan": "🇯🇴 Jordanian", "jordanian": "🇯🇴 Jordanian",
  // Syria
  "syria": "🇸🇾 Syrian", "syrian": "🇸🇾 Syrian",
  // Lebanon
  "lebanon": "🇱🇧 Lebanese", "lebanese": "🇱🇧 Lebanese",
  // Iraq
  "iraq": "🇮🇶 Iraqi", "iraqi": "🇮🇶 Iraqi",
  // Kuwait
  "kuwait": "🇰🇼 Kuwaiti", "kuwaiti": "🇰🇼 Kuwaiti",
  // Oman
  "oman": "🇴🇲 Omani", "omani": "🇴🇲 Omani",
  // Qatar
  "qatar": "🇶🇦 Qatari", "qatari": "🇶🇦 Qatari",
  // Bahrain
  "bahrain": "🇧🇭 Bahraini", "bahraini": "🇧🇭 Bahraini",
  // Russia
  "russia": "🇷🇺 Russian", "russian": "🇷🇺 Russian",
  // China
  "china": "🇨🇳 Chinese", "chinese": "🇨🇳 Chinese",
  // Germany
  "germany": "🇩🇪 German", "german": "🇩🇪 German",
  // France
  "france": "🇫🇷 French", "french": "🇫🇷 French",
  // USA
  "usa": "🇺🇸 American", "united states": "🇺🇸 American", "american": "🇺🇸 American", "us": "🇺🇸 American", "america": "🇺🇸 American", "u.s.a": "🇺🇸 American", "u.s": "🇺🇸 American",
  // Australia
  "australia": "🇦🇺 Australian", "australian": "🇦🇺 Australian",
  // Nigeria
  "nigeria": "🇳🇬 Nigerian", "nigerian": "🇳🇬 Nigerian",
  // Philippines
  "philippines": "🇵🇭 Filipino", "filipino": "🇵🇭 Filipino", "philippine": "🇵🇭 Filipino", "pilipino": "🇵🇭 Filipino",
  // Bangladesh
  "bangladesh": "🇧🇩 Bangladeshi", "bangladeshi": "🇧🇩 Bangladeshi",
  // Sri Lanka
  "sri lanka": "🇱🇰 Sri Lankan", "sri lankan": "🇱🇰 Sri Lankan",
  // Nepal
  "nepal": "🇳🇵 Nepalese", "nepalese": "🇳🇵 Nepalese", "nepali": "🇳🇵 Nepalese",
  // Iran
  "iran": "🇮🇷 Iranian", "iranian": "🇮🇷 Iranian",
  // Turkey
  "turkey": "🇹🇷 Turkish", "turkish": "🇹🇷 Turkish", "türkiye": "🇹🇷 Turkish",
  // Morocco
  "morocco": "🇲🇦 Moroccan", "moroccan": "🇲🇦 Moroccan",
  // South Africa
  "south africa": "🇿🇦 South African", "south african": "🇿🇦 South African",
  // Kenya
  "kenya": "🇰🇪 Kenyan", "kenyan": "🇰🇪 Kenyan",
  // Ethiopia
  "ethiopia": "🇪🇹 Ethiopian", "ethiopian": "🇪🇹 Ethiopian",
  // Ghana
  "ghana": "🇬🇭 Ghanaian", "ghanaian": "🇬🇭 Ghanaian",
  // Ukraine
  "ukraine": "🇺🇦 Ukrainian", "ukrainian": "🇺🇦 Ukrainian",
  // Uzbekistan
  "uzbekistan": "🇺🇿 Uzbek", "uzbek": "🇺🇿 Uzbek",
  // Kazakhstan
  "kazakhstan": "🇰🇿 Kazakhstani", "kazakhstani": "🇰🇿 Kazakhstani",
  // Singapore
  "singapore": "🇸🇬 Singaporean", "singaporean": "🇸🇬 Singaporean",
  // Malaysia
  "malaysia": "🇲🇾 Malaysian", "malaysian": "🇲🇾 Malaysian",
  // Indonesia
  "indonesia": "🇮🇩 Indonesian", "indonesian": "🇮🇩 Indonesian",
  // Italy
  "italy": "🇮🇹 Italian", "italian": "🇮🇹 Italian",
  // Spain
  "spain": "🇪🇸 Spanish", "spanish": "🇪🇸 Spanish",
  // Netherlands
  "netherlands": "🇳🇱 Dutch", "dutch": "🇳🇱 Dutch", "holland": "🇳🇱 Dutch",
  // Sweden
  "sweden": "🇸🇪 Swedish", "swedish": "🇸🇪 Swedish",
  // Norway
  "norway": "🇳🇴 Norwegian", "norwegian": "🇳🇴 Norwegian",
  // Denmark
  "denmark": "🇩🇰 Danish", "danish": "🇩🇰 Danish",
  // Switzerland
  "switzerland": "🇨🇭 Swiss", "swiss": "🇨🇭 Swiss",
  // Poland
  "poland": "🇵🇱 Polish", "polish": "🇵🇱 Polish",
  // Romania
  "romania": "🇷🇴 Romanian", "romanian": "🇷🇴 Romanian",
  // Greece
  "greece": "🇬🇷 Greek", "greek": "🇬🇷 Greek",
  // Portugal
  "portugal": "🇵🇹 Portuguese", "portuguese": "🇵🇹 Portuguese",
  // Belgium
  "belgium": "🇧🇪 Belgian", "belgian": "🇧🇪 Belgian",
  // Israel
  "israel": "🇮🇱 Israeli", "israeli": "🇮🇱 Israeli",
  // Japan
  "japan": "🇯🇵 Japanese", "japanese": "🇯🇵 Japanese",
  // South Korea
  "south korea": "🇰🇷 Korean", "korean": "🇰🇷 Korean",
  // Taiwan
  "taiwan": "🇹🇼 Taiwanese", "taiwanese": "🇹🇼 Taiwanese",
  // New Zealand
  "new zealand": "🇳🇿 New Zealander", "new zealander": "🇳🇿 New Zealander",
  // Brazil
  "brazil": "🇧🇷 Brazilian", "brazilian": "🇧🇷 Brazilian",
  // Argentina
  "argentina": "🇦🇷 Argentine", "argentine": "🇦🇷 Argentine", "argentinian": "🇦🇷 Argentine",
  // Mexico
  "mexico": "🇲🇽 Mexican", "mexican": "🇲🇽 Mexican",
  // Somalia
  "somalia": "🇸🇴 Somali", "somali": "🇸🇴 Somali",
  // Sudan
  "sudan": "🇸🇩 Sudanese", "sudanese": "🇸🇩 Sudanese",
  // Yemen
  "yemen": "🇾🇪 Yemeni", "yemeni": "🇾🇪 Yemeni",
  // Libya
  "libya": "🇱🇾 Libyan", "libyan": "🇱🇾 Libyan",
  // Tunisia
  "tunisia": "🇹🇳 Tunisian", "tunisian": "🇹🇳 Tunisian",
  // Algeria
  "algeria": "🇩🇿 Algerian", "algerian": "🇩🇿 Algerian",
  // Afghanistan
  "afghanistan": "🇦🇫 Afghan", "afghan": "🇦🇫 Afghan", "afghani": "🇦🇫 Afghan",
  // Myanmar
  "myanmar": "🇲🇲 Burmese", "burmese": "🇲🇲 Burmese",
  // Vietnam
  "vietnam": "🇻🇳 Vietnamese", "vietnamese": "🇻🇳 Vietnamese",
  // Thailand
  "thailand": "🇹🇭 Thai", "thai": "🇹🇭 Thai",
  // Cambodia
  "cambodia": "🇰🇭 Cambodian", "cambodian": "🇰🇭 Cambodian",
  // Colombia
  "colombia": "🇨🇴 Colombian", "colombian": "🇨🇴 Colombian", "colommbian": "🇨🇴 Colombian",
  // Albania
  "albania": "🇦🇱 Albanian", "albanian": "🇦🇱 Albanian",
  // Armenia
  "armenia": "🇦🇲 Armenian", "armenian": "🇦🇲 Armenian",
  // Azerbaijan
  "azerbaijan": "🇦🇿 Azerbaijani", "azerbaijani": "🇦🇿 Azerbaijani",
  // Bosnia
  "bosnia": "🇧🇦 Bosnian", "bosnian": "🇧🇦 Bosnian", "bossnian": "🇧🇦 Bosnian",
  // Bulgaria
  "bulgaria": "🇧🇬 Bulgarian", "bulgarian": "🇧🇬 Bulgarian",
  // Croatia
  "croatia": "🇭🇷 Croatian", "croatian": "🇭🇷 Croatian",
  // Cyprus
  "cyprus": "🇨🇾 Cypriot", "cypriot": "🇨🇾 Cypriot",
  // Czech Republic
  "czech republic": "🇨🇿 Czech", "czech": "🇨🇿 Czech",
  // Finland
  "finland": "🇫🇮 Finnish", "finnish": "🇫🇮 Finnish",
  // Hungary
  "hungary": "🇭🇺 Hungarian", "hungarian": "🇭🇺 Hungarian",
  // Ireland
  "ireland": "🇮🇪 Irish", "irish": "🇮🇪 Irish",
  // Lithuania
  "lithuania": "🇱🇹 Lithuanian", "lithuanian": "🇱🇹 Lithuanian",
  // Serbia
  "serbia": "🇷🇸 Serbian", "serbian": "🇷🇸 Serbian",
  // Slovakia
  "slovakia": "🇸🇰 Slovak", "slovak": "🇸🇰 Slovak",
  // Slovenia
  "slovenia": "🇸🇮 Slovenian", "slovenian": "🇸🇮 Slovenian",
  // Eritrea
  "eritrea": "🇪🇷 Eritrean", "eritrean": "🇪🇷 Eritrean",
  // American Samoa / other territories
  "american samoa": "🇺🇸 American",
  "puerto rico": "🇺🇸 American",
  // Invalid/clear
  "islands": "", "none": "", "nan": "", "null": "", "unknown": "", "n/a": "", "-": "", ".": "", "other": "",
};

async function fixNationalities() {
  console.log("🌍 DXB Analytics — Nationality Normalizer v2");
  console.log("Processing in batches to avoid memory issues...\n");

  let lastDoc = null;
  let total = 0;
  let updated = 0;
  const BATCH_SIZE = 200;
  const QUERY_SIZE = 500;

  while (true) {
    let q = db.collection("leads").limit(QUERY_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);
    
    const snap = await q.get();
    if (snap.empty) break;
    
    lastDoc = snap.docs[snap.docs.length - 1];
    total += snap.size;

    const toUpdate = [];
    snap.forEach(docSnap => {
      const raw = (docSnap.data().nationality || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (NAT_MAP.hasOwnProperty(key)) {
        const newVal = NAT_MAP[key];
        if (newVal !== raw) toUpdate.push({ id: docSnap.id, nationality: newVal });
      }
    });

    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = db.batch();
      toUpdate.slice(i, i + BATCH_SIZE).forEach(({ id, nationality }) => {
        batch.update(db.collection("leads").doc(id), { nationality });
      });
      await batch.commit();
      updated += Math.min(BATCH_SIZE, toUpdate.length - i);
    }

    process.stdout.write(`\rProcessed: ${total.toLocaleString()} | Updated: ${updated.toLocaleString()}`);
    
    if (snap.size < QUERY_SIZE) break;
  }

  console.log(`\n\n✅ DONE! Processed: ${total} | Updated: ${updated}`);
  process.exit(0);
}

fixNationalities().catch(err => { console.error("❌ Error:", err.message); process.exit(1); });
