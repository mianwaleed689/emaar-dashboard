// scripts/extract-local-coords.js
//
// Reads src/communities/*.communities.js files, extracts every
// `coordinates: { lat: X, lng: Y }` block linked to an `id: "slug"`,
// writes results to scripts/local-coords.json.
//
// Usage: node scripts/extract-local-coords.js

const fs = require('fs');
const path = require('path');

const dir = './src/communities';
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.js') && !f.startsWith('index'));

const allLocal = [];

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');

  // Match: id: "<slug>" ... within ~3000 chars ... coordinates: { lat: <num>, lng: <num> }
  const re = /id\s*:\s*["'`]([^"'`]+)["'`][\s\S]{0,3000}?coordinates\s*:\s*\{\s*lat\s*:\s*([-\d.]+)\s*,\s*lng\s*:\s*([-\d.]+)/g;

  let m;
  while ((m = re.exec(content)) !== null) {
    allLocal.push({
      slug: m[1],
      lat: parseFloat(m[2]),
      lng: parseFloat(m[3]),
      sourceFile: f,
    });
  }
}

console.log('Total entries with coordinates: ' + allLocal.length);
console.log('');
allLocal.forEach((e) => {
  const slug = e.slug.padEnd(40);
  const lat = String(e.lat.toFixed(4)).padEnd(9);
  const lng = String(e.lng.toFixed(4)).padEnd(9);
  console.log('  ' + slug + ' lat=' + lat + ' lng=' + lng + ' (' + e.sourceFile + ')');
});

const outFile = './scripts/local-coords.json';
fs.writeFileSync(outFile, JSON.stringify(allLocal, null, 2));
console.log('');
console.log('Saved to ' + outFile);
