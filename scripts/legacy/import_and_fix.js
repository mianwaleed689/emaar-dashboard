/**
 * DXB ANALYTICS — MASTER IMPORT & FIX PIPELINE
 * 
 * Runs everything in order:
 * 1. Import all xlsx files from sheets_data folder
 * 2. Fix phones
 * 3. Fix nationalities
 * 4. Tag duplicates & unreachable (fix_leads_master)
 * 5. Deduplicate (remove exact copies)
 * 
 * Run: node import_and_fix.js
 */

const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ── NATIONALITY MAP ──────────────────────────────────────────────────────────
const NAT_MAP = {
  "united arab emirates": "🇦🇪 Emirati", "emirati": "🇦🇪 Emirati", "uae": "🇦🇪 Emirati",
  "saudia": "🇸🇦 Saudi Arabian", "saudi": "🇸🇦 Saudi Arabian", "saudi arabia": "🇸🇦 Saudi Arabian", "saudi arabian": "🇸🇦 Saudi Arabian", "ksa": "🇸🇦 Saudi Arabian",
  "india": "🇮🇳 Indian", "indian": "🇮🇳 Indian",
  "pakistan": "🇵🇰 Pakistani", "pakistani": "🇵🇰 Pakistani",
  "united kingdom": "🇬🇧 British", "british": "🇬🇧 British", "uk": "🇬🇧 British", "england": "🇬🇧 British",
  "canada": "🇨🇦 Canadian", "canadian": "🇨🇦 Canadian",
  "egypt": "🇪🇬 Egyptian", "egyptian": "🇪🇬 Egyptian",
  "jordan": "🇯🇴 Jordanian", "jordanian": "🇯🇴 Jordanian",
  "syria": "🇸🇾 Syrian", "syrian": "🇸🇾 Syrian",
  "lebanon": "🇱🇧 Lebanese", "lebanese": "🇱🇧 Lebanese",
  "iraq": "🇮🇶 Iraqi", "iraqi": "🇮🇶 Iraqi",
  "kuwait": "🇰🇼 Kuwaiti", "kuwaiti": "🇰🇼 Kuwaiti",
  "oman": "🇴🇲 Omani", "omani": "🇴🇲 Omani",
  "qatar": "🇶🇦 Qatari", "qatari": "🇶🇦 Qatari",
  "bahrain": "🇧🇭 Bahraini", "bahraini": "🇧🇭 Bahraini",
  "russia": "🇷🇺 Russian", "russian": "🇷🇺 Russian",
  "china": "🇨🇳 Chinese", "chinese": "🇨🇳 Chinese",
  "germany": "🇩🇪 German", "german": "🇩🇪 German",
  "france": "🇫🇷 French", "french": "🇫🇷 French",
  "usa": "🇺🇸 American", "united states": "🇺🇸 American", "american": "🇺🇸 American", "america": "🇺🇸 American",
  "australia": "🇦🇺 Australian", "australian": "🇦🇺 Australian",
  "nigeria": "🇳🇬 Nigerian", "nigerian": "🇳🇬 Nigerian",
  "philippines": "🇵🇭 Filipino", "filipino": "🇵🇭 Filipino",
  "bangladesh": "🇧🇩 Bangladeshi", "bangladeshi": "🇧🇩 Bangladeshi",
  "sri lanka": "🇱🇰 Sri Lankan", "sri lankan": "🇱🇰 Sri Lankan",
  "nepal": "🇳🇵 Nepalese", "nepalese": "🇳🇵 Nepalese", "nepali": "🇳🇵 Nepalese",
  "iran": "🇮🇷 Iranian", "iranian": "🇮🇷 Iranian",
  "turkey": "🇹🇷 Turkish", "turkish": "🇹🇷 Turkish",
  "morocco": "🇲🇦 Moroccan", "moroccan": "🇲🇦 Moroccan",
  "south africa": "🇿🇦 South African", "south african": "🇿🇦 South African",
  "kenya": "🇰🇪 Kenyan", "kenyan": "🇰🇪 Kenyan",
  "ethiopia": "🇪🇹 Ethiopian", "ethiopian": "🇪🇹 Ethiopian",
  "ghana": "🇬🇭 Ghanaian", "ghanaian": "🇬🇭 Ghanaian",
  "ukraine": "🇺🇦 Ukrainian", "ukrainian": "🇺🇦 Ukrainian",
  "uzbekistan": "🇺🇿 Uzbek", "uzbek": "🇺🇿 Uzbek",
  "kazakhstan": "🇰🇿 Kazakhstani", "kazakhstani": "🇰🇿 Kazakhstani",
  "singapore": "🇸🇬 Singaporean", "singaporean": "🇸🇬 Singaporean",
  "malaysia": "🇲🇾 Malaysian", "malaysian": "🇲🇾 Malaysian",
  "indonesia": "🇮🇩 Indonesian", "indonesian": "🇮🇩 Indonesian",
  "italy": "🇮🇹 Italian", "italian": "🇮🇹 Italian",
  "spain": "🇪🇸 Spanish", "spanish": "🇪🇸 Spanish",
  "netherlands": "🇳🇱 Dutch", "dutch": "🇳🇱 Dutch", "holland": "🇳🇱 Dutch",
  "sweden": "🇸🇪 Swedish", "swedish": "🇸🇪 Swedish",
  "norway": "🇳🇴 Norwegian", "norwegian": "🇳🇴 Norwegian",
  "denmark": "🇩🇰 Danish", "danish": "🇩🇰 Danish",
  "switzerland": "🇨🇭 Swiss", "swiss": "🇨🇭 Swiss",
  "poland": "🇵🇱 Polish", "polish": "🇵🇱 Polish",
  "romania": "🇷🇴 Romanian", "romanian": "🇷🇴 Romanian",
  "greece": "🇬🇷 Greek", "greek": "🇬🇷 Greek",
  "portugal": "🇵🇹 Portuguese", "portuguese": "🇵🇹 Portuguese",
  "belgium": "🇧🇪 Belgian", "belgian": "🇧🇪 Belgian",
  "israel": "🇮🇱 Israeli", "israeli": "🇮🇱 Israeli",
  "japan": "🇯🇵 Japanese", "japanese": "🇯🇵 Japanese",
  "south korea": "🇰🇷 Korean", "korean": "🇰🇷 Korean",
  "brazil": "🇧🇷 Brazilian", "brazilian": "🇧🇷 Brazilian",
  "argentina": "🇦🇷 Argentine", "argentine": "🇦🇷 Argentine", "argentinian": "🇦🇷 Argentine",
  "mexico": "🇲🇽 Mexican", "mexican": "🇲🇽 Mexican",
  "somalia": "🇸🇴 Somali", "somali": "🇸🇴 Somali",
  "sudan": "🇸🇩 Sudanese", "sudanese": "🇸🇩 Sudanese",
  "yemen": "🇾🇪 Yemeni", "yemeni": "🇾🇪 Yemeni",
  "libya": "🇱🇾 Libyan", "libyan": "🇱🇾 Libyan",
  "tunisia": "🇹🇳 Tunisian", "tunisian": "🇹🇳 Tunisian",
  "algeria": "🇩🇿 Algerian", "algerian": "🇩🇿 Algerian",
  "afghanistan": "🇦🇫 Afghan", "afghan": "🇦🇫 Afghan", "afghani": "🇦🇫 Afghan",
  "myanmar": "🇲🇲 Burmese", "burmese": "🇲🇲 Burmese",
  "vietnam": "🇻🇳 Vietnamese", "vietnamese": "🇻🇳 Vietnamese",
  "thailand": "🇹🇭 Thai", "thai": "🇹🇭 Thai",
  "albania": "🇦🇱 Albanian", "albanian": "🇦🇱 Albanian",
  "armenia": "🇦🇲 Armenian", "armenian": "🇦🇲 Armenian",
  "azerbaijan": "🇦🇿 Azerbaijani", "azerbaijani": "🇦🇿 Azerbaijani",
  "bosnia": "🇧🇦 Bosnian", "bosnian": "🇧🇦 Bosnian", "bossnian": "🇧🇦 Bosnian",
  "bulgaria": "🇧🇬 Bulgarian", "bulgarian": "🇧🇬 Bulgarian",
  "croatia": "🇭🇷 Croatian", "croatian": "🇭🇷 Croatian",
  "cyprus": "🇨🇾 Cypriot", "cypriot": "🇨🇾 Cypriot",
  "colombia": "🇨🇴 Colombian", "colombian": "🇨🇴 Colombian",
  "american samoa": "🇺🇸 American",
  "islands": "", "none": "", "nan": "", "null": "", "unknown": "", "n/a": "", "-": "", ".": "", ".i": "",
};

