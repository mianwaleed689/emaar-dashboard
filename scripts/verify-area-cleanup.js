const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const consumerOnly = docs.filter(d => d.displayCategory === 'consumer-community');

  console.log('Post-cleanup state:');
  console.log('  Total consumer communities: ' + consumerOnly.length);
  console.log('');

  // Distinct area values now
  const areas = {};
  consumerOnly.forEach(d => {
    const a = (d.area || '').trim();
    if (a) areas[a] = (areas[a] || 0) + 1;
  });
  console.log('Distinct area values now (' + Object.keys(areas).length + '):');
  Object.entries(areas).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>{
    console.log('  ' + v.toString().padStart(3) + '  ' + k);
  });

  console.log('');
  // How many now have cadastralCode
  const withCadastral = consumerOnly.filter(d => d.cadastralCode).length;
  console.log('Consumer communities with cadastralCode: ' + withCadastral);

  console.log('');
  // Spot-check some specific ones
  console.log('Spot-check:');
  for (const id of ['dubai-marina', 'business-bay', 'jvc' /* should be deleted */, 'jumeirah-village-circle', '800-villas']) {
    const snap = await db.collection('communities').doc(id).get();
    if (!snap.exists) { console.log('  ' + id + ' = (deleted)'); continue; }
    const d = snap.data();
    console.log('  ' + id);
    console.log('    area: ' + (d.area || '(empty)'));
    console.log('    cadastralCode: ' + (d.cadastralCode || '(none)'));
    console.log('    parentCommunity: ' + (d.parentCommunity || '(none)'));
  }
  process.exit(0);
})();