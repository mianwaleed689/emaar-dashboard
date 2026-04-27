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
  if (v === null || v === undefined || v === '') return false;
  if (v === 0 || v === false) return false;
  if (Array.isArray(v) && v.length === 0) return false;
  if (typeof v === 'object') {
    if (Object.keys(v).length === 0) return false;
    if ('lat' in v && (v.lat === null || v.lat === '' || v.lat === undefined)
        && (v.lng === null || v.lng === '' || v.lng === undefined)) return false;
  }
  return true;
}

const APPLY = process.argv.includes('--apply');

(async () => {
  console.log(APPLY ? '=== EXECUTING MERGE ===' : '=== DRY RUN (use --apply to commit) ===');
  console.log('');

  let totalCopied = 0;
  let totalDeleted = 0;

  for (const [dupId, canonId] of Object.entries(PAIRS)) {
    const dupSnap = await db.collection('communities').doc(dupId).get();
    const canonSnap = await db.collection('communities').doc(canonId).get();
    if (!dupSnap.exists) { console.log('SKIP ' + dupId + ' (already gone)'); continue; }
    if (!canonSnap.exists) { console.log('SKIP ' + dupId + ' -> ' + canonId + ' (canonical missing!)'); continue; }

    const dupData = dupSnap.data();
    const canonData = canonSnap.data();

    // Build copy payload: fields where dup has value but canon doesn't
    const copyPayload = {};
    for (const field of VALUE_FIELDS) {
      if (hasValue(dupData[field]) && !hasValue(canonData[field])) {
        copyPayload[field] = dupData[field];
      }
    }

    const copyCount = Object.keys(copyPayload).length;
    console.log(dupId.padEnd(45) + ' -> ' + canonId);
    if (copyCount > 0) {
      console.log('  Copy ' + copyCount + ' fields: ' + Object.keys(copyPayload).join(', '));
    } else {
      console.log('  No fields to copy (canonical already has data or duplicate is empty)');
    }
    console.log('  Delete duplicate: ' + dupId);

    if (APPLY) {
      // Step 1: Copy unique fields to canonical
      if (copyCount > 0) {
        copyPayload._mergedFrom = admin.firestore.FieldValue.arrayUnion(dupId);
        copyPayload._mergedAt = admin.firestore.FieldValue.serverTimestamp();
        copyPayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('communities').doc(canonId).update(copyPayload);
        totalCopied += copyCount;

        // Audit log on canonical
        await db.collection('communities').doc(canonId).collection('auditLog').add({
          action: 'merged-from-duplicate',
          mergedFromId: dupId,
          fieldsCopied: Object.keys(copyPayload).filter(k => !k.startsWith('_') && k !== 'updatedAt'),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Still log the merge even if nothing copied
        await db.collection('communities').doc(canonId).collection('auditLog').add({
          action: 'merged-from-duplicate-empty',
          mergedFromId: dupId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Step 2: Delete the duplicate
      await db.collection('communities').doc(dupId).delete();
      totalDeleted++;
      console.log('  ✓ Done');
    }
    console.log('');
  }

  console.log('');
  if (APPLY) {
    console.log('Applied. Copied ' + totalCopied + ' fields, deleted ' + totalDeleted + ' duplicates.');
  } else {
    console.log('Dry run complete. Run with --apply to execute.');
  }
  process.exit(0);
})();