// ── COUNTRY CODES FOR PHONE NORMALIZATION ────────────────────────────────────
const COUNTRY_CODES = [
  "421","420","389","387","386","385","382","381","380","376","375","374",
  "373","372","371","370","359","358","357","356","355","354","353","352",
  "351","350","299","298","297","996","995","994","993","992","977","976",
  "975","974","973","972","971","970","968","967","966","965","964","963",
  "962","961","960","886","880","856","855","853","852","850","509","508",
  "507","506","505","504","503","502","501","500","423",
  "98","95","94","93","92","91","90","86","84","82","81",
  "66","65","64","63","62","61","60","55","54","53","52",
  "51","49","48","47","46","45","44","43","41","40","39",
  "36","34","33","32","31","30","27","20","7","1",
];

function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return { phone: "", flag: "no_phone" };
  let p = raw.toString().trim().replace(/[\s\-\.\(\)\/\\]/g, "");
  if (!p || p.length < 2) return { phone: "", flag: "no_phone" };
  if (p.startsWith("+")) {
    const clean = "+" + p.slice(1).replace(/\D/g, "");
    const len = clean.slice(1).length;
    if (len > 15) return { phone: clean, flag: "phone_too_long" };
    return { phone: clean, flag: "ok" };
  }
  if (p.startsWith("00")) return { phone: "+" + p.slice(2).replace(/\D/g, ""), flag: "ok" };
  const digits = p.replace(/\D/g, "");
  if (/^05[0-9]{8}$/.test(digits)) return { phone: "+971" + digits.slice(1), flag: "ok" };
  if (/^5[0-9]{8}$/.test(digits)) return { phone: "+971" + digits, flag: "ok" };
  if (digits.startsWith("971") && digits.length >= 11) return { phone: "+" + digits, flag: "ok" };
  if (/^04[0-9]{7}$/.test(digits)) return { phone: "+971" + digits.slice(1), flag: "ok" };
  for (const cc of COUNTRY_CODES) {
    if (digits.startsWith(cc) && digits.length >= cc.length + 6) {
      return { phone: "+" + digits, flag: "ok" };
    }
  }
  if (digits.length >= 10) return { phone: "+" + digits, flag: "ok" };
  if (digits.length >= 7) return { phone: "+971" + digits, flag: "ok" };
  return { phone: digits, flag: "phone_short" };
}

