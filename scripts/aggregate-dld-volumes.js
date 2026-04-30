/* aggregate-dld-volumes.js - builds tabData/dldVolumes from real transactions */
const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  console.log('Reading transactions...');
  const snap = await db.collection('transactions').get();
  console.log('Total docs:', snap.size);
  const communityMap = {};
  snap.forEach(doc => {
    const d = doc.data();
    if (d.transGroup !== 'Sales') return;
    if (d.propertyUsage === 'Industrial') return;
    const community = d.masterProject || d.areaName;
    if (!community) return;
    const ppsf = Math.round((parseFloat(d.ppsf) || 0) / 10.764);
    const price = parseFloat(d.price) || 0;
    if (ppsf < 50 || ppsf > 15000) return;
    if (price <= 0) return;
    const year = d.date ? parseInt(d.date.substring(0,4)) : 0;
    const isOffPlan = (d.regType || '').toLowerCase().includes('off-plan') || (d.regType || '').toLowerCase().includes('off plan');
    const isRecent = year >= 2024;
    if (!communityMap[community]) {
      communityMap[community] = { community, totalTx:0, totalValue:0, ppsfSum:0, ppsfCount:0, offPlanCount:0, recentTx:0, recentPpsfSum:0, recentPpsfCount:0, prev2024PpsfSum:0, prev2024Count:0, types:{} };
    }
    const c = communityMap[community];
    c.totalTx++; c.totalValue += price; c.ppsfSum += ppsf; c.ppsfCount++;
    if (isOffPlan) c.offPlanCount++;
    const propType = d.propertySubType || d.propertyType || 'Unit';
    c.types[propType] = (c.types[propType] || 0) + 1;
    if (isRecent) { c.recentTx++; c.recentPpsfSum += ppsf; c.recentPpsfCount++; }
    if (year === 2024) { c.prev2024PpsfSum += ppsf; c.prev2024Count++; }
  });
  const rows = Object.values(communityMap)
    .filter(c => c.totalTx >= 10)
    .map(c => {
      const avgPpsf = c.ppsfCount > 0 ? Math.round(c.ppsfSum / c.ppsfCount) : 0;
      const recentAvgPpsf = c.recentPpsfCount > 0 ? Math.round(c.recentPpsfSum / c.recentPpsfCount) : 0;
      const prev2024Ppsf = c.prev2024Count > 0 ? Math.round(c.prev2024PpsfSum / c.prev2024Count) : 0;
      const yoyGrowth = prev2024Ppsf > 0 && recentAvgPpsf > 0 ? parseFloat(((recentAvgPpsf - prev2024Ppsf) / prev2024Ppsf * 100).toFixed(1)) : 0;
      const offPlanPct = Math.round((c.offPlanCount / c.totalTx) * 100);
      const topType = Object.entries(c.types).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unit';
      const typeLabel = topType.toLowerCase().includes('villa') ? 'Villa' : topType.toLowerCase().includes('flat') || topType.toLowerCase().includes('apart') ? 'Apartment' : topType.toLowerCase().includes('town') ? 'Townhouse' : 'Mixed';
      return { community: c.community, transactions: c.totalTx, value: parseFloat(c.totalValue.toFixed(0)), avgPpsf: recentAvgPpsf || avgPpsf, offPlanPct, yoyGrowth, type: typeLabel, note: c.totalTx.toLocaleString() + ' DLD transactions. Avg PPSF AED ' + (recentAvgPpsf||avgPpsf).toLocaleString() + '. ' + offPlanPct + '% off-plan.' };
    })
    .sort((a,b) => b.transactions - a.transactions);
  console.log('Communities aggregated:', rows.length);
  rows.slice(0,5).forEach(r => console.log(' ', r.community, r.transactions, 'tx PPSF:', r.avgPpsf));
  await db.collection('tabData').doc('dldVolumes').set({ rows, updatedAt: new Date().toISOString() });
  console.log('Written to tabData/dldVolumes');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });