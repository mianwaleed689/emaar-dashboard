const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function migrate() {
  const snap = await db.collection('projects').get();
  console.log('Found', snap.size, 'projects to migrate');
  for (const doc of snap.docs) {
    await db.collection('projectData').doc(doc.id).set(doc.data(), { merge: true });
    console.log('Migrated:', doc.id);
  }
  console.log('Done!');
  process.exit(0);
}
migrate();
