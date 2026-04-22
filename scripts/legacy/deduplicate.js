const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

function scoreCompleteness(lead) {
  let score = 0;
  if (lead.name && lead.name.trim()) score++;
  if (lead.email && lead.email.includes('@')) score++;
  if (lead.phone && lead.phone.length > 6) score++;
  if (lead.community && lead.community.trim()) score++;
  if (lead.nationality && lead.nationality.trim()) score++;
  if (lead.project && lead.project.trim()) score++;
  if (lead.budget && lead.budget.trim()) score++;
  return score;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function deduplicate() {
  console.log('Loading all leads...');
  const snap = await db.collection('leads').get();
  console.log(`Total: ${snap.size}`);

  const phoneMap = {};
  const emailMap = {};
  const toDelete = new Set();

  snap.forEach(doc => {
    const d = { id: doc.id, ...doc.data() };
    const phone = (d.phone || '').trim();
    const email = (d.email || '').trim().toLowerCase();

    if (phone && phone.length > 6) {
      if (!phoneMap[phone]) {
        phoneMap[phone] = d;
      } else {
        if (scoreCompleteness(d) > scoreCompleteness(phoneMap[phone])) {
          toDelete.add(phoneMap[phone].id);
          phoneMap[phone] = d;
        } else {
          toDelete.add(d.id);
        }
      }
    }

    if (email && email.includes('@')) {
      if (!emailMap[email]) {
        emailMap[email] = d;
      } else {
        if (scoreCompleteness(d) > scoreCompleteness(emailMap[email])) {
          toDelete.add(emailMap[email].id);
          emailMap[email] = d;
        } else {
          toDelete.add(d.id);
        }
      }
    }
  });

  console.log(`Duplicates to delete: ${toDelete.size}`);
  const ids = [...toDelete];
  const batchSize = 200;
  let done = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    let retries = 5;
    while (retries > 0) {
      try {
        const batch = db.batch();
        ids.slice(i, i + batchSize).forEach(id => {
          batch.delete(db.collection('leads').doc(id));
        });
        await batch.commit();
        done += Math.min(batchSize, ids.length - i);
        process.stdout.write(`\rDeleted: ${done}/${toDelete.size}`);
        break;
      } catch(e) {
        retries--;
        console.log(`\nRetry... ${retries} left`);
        await sleep(3000);
      }
    }
  }

  console.log('\nDeduplication complete!');
  process.exit(0);
}

deduplicate().catch(err => { console.error(err); process.exit(1); });
