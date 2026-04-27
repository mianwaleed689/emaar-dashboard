const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
const fs = require('fs');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const snap = await db.collection('communities').where('displayCategory', '==', 'duplicate-merge').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
  console.log('Found ' + docs.length + ' duplicate-merge docs');

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = './scripts/backups/duplicates-pre-merge-' + ts + '.json';
  fs.writeFileSync(file, JSON.stringify(docs, null, 2));
  const sizeKb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log('Backed up to ' + file + ' (' + sizeKb + ' KB)');

  console.log('');
  console.log('Duplicates to be deleted:');
  docs.forEach(d => {
    console.log('  ' + d.id.padEnd(45) + ' -> ' + (d.mergedInto || 'NO TARGET'));
  });
  process.exit(0);
})();