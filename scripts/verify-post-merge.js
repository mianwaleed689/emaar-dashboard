const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const cats = {};
  docs.forEach(d => {
    const c = d.displayCategory || '(none)';
    cats[c] = (cats[c] || 0) + 1;
  });

  console.log('Total communities: ' + docs.length);
  console.log('');
  console.log('By category:');
  Object.entries(cats).sort().forEach(([k, v]) => {
    console.log('  ' + k.padEnd(25) + v);
  });
  console.log('');

  // Spot-check the populated canonicals
  console.log('Spot-check key canonicals:');
  const checkIds = ['jumeirah-village-circle', 'jumeirah-village-triangle', 'mohammed-bin-rashid-city', 'dubai-silicon-oasis', 'jebel-ali'];
  for (const id of checkIds) {
    const snap = await db.collection('communities').doc(id).get();
    if (!snap.exists) { console.log('  ' + id + ' MISSING'); continue; }
    const d = snap.data();
    console.log('  ' + id);
    console.log('    name: ' + d.name);
    console.log('    arabicName: ' + (d.arabicName || '(empty)'));
    console.log('    totalProjects: ' + (d.totalProjects || 0));
    console.log('    coordinates: ' + (d.coordinates ? JSON.stringify(d.coordinates) : '(empty)'));
    console.log('    _mergedFrom: ' + (d._mergedFrom ? JSON.stringify(d._mergedFrom) : '(none)'));
  }
  process.exit(0);
})();