function scoreCompleteness(lead) {
  let score = 0;
  if (lead.name && lead.name.trim()) score++;
  if (lead.email && lead.email.includes('@')) score++;
  if (lead.phone && lead.phone.length > 6) score++;
  if (lead.community && lead.community.trim()) score++;
  if (lead.nationality && lead.nationality.trim()) score++;
  if (lead.project && lead.project.trim()) score++;
  if (lead.budget && lead.budget.trim()) score++;
  return score;
}

function getAllXlsx(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getAllXlsx(full));
    } else if (f.endsWith('.xlsx') && !f.startsWith('~')) {
      files.push(full);
    }
  });
  return files;
}

function extractCommunity(filePath) {
  const parts = filePath.split(path.sep);
  return parts[parts.length - 2] || '';
}

function normalizeLead(row, community) {
  const name = String(row['Name'] || row['name'] || row['CLIENT NAME'] || row['Client Name'] || row['OWNER'] || row['Owner'] || '').trim();
  const email = String(row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || '').trim().toLowerCase();
  const phone = String(row['Phone'] || row['phone'] || row['PHONE'] || row['Mobile'] || row['mobile'] || row['MOBILE'] || row['Contact'] || '').trim();
  const project = String(row['Project'] || row['project'] || row['PROJECT'] || row['PROJECT NAME'] || '').trim();
  const nationality = String(row['Nationality'] || row['nationality'] || row['NATIONALITY'] || '').trim();
  const budget = String(row['Budget'] || row['budget'] || row['BUDGET'] || '').trim();
  if (!name && !phone && !email) return null;
  const natKey = nationality.toLowerCase();
  const normalizedNat = NAT_MAP.hasOwnProperty(natKey) ? NAT_MAP[natKey] : nationality;
  const { phone: normalizedPhone, flag: phoneFlag } = normalizePhone(phone);
  const tags = [];
  if (phoneFlag === 'phone_short') tags.push('phone_short');
  if (phoneFlag === 'phone_too_long') tags.push('phone_short');
  return {
    name, email,
    phone: normalizedPhone || phone,
    project: (project === 'nan' || project === 'NaN' || project === 'null') ? '' : project,
    community, nationality: normalizedNat, budget,
    status: 'New', source: 'DLD Sheets 2022',
    createdAt: new Date().toISOString(),
    tags, followUpDate: '', propertyType: '', language: '',
    bedrooms: '', planType: '', developer: '', paymentType: '',
    visaEligibility: '', notes: '',
  };
}

