const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function importSheets() {
  const leads = JSON.parse(fs.readFileSync('./src/sheets_leads_clean.json', 'utf8'));
  console.log(`Importing ${leads.length} leads...`);
  
  const batchSize = 500;
  let count = 0;
  
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = db.batch();
    const chunk = leads.slice(i, i + batchSize);
    chunk.forEach(lead => {
      const ref = db.collection('leads').doc();
      batch.set(ref, { ...lead, createdAt: lead.createdAt || new Date().toISOString(), source: lead.source || 'DLD Sheets' });
    });
    await batch.commit();
    count += chunk.length;
    console.log(`Imported: ${count} / ${leads.length}`);
  }
  
  console.log('Done!');
  process.exit(0);
}

importSheets().catch(err => { console.error(err); process.exit(1); });
