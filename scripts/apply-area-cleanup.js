const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const AREA_FIX_MAP = {
  // Cadastral (move to cadastralCode field, set area to parent sector)
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
  'Suburban': { type: 'rename', area: null },
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
  'Al Wasl / Jumeirah Second': { type: 'rename', area: 'New Dubai' },
};

const APPLY = process.argv.includes('--apply');

(async () => {
  console.log(APPLY ? '=== APPLYING AREA CLEANUP ===' : '=== DRY RUN (use --apply) ===');
  console.log('');

  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const consumerOnly = docs.filter(d => d.displayCategory === 'consumer-community');

  let cadastralMoves = 0;
  let renames = 0;
  let cleared = 0;
  let kept = 0;
  let unchanged = 0;

  for (const d of consumerOnly) {
    const area = (d.area || '').trim();
    if (!area) { unchanged++; continue; }

    const fix = AREA_FIX_MAP[area];
    if (!fix) { unchanged++; continue; }

    const update = {
      _areaSchemaCleanupAt: admin.firestore.FieldValue.serverTimestamp(),
      _areaSchemaCleanupVersion: 1,
      _areaSchemaPrevious: area,
    };

    if (fix.type === 'keep') { kept++; continue; }

    if (fix.type === 'cadastral') {
      update.cadastralCode = fix.cadastralId;
      update.area = fix.area;
      cadastralMoves++;
    } else if (fix.type === 'rename') {
      if (fix.area === null) {
        update.area = admin.firestore.FieldValue.delete();
        cleared++;
      } else {
        update.area = fix.area;
        renames++;
      }
    }

    if (APPLY) {
      await db.collection('communities').doc(d.id).update(update);
    } else {
      // Print preview
      console.log(d.id.padEnd(40) + ' area: "' + area + '"');
      if (fix.type === 'cadastral') {
        console.log('    -> cadastralCode: "' + fix.cadastralId + '", area: "' + fix.area + '"');
      } else if (fix.type === 'rename') {
        console.log('    -> area: "' + (fix.area || '(cleared)') + '"');
      }
    }
  }

  console.log('');
  console.log('Summary:');
  console.log('  Cadastral moves:  ' + cadastralMoves);
  console.log('  Renames:          ' + renames);
  console.log('  Cleared:          ' + cleared);
  console.log('  Already canonical: ' + kept);
  console.log('  Unchanged (empty): ' + unchanged);
  console.log('');
  console.log(APPLY ? 'Applied to Firestore.' : 'Dry run. Run with --apply to commit.');
  process.exit(0);
})();