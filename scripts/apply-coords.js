// scripts/apply-coords.js
//
// Applies the coordinate matches from coord-matches.json to Firestore.
// Each Firestore doc is updated with:
//   - coordinates: { lat, lng }
//   - coordinatesSource: <source file slug>
//   - coordinatesUpdatedAt: <timestamp>
//
// Usage:
//   node scripts/apply-coords.js          (dry run, default)
//   node scripts/apply-coords.js --apply  (actually writes to Firestore)

const admin = require('firebase-admin');
const fs = require('fs');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

const APPLY = process.argv.includes('--apply');

(async () => {
  const matches = JSON.parse(fs.readFileSync('./scripts/coord-matches.json', 'utf8'));

  console.log('=========================================');
  console.log(APPLY ? '  APPLYING TO FIRESTORE (live)' : '  DRY RUN (use --apply to commit)');
  console.log('=========================================');
  console.log('');

  let success = 0;
  let failed = 0;

  for (const m of matches) {
    const update = {
      coordinates: { lat: m.lat, lng: m.lng },
      coordinatesSource: 'local-file:' + m.sourceFile + ':' + m.sourceSlug,
      coordinatesUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (APPLY) {
      try {
        await db.collection('communities').doc(m.docId).update(update);
        console.log('  WROTE  ' + m.docId.padEnd(40) + ' -> (' + m.lat + ', ' + m.lng + ')');
        success++;
      } catch (err) {
        console.error('  FAILED ' + m.docId + ' — ' + err.message);
        failed++;
      }
    } else {
      console.log('  would write  ' + m.docId.padEnd(40) + ' -> (' + m.lat + ', ' + m.lng + ')');
    }
  }

  console.log('');
  console.log('=========================================');
  if (APPLY) {
    console.log('  Done. Wrote: ' + success + ' | Failed: ' + failed);
  } else {
    console.log('  ' + matches.length + ' updates planned. Run with --apply to commit.');
  }
  console.log('=========================================');

  process.exit(0);
})();
