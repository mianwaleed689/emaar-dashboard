const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const PAIRS = {
  'al-hebiah-fifth': 'dubai-sports-city',
  'arabian-ranches---1': 'arabian-ranches',
  'bluewaters': 'bluewaters-island',
  'business-park': 'zaabeel-second',
  'difc': 'dubai-international-financial-center',
  'dubai-hills': 'dubai-hills-estate',
  'international-media-production-zone': 'dubai-production-city',
  'jabal-ali': 'jebel-ali',
  'jabal-ali-village': 'jebel-ali',
  'jumeira-bay': 'jumeirah-bay',
  'jumeirah-lakes-towers': 'jumeirah-lake-towers',
  'jumeriah-beach-residence----jbr': 'jumeirah-beach-residence',
  'jumeriah-beach-residence---jbr': 'jumeirah-beach-residence',
  'jvc': 'jumeirah-village-circle',
  'jvt': 'jumeirah-village-triangle',
  'marsa-dubai': 'dubai-marina',
  'mbr-city': 'mohammed-bin-rashid-city',
  'meaisem-second': 'me-aisem-second',
  'silicon-oasis': 'dubai-silicon-oasis',
};

(async () => {
  console.log('Verifying canonical targets exist...');
  console.log('');
  let allGood = true;
  for (const [dup, canon] of Object.entries(PAIRS)) {
    const dupSnap = await db.collection('communities').doc(dup).get();
    const canonSnap = await db.collection('communities').doc(canon).get();
    const dupOk = dupSnap.exists ? 'OK' : 'MISSING';
    const canonOk = canonSnap.exists ? 'OK' : 'MISSING';
    if (!canonSnap.exists) allGood = false;
    console.log('  ' + dup.padEnd(45) + ' [' + dupOk + ']  ->  ' + canon.padEnd(45) + ' [' + canonOk + ']');
  }
  console.log('');
  console.log(allGood ? 'ALL CANONICAL TARGETS EXIST. Safe to delete duplicates.' : 'WARNING: Some canonical targets missing. Do NOT delete yet.');
  process.exit(0);
})();