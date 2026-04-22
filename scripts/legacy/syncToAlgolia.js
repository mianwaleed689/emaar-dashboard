const { algoliasearch } = require('algoliasearch');
const admin = require('firebase-admin');

const client = algoliasearch('WHKSK7X34Y', '506813970414b8d353a96ca1ed1481d0');

const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function syncLeads() {
  console.log('Fetching leads from Firestore...');
  const snapshot = await db.collection('leads').get();
  const leads = [];

  snapshot.forEach(doc => {
    leads.push({ objectID: doc.id, ...doc.data() });
  });

  console.log(`Total leads: ${leads.length}`);
  console.log('Resuming from 42000...');

  const remaining = leads.slice(42000);
  const batchSize = 500;

  for (let i = 0; i < remaining.length; i += batchSize) {
    const batch = remaining.slice(i, i + batchSize);
    let retries = 3;
    while (retries > 0) {
      try {
        await client.saveObjects({ indexName: 'leads', objects: batch });
        console.log(`Done: ${42000 + Math.min(i + batchSize, remaining.length)} / ${leads.length}`);
        break;
      } catch (err) {
        retries--;
        console.log(`Retry... ${retries} left`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.log('Sync complete!');
  process.exit(0);
}

syncLeads().catch(err => { console.error(err); process.exit(1); });
