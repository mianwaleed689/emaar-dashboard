const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Official Dubai 9 sectors (RTA / Dubai Statistics Center)
const OFFICIAL_SECTORS = [
  'Bur Dubai', 'Deira', 'New Dubai', 'Dubai South', 'Dubailand',
  'Hatta', 'Jebel Ali', 'MBR City', 'Trade Center'
];

// Cadastral codes that have been classified as Tier D
// We'll fetch this dynamically from Firestore

// Known consumer/master community names (canonical IDs)
// We'll fetch this too

// Manual mapping for known transformations
const AREA_FIX_MAP = {
  // Cadastral (move to cadastralCode field)
  'Wadi Al Safa 7': { type: 'cadastral', cadastralId: 'wadi-al-safa-7', area: 'Dubailand' },
  'Wadi Al Safa 5': { type: 'cadastral', cadastralId: 'wadi-al-safa-5', area: 'Dubailand' },
  'Wadi Al Safa 3': { type: 'cadastral', cadastralId: 'wadi-al-safa-3', area: 'Dubailand' },
  'Wadi Al Safa 2': { type: 'cadastral', cadastralId: 'wadi-al-safa-2', area: 'Dubailand' },
  'Wadi Al Safa 4': { type: 'cadastral', cadastralId: 'wadi-al-safa-4', area: 'Dubailand' },
  'Al Hebiah First': { type: 'cadastral', cadastralId: 'al-hebiah-first', area: 'Dubailand' },
  'Al Hebiah Second': { type: 'cadastral', cadastralId: 'al-hebiah-second', area: 'Dubailand' },
  'Al Hebiah Fourth': { type: 'cadastral', cadastralId: 'al-hebiah-fourth', area: 'Dubailand' },
  'Al Hebiah Sixth': { type: 'cadastral', cadastralId: 'al-hebiah-sixth', area: 'Dubailand' },
  'Al Thanyah First': { type: 'cadastral', cadastralId: 'al-thanyah-first', area: 'New Dubai' },
  'Al Thanyah Third': { type: 'cadastral', cadastralId: 'al-thanyah-third', area: 'New Dubai' },
  'Al Thanyah Fifth': { type: 'cadastral', cadastralId: 'al-thanyah-fifth', area: 'New Dubai' },
  'Al Thanayah Fourth': { type: 'cadastral', cadastralId: 'al-thanayah-fourth', area: 'New Dubai' },
  'Al Barshaa South Second': { type: 'cadastral', cadastralId: 'al-barsha-south-second', area: 'New Dubai' },
  'Al Barshaa South Third': { type: 'cadastral', cadastralId: 'al-barsha-south-third', area: 'New Dubai' },
  'Jabal Ali First': { type: 'cadastral', cadastralId: 'jabal-ali-first', area: 'Jebel Ali' },
  'Jabal Ali Industrial Second': { type: 'cadastral', cadastralId: 'jabal-ali-industrial-second', area: 'Jebel Ali' },
  'Hessyan First': { type: 'cadastral', cadastralId: 'hessyan-first', area: 'Jebel Ali' },
  'Zaabeel Second': { type: 'cadastral', cadastralId: 'zaabeel-second', area: 'Trade Center' },
  'Al Yelayiss 2': { type: 'cadastral', cadastralId: 'al-yelayiss-2', area: 'Dubailand' },
  'Al Merkadh': { type: 'cadastral', cadastralId: 'al-merkadh', area: 'MBR City' },
  'Madinat Dubai Almelaheyah': { type: 'cadastral', cadastralId: 'madinat-dubai-almelaheyah', area: 'Bur Dubai' },
  'Nad Al Shiba First': { type: 'cadastral', cadastralId: 'nad-al-shiba-first', area: 'MBR City' },
  'Marsa Dubai': { type: 'cadastral', cadastralId: 'marsa-dubai', area: 'Dubai Marina' },
  'Jumeirah First': { type: 'cadastral', cadastralId: 'jumeirah-first', area: 'New Dubai' },
  "Me'Aisem First": { type: 'cadastral', cadastralId: 'me-aisem-first', area: 'Dubailand' },
  'Al Hebiah Fifth': { type: 'cadastral', cadastralId: 'al-hebiah-fifth', area: 'Dubailand' },

  // Renames (sector standardization)
  'CBD': { type: 'rename', area: 'Trade Center' },
  'Suburban': { type: 'rename', area: null },  // meaningless, clear it
  'Waterfront': { type: 'rename', area: 'New Dubai' },
  'Marina': { type: 'rename', area: 'New Dubai' },
  'Downtown': { type: 'rename', area: 'Bur Dubai' },
  'Mirdif': { type: 'rename', area: 'Bur Dubai' },
  'Al Jadaf': { type: 'rename', area: 'Bur Dubai' },
  'Al Satwa': { type: 'rename', area: 'Bur Dubai' },
  'Al Kifaf': { type: 'rename', area: 'Bur Dubai' },
  'Dubai Harbour': { type: 'rename', area: 'New Dubai' },
  'Expo City': { type: 'rename', area: 'Dubai South' },
  'World Islands': { type: 'rename', area: 'New Dubai' },
  'Palm Deira': { type: 'rename', area: 'Deira' },
  'Palm Jabal Ali': { type: 'rename', area: 'Jebel Ali' },
  'Bur Dubai': { type: 'keep' },
  'Dubailand': { type: 'keep' },
  'New Dubai': { type: 'keep' },
  'Dubai South': { type: 'keep' },
  'MBR City': { type: 'keep' },

  // Broken values
  'Al Wasl / Jumeirah Second': { type: 'rename', area: 'New Dubai' },
};

(async () => {
  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const consumerOnly = docs.filter(d => d.displayCategory === 'consumer-community');

  console.log('Analysis of ' + consumerOnly.length + ' consumer communities:');
  console.log('');

  const unmapped = [];
  const stats = {
    cadastral: 0,
    renamed: 0,
    kept: 0,
    cleared: 0,
    empty: 0,
    notInMap: 0,
  };

  consumerOnly.forEach(d => {
    const area = (d.area || '').trim();
    if (!area) { stats.empty++; return; }
    const fix = AREA_FIX_MAP[area];
    if (!fix) {
      stats.notInMap++;
      unmapped.push({ id: d.id, name: d.name, area: area });
      return;
    }
    if (fix.type === 'cadastral') stats.cadastral++;
    else if (fix.type === 'rename' && fix.area === null) stats.cleared++;
    else if (fix.type === 'rename') stats.renamed++;
    else if (fix.type === 'keep') stats.kept++;
  });

  console.log('Migration plan:');
  console.log('  Already canonical (kept):     ' + stats.kept);
  console.log('  To rename to official sector: ' + stats.renamed);
  console.log('  To move to cadastralCode:     ' + stats.cadastral);
  console.log('  To clear (meaningless):       ' + stats.cleared);
  console.log('  Empty area (no change):       ' + stats.empty);
  console.log('  NOT IN MAP (need to add):     ' + stats.notInMap);
  console.log('');

  if (unmapped.length > 0) {
    console.log('Communities with unmapped area values:');
    unmapped.forEach(u => {
      console.log('  ' + u.id.padEnd(40) + ' area="' + u.area + '"');
    });
  } else {
    console.log('All area values are mapped. Ready to migrate.');
  }
  process.exit(0);
})();