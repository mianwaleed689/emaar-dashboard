const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const DUPLICATE_NAMES = {
  'JVC': 'Jumeirah Village Circle',
  'JVT': 'Jumeirah Village Triangle',
  'Silicon Oasis': 'Dubai Silicon Oasis',
  'DIFC': 'Dubai International Financial Center',
  'Dubai Hills': 'Dubai Hills Estate',
  'MBR City': 'Mohammed Bin Rashid City',
  'Jumeirah Lakes Towers': 'Jumeirah Lake Towers',
  'Jumeira Bay': 'Jumeirah Bay',
  'Bluewaters': 'Bluewaters Island',
  'Jabal Ali': 'Jebel Ali',
  'Jabal Ali Village': 'Jebel Ali',
  'Marsa Dubai': 'Dubai Marina',
  'Al Hebiah Fifth': 'Dubai Sports City',
  'International Media Production Zone': 'Dubai Production City',
  'Business Park': 'Zaabeel Second',
};

(async () => {
  console.log('Scanning all projects for community references...');
  console.log('');
  const snap = await db.collection('projects').get();
  console.log('Total projects: ' + snap.size);
  console.log('');

  const communityValues = {};
  const areaValues = {};
  snap.forEach(d => {
    const data = d.data();
    if (data.community) communityValues[data.community] = (communityValues[data.community] || 0) + 1;
    if (data.area) areaValues[data.area] = (areaValues[data.area] || 0) + 1;
  });

  console.log('Distinct community values: ' + Object.keys(communityValues).length);
  console.log('Distinct area values: ' + Object.keys(areaValues).length);
  console.log('');

  console.log('Projects referencing duplicate community names:');
  let foundAny = false;
  for (const [dupName, canonName] of Object.entries(DUPLICATE_NAMES)) {
    const inComm = communityValues[dupName] || 0;
    const inArea = areaValues[dupName] || 0;
    if (inComm + inArea > 0) {
      foundAny = true;
      console.log('  ' + dupName + ' -> should be ' + canonName);
      console.log('    community field: ' + inComm + ' projects');
      console.log('    area field:      ' + inArea + ' projects');
    }
  }
  if (!foundAny) console.log('  NONE - no projects reference duplicate names directly.');

  console.log('');
  console.log('Top 30 community names in projects:');
  Object.entries(communityValues).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => {
    console.log('  ' + v.toString().padStart(4) + '  ' + k);
  });

  process.exit(0);
})();