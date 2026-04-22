const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function check() {
  const snap = await db.collection('projectData').get();
  snap.docs.forEach(doc => {
    const d = doc.data();
    if (!d.name || d.name === 'ABC' || doc.id.includes('abc') || doc.id.includes('ABC')) {
      console.log('ID:', doc.id, 'name:', d.name);
    }
  });
  process.exit(0);
}
check();
