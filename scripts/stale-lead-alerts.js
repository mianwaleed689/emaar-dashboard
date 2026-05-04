/* stale-lead-alerts.js */
/* Runs daily - finds leads with no contact for 7+ days */
/* Sends in-platform notification to manager */
const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  console.log('Checking stale leads...');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Get all active leads not contacted in 7+ days
  const snap = await db.collection('leads').get();
  
  console.log('Total active leads:', snap.size);
  
  const staleLeads = [];
  snap.forEach(doc => {
    const d = doc.data();
    const lastContact = d.lastContact || d.updatedAt || d.createdAt;
    if (lastContact && lastContact < sevenDaysAgo && d.assignedTo) {
      staleLeads.push({ id: doc.id, ...d });
    }
  });
  
  console.log('Stale leads found:', staleLeads.length);
  
  // Group by managerId
  const byManager = {};
  staleLeads.forEach(lead => {
    const mid = lead.managerId || 'unassigned';
    if (!byManager[mid]) byManager[mid] = [];
    byManager[mid].push(lead);
  });
  
  // Send notification to each manager
  const batch = db.batch();
  let notifCount = 0;
  
  for (const [managerId, leads] of Object.entries(byManager)) {
    if (managerId === 'unassigned') continue;
    
    const notifRef = db.collection('notifications').doc();
    batch.set(notifRef, {
      userId: managerId,
      type: 'stale_leads',
      title: `${leads.length} stale lead${leads.length > 1 ? 's' : ''} need attention`,
      message: `${leads.length} lead${leads.length > 1 ? 's have' : ' has'} had no contact for 7+ days`,
      leadIds: leads.map(l => l.id).slice(0, 10),
      count: leads.length,
      read: false,
      createdAt: new Date().toISOString(),
    });
    notifCount++;
    console.log(' Manager', managerId, ':', leads.length, 'stale leads');
  }
  
  await batch.commit();
  console.log('Sent', notifCount, 'stale lead notifications');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
