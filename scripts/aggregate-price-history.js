const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
async function run() {
  console.log('Reading transactions...');
  const snap = await db.collection('transactions').get();
  console.log('Total:', snap.size);
  const map = {};
  snap.forEach(doc => {
    const d = doc.data();
    if (d.transGroup !== 'Sales') return;
    if (d.propertyUsage === 'Industrial') return;
    const community = d.masterProject || d.areaName;
    if (!community) return;
    const ppsf = Math.round((parseFloat(d.ppsf) || 0) / 10.764);
    if (ppsf < 50 || ppsf > 15000) return;
    const year = d.date ? d.date.substring(0,4) : null;
    if (!year) return;
    const key = community + '|' + year;
    if (!map[key]) map[key] = { community, year, ppsfSum:0, count:0, offPlanCount:0, prices:[] };
    map[key].ppsfSum += ppsf;
    map[key].count++;
    if ((d.regType||'').toLowerCase().includes('off')) map[key].offPlanCount++;
  });
  const batch = db.batch();
  let i = 0;
  const years = ['2020','2021','2022','2023','2024','2025'];
  const communityYearMap = {};
  Object.values(map).forEach(r => {
    if (r.count < 3) return;
    const ppsf = Math.round(r.ppsfSum / r.count);
    const offPlanPct = Math.round(r.offPlanCount / r.count * 100);
    if (!communityYearMap[r.community]) communityYearMap[r.community] = {};
    communityYearMap[r.community][r.year] = { ppsf, offPlanPct, count: r.count };
  });
  const docs = [];
  Object.entries(communityYearMap).forEach(([community, yearData]) => {
    const validYears = years.filter(y => yearData[y]);
    if (validYears.length < 2) return;
    const latestYear = validYears[validYears.length-1];
    const firstYear = validYears[0];
    const latestPpsf = yearData[latestYear].ppsf;
    const firstPpsf = yearData[firstYear].ppsf;
    const change5y = firstPpsf > 0 ? parseFloat(((latestPpsf-firstPpsf)/firstPpsf*100).toFixed(1)) : 0;
    const prevYear = validYears[validYears.length-2];
    const prevPpsf = yearData[prevYear]?.ppsf || 0;
    const change1y = prevPpsf > 0 ? parseFloat(((latestPpsf-prevPpsf)/prevPpsf*100).toFixed(1)) : 0;
    docs.push({ community, type:'annual', period: latestYear, ppsf: latestPpsf, change1y, change5y, yearData, updatedAt: new Date().toISOString() });
  });
  console.log('Price history docs to write:', docs.length);
  for (const d of docs) {
    const ref = db.collection('priceHistory').doc(d.community.replace(/[^a-zA-Z0-9]/g,'_'));
    batch.set(ref, d);
    i++;
  }
  await batch.commit();
  console.log('Written', i, 'docs to priceHistory collection');
  docs.slice(0,5).forEach(d => console.log(' ', d.community, d.period, 'PPSF:', d.ppsf, '1Y:', d.change1y+'%'));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });