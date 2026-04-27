const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const APPLY = process.argv.includes('--apply');

(async () => {
  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN ===');
  console.log('');

  // Get all communities to know which IDs are valid masters
  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const validMasters = new Set(
    docs
      .filter(d => d.displayCategory === 'master-community' || d.displayCategory === 'consumer-community')
      .map(d => d.id)
  );

  let fixed = 0;
  let kept = 0;
  let alreadyEmpty = 0;

  for (const d of docs) {
    if (!d.parentCommunity) { alreadyEmpty++; continue; }

    // Sub-communities should have parents, leave them alone
    if (d.displayCategory === 'sub-community') {
      kept++;
      continue;
    }

    // For Tier A/B/D — parentCommunity should not be a cadastral code
    // If parentCommunity points to a non-master/non-consumer, it's bad
    const parentValid = validMasters.has(d.parentCommunity);

    if (!parentValid) {
      console.log(d.id.padEnd(40) + ' parentCommunity: "' + d.parentCommunity + '" -> CLEAR (not a valid master)');
      if (APPLY) {
        await db.collection('communities').doc(d.id).update({
          parentCommunity: admin.firestore.FieldValue.delete(),
          _parentCleanupAt: admin.firestore.FieldValue.serverTimestamp(),
          _parentCleanupReason: 'invalid: ' + d.parentCommunity,
        });
      }
      fixed++;
    } else {
      // Valid parent on a non-sub-community is suspicious. Log but don't auto-fix.
      console.log(d.id.padEnd(40) + ' parentCommunity: "' + d.parentCommunity + '" - valid master but doc is ' + d.displayCategory + ' (review)');
      kept++;
    }
  }

  console.log('');
  console.log('Summary:');
  console.log('  Cleared (invalid parents): ' + fixed);
  console.log('  Kept (valid sub-community parents or review): ' + kept);
  console.log('  Already empty: ' + alreadyEmpty);
  console.log('');
  console.log(APPLY ? 'Applied.' : 'Dry run. Use --apply to commit.');
  process.exit(0);
})();