// scripts/match-coords.js
//
// Cross-references scripts/local-coords.json with Firestore communities
// to find which verified docs missing coordinates can be auto-filled.
//
// READ-ONLY â€” no Firestore writes. Just reports the matching plan.
//
// Usage: node scripts/match-coords.js

const admin = require('firebase-admin');
const fs = require('fs');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

function normalizeForMatch(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

(async () => {
  // Load local coords
  const localCoords = JSON.parse(fs.readFileSync('./scripts/local-coords.json', 'utf8'));
  const localBySlug = new Map();
  for (const e of localCoords) {
    localBySlug.set(normalizeForMatch(e.slug), e);
  }

  // Fetch Firestore docs
  const snap = await db.collection('communities').get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const missingCoords = docs.filter(
    (d) => d.verified === true && (!d.coordinates || !d.coordinates.lat)
  );

  console.log('=========================================');
  console.log('  COORDINATE MATCH PLAN â€” DRY RUN');
  console.log('=========================================');
  console.log('');
  console.log('Verified docs missing coords: ' + missingCoords.length);
  console.log('Local coordinate entries available: ' + localCoords.length);
  console.log('');

  const matches = [];
  const unmatched = [];

  for (const doc of missingCoords) {
    // Try matching by id, then by name
    const idKey = normalizeForMatch(doc.id);
    const nameKey = normalizeForMatch(doc.name);

    const hit = localBySlug.get(idKey) || localBySlug.get(nameKey);

    if (hit) {
      matches.push({ doc, hit });
    } else {
      unmatched.push(doc);
    }
  }

  console.log('--- MATCHES (' + matches.length + ') ---');
  matches.forEach((m) => {
    console.log(
      '  ' +
        m.doc.id.padEnd(40) +
        ' <- ' +
        m.hit.slug.padEnd(30) +
        ' (' +
        m.hit.lat +
        ', ' +
        m.hit.lng +
        ')'
    );
  });

  console.log('');
  console.log('--- UNMATCHED (' + unmatched.length + ') ---');
  unmatched.forEach((d) => {
    console.log('  ' + d.id.padEnd(40) + ' | name: ' + (d.name || '(none)'));
  });

  console.log('');
  console.log('=========================================');
  console.log('  SUMMARY');
  console.log('=========================================');
  console.log('  Will auto-fill from local data: ' + matches.length);
  console.log('  Cannot auto-fill (need other source): ' + unmatched.length);
  console.log('');
  console.log('  No writes happened. Review the matches list above.');
  console.log('  If correct, run: node scripts/apply-coords.js');

  // Save matches to file for the apply step
  fs.writeFileSync(
    './scripts/coord-matches.json',
    JSON.stringify(
      matches.map((m) => ({
        docId: m.doc.id,
        docName: m.doc.name,
        lat: m.hit.lat,
        lng: m.hit.lng,
        sourceSlug: m.hit.slug,
        sourceFile: m.hit.sourceFile,
      })),
      null,
      2
    )
  );
  console.log('  Plan saved to scripts/coord-matches.json');

  process.exit(0);
})();
