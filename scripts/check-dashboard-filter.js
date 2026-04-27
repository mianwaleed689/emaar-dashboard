const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const docs = (await db.collection('communities').get()).docs.map(d => ({ id: d.id, ...d.data() }));

  const stats = { total: docs.length };
  const visStats = {};
  const verifiedStats = { trueCount: 0, falseCount: 0, missing: 0 };

  docs.forEach(d => {
    const v = d.visibility || '(missing)';
    visStats[v] = (visStats[v] || 0) + 1;
    if (d.verified === true) verifiedStats.trueCount++;
    else if (d.verified === false) verifiedStats.falseCount++;
    else verifiedStats.missing++;
  });

  console.log('Total: ' + stats.total);
  console.log('');
  console.log('visibility distribution:');
  Object.entries(visStats).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => {
    console.log('  ' + v.toString().padStart(4) + '  ' + k);
  });
  console.log('');
  console.log('verified flag:');
  console.log('  true:    ' + verifiedStats.trueCount);
  console.log('  false:   ' + verifiedStats.falseCount);
  console.log('  missing: ' + verifiedStats.missing);
  console.log('');

  // How many would pass user-facing filter under different conditions
  const userFacing = docs.filter(d =>
    ['consumer-community','master-community','sub-community'].includes(d.displayCategory)
  );
  console.log('User-facing tiers (A/B/C): ' + userFacing.length);
  console.log('  + visibility==published:        ' + userFacing.filter(d => d.visibility === 'published').length);
  console.log('  + visibility != archived:       ' + userFacing.filter(d => d.visibility !== 'archived').length);
  console.log('  + verified === true:            ' + userFacing.filter(d => d.verified === true).length);
  console.log('  + has name:                     ' + userFacing.filter(d => d.name).length);
  process.exit(0);
})();