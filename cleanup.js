const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function cleanup() {
  const snap = await db.collection('projectData').get();
  console.log('Total docs:', snap.size);
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.name || data.name === '' || data.name === 'Untitled') {
      await db.collection('projectData').doc(doc.id).delete();
      console.log('Deleted junk doc:', doc.id);
    }
  }
  console.log('Done!');
  process.exit(0);
}
cleanup();