// ── STEP 1: IMPORT ───────────────────────────────────────────────────────────
async function importSheets(sheetsDir) {
  console.log('\n📁 STEP 1: Importing xlsx files...');
  const files = getAllXlsx(sheetsDir);
  console.log(`Found ${files.length} files`);
  let total = 0;
  for (const file of files) {
    try {
      const wb = XLSX.readFile(file);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const community = extractCommunity(file);
      const leads = rows.map(r => normalizeLead(r, community)).filter(Boolean);
      if (leads.length === 0) continue;
      const batchSize = 500;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = db.batch();
        leads.slice(i, i + batchSize).forEach(lead => {
          batch.set(db.collection('leads').doc(), lead);
        });
        await batch.commit();
        total += Math.min(batchSize, leads.length - i);
      }
      console.log(`✓ ${path.basename(file)} — ${leads.length} leads | Total: ${total}`);
    } catch(e) {
      console.log(`✗ Skipped: ${path.basename(file)} — ${e.message}`);
    }
  }
  console.log(`\n✅ Import done! Total imported: ${total}`);
  return total;
}

// ── STEP 2: FIX PHONES ───────────────────────────────────────────────────────
async function fixPhones() {
  console.log('\n📞 STEP 2: Fixing phones...');
  let lastDoc = null;
  let total = 0;
  let updated = 0;
  while (true) {
    let q = db.collection('leads').limit(500);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    lastDoc = snap.docs[snap.docs.length - 1];
    total += snap.size;
    const toUpdate = [];
    snap.forEach(docSnap => {
      const raw = docSnap.data().phone;
      if (!raw) return;
      const { phone: fixed, flag } = normalizePhone(raw.toString());
      if (fixed && fixed !== raw.toString().trim()) {
        toUpdate.push({ id: docSnap.id, phone: fixed });
      }
    });
    if (toUpdate.length > 0) {
      const batch = db.batch();
      toUpdate.forEach(({ id, phone }) => {
        batch.update(db.collection('leads').doc(id), { phone });
      });
      await batch.commit();
      updated += toUpdate.length;
    }
    process.stdout.write(`\r   Processed: ${total.toLocaleString()} | Fixed: ${updated.toLocaleString()}`);
    if (snap.size < 500) break;
  }
  console.log(`\n✅ Phones fixed: ${updated}`);
}

