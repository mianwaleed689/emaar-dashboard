const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const consumerOnly = docs.filter(d => d.displayCategory === 'consumer-community');

  console.log('Consumer communities total: ' + consumerOnly.length);
  const withArea = consumerOnly.filter(d => d.area && d.area.trim());
  console.log('  with area field set: ' + withArea.length);
  console.log('  without: ' + (consumerOnly.length - withArea.length));
  console.log('');

  console.log('Distinct area values currently used:');
  const areas = {};
  consumerOnly.forEach(d => {
    const a = (d.area || '').trim();
    if (a) areas[a] = (areas[a] || 0) + 1;
  });
  Object.entries(areas).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => {
    console.log('  ' + v.toString().padStart(3) + '  ' + k);
  });
  process.exit(0);
})();