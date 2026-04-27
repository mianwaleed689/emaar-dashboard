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

// Fields that might have unique data worth preserving
const VALUE_FIELDS = [
  'arabicName', 'description', 'tagline', 'coverImageUrl',
  'coordinates', 'aliases',
  'avgPpsf', 'avgRentPerSqftYr', 'grossYieldPct', 'netYieldPct',
  'totalProjects', 'developersActive', 'populationEstimate',
  'restaurantCount', 'schoolRating',
  'metroDistanceKm', 'nearestMetroStation',
  'beachAccess', 'golfAccess', 'parkAccess',
];

function hasValue(v) {
  if (v === null || v === undefined) return false;
  if (v === '') return false;
  if (v === 0 || v === false) return false; // skip default zeros/false
  if (Array.isArray(v) && v.length === 0) return false;
  if (typeof v === 'object' && Object.keys(v).length === 0) return false;
  if (typeof v === 'object' && v.lat === null && v.lng === null) return false;
  if (typeof v === 'object' && (v.lat === undefined || v.lat === '') && (v.lng === undefined || v.lng === '')) return false;
  return true;
}

(async () => {
  console.log('Checking duplicates for unique data canonical lacks...');
  console.log('');
  let totalToCopy = 0;

  for (const [dup, canon] of Object.entries(PAIRS)) {
    const dupSnap = await db.collection('communities').doc(dup).get();
    const canonSnap = await db.collection('communities').doc(canon).get();
    if (!dupSnap.exists || !canonSnap.exists) continue;

    const dupData = dupSnap.data();
    const canonData = canonSnap.data();

    const fieldsToCopy = {};
    for (const field of VALUE_FIELDS) {
      const dupVal = dupData[field];
      const canonVal = canonData[field];
      if (hasValue(dupVal) && !hasValue(canonVal)) {
        fieldsToCopy[field] = dupVal;
      }
    }

    if (Object.keys(fieldsToCopy).length > 0) {
      console.log(dup + ' has unique data canonical (' + canon + ') lacks:');
      for (const [k, v] of Object.entries(fieldsToCopy)) {
        let displayVal = v;
        if (typeof v === 'object') displayVal = JSON.stringify(v).slice(0, 60);
        if (typeof v === 'string' && v.length > 60) displayVal = v.slice(0, 60) + '...';
        console.log('    ' + k + ' = ' + displayVal);
        totalToCopy++;
      }
      console.log('');
    }
  }

  if (totalToCopy === 0) {
    console.log('NO UNIQUE DATA TO PRESERVE. Duplicates are pure orphans, safe to delete outright.');
  } else {
    console.log('TOTAL FIELDS WORTH PRESERVING: ' + totalToCopy);
    console.log('Recommend copying these to canonical before deletion.');
  }
  process.exit(0);
})();