// ── STEP 3: FIX NATIONALITIES ────────────────────────────────────────────────
async function fixNationalities() {
  console.log('\n🌍 STEP 3: Fixing nationalities...');
  let lastDoc = null;
  let total = 0;
  let updated = 0;
  while (true) {
    let q = db.collection('leads').limit(500);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    lastDoc = snap.docs[snap.docs.length - 1];
    total += snap.size;
    const toUpdate = [];
    snap.forEach(docSnap => {
      const raw = (docSnap.data().nationality || '').trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (NAT_MAP.hasOwnProperty(key)) {
        const newVal = NAT_MAP[key];
        if (newVal !== raw) toUpdate.push({ id: docSnap.id, nationality: newVal });
      }
    });
    if (toUpdate.length > 0) {
      const batch = db.batch();
      toUpdate.forEach(({ id, nationality }) => {
        batch.update(db.collection('leads').doc(id), { nationality });
      });
      await batch.commit();
      updated += toUpdate.length;
    }
    process.stdout.write(`\r   Processed: ${total.toLocaleString()} | Fixed: ${updated.toLocaleString()}`);
    if (snap.size < 500) break;
  }
  console.log(`\n✅ Nationalities fixed: ${updated}`);
}

// ── STEP 4: DEDUPLICATE ──────────────────────────────────────────────────────
async function deduplicate() {
  console.log('\n🔍 STEP 4: Removing exact duplicates...');
  let lastDoc = null;
  const seen = {};
  const toDelete = [];
  let total = 0;
  while (true) {
    let q = db.collection('leads').limit(500);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    lastDoc = snap.docs[snap.docs.length - 1];
    total += snap.size;
    snap.forEach(doc => {
      const d = doc.data();
      const phone = (d.phone || '').trim();
      const community = (d.community || '').trim().toLowerCase();
      const project = (d.project || '').trim().toLowerCase();
      if (!phone || phone.length < 6) return;
      const key = `${phone}__${community}__${project}`;
      if (seen[key]) {
        toDelete.push(doc.id);
      } else {
        seen[key] = true;
      }
    });
    process.stdout.write(`\r   Scanned: ${total.toLocaleString()} | Duplicates found: ${toDelete.length.toLocaleString()}`);
    if (snap.size < 500) break;
  }
  console.log(`\n   Deleting ${toDelete.length} duplicates...`);
  const batchSize = 400;
  let done = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = db.batch();
    toDelete.slice(i, i + batchSize).forEach(id => {
      batch.delete(db.collection('leads').doc(id));
    });
    await batch.commit();
    done += Math.min(batchSize, toDelete.length - i);
    process.stdout.write(`\r   Deleted: ${done}/${toDelete.length}`);
  }
  console.log(`\n✅ Duplicates removed: ${toDelete.length}`);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const sheetsDir = process.argv[2] || 'C:\\Users\\TAD\\emaar-dashboard\\sheets_data';
  
  console.log('🚀 DXB ANALYTICS — MASTER IMPORT & FIX PIPELINE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📂 Sheets folder: ${sheetsDir}`);

  await importSheets(sheetsDir);
  await fixPhones();
  await fixNationalities();
  await deduplicate();

  console.log('\n\n🎉 ALL DONE! Your leads are clean and ready.');
  const count = await db.collection('leads').count().get();
  console.log(`📊 Total leads in Firestore: ${count.data().count.toLocaleString()}`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
