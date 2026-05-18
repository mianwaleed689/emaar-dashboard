const fs = require('fs');
const path = require('path');

const fixes = [
  ['\u00e2\u20ac\u201c', '\u2013'],
  ['\u00e2\u20ac\u201d', '\u2014'],
  ['\u00e2\u20ac\u2122', '\u2019'],
  ['\u00e2\u20ac\u0153', '\u201c'],
  ['\u00e2\u20ac\u009d', '\u201d'],
  ['\u00e2\u20ac\u00a2', '\u2022'],
  ['\u00e2\u20ac\u00a6', '\u2026'],
  ['\u00e2\u201a\u00ac', '\u20ac'],
  ['\u00e2\u0080\u0099', '\u2019'],
  ['\u00e2\u0080\u009c', '\u201c'],
  ['\u00e2\u0080\u009d', '\u201d'],
  ['\u00e2\u0080\u0093', '\u2013'],
  ['\u00e2\u0080\u0094', '\u2014'],
  ['\u00e2\u0080\u00a2', '\u2022'],
  ['\u00e2\u0086\u0092', '\u2192'],
  ['\u00e2\u0086\u0090', '\u2190'],
  ['\u00e2\u009c\u0085', '\u2705'],
  ['\u00e2\u009c\u0093', '\u2713'],
  ['\u00e2\u009d\u008c', '\u274c'],
  ['\u00e2\u00ad\u0090', '\u2b50'],
  ['\u00e2\u0080\u00ba', '\u203a'],
  ['\u00c2\u00a0', ' '],
  ['\u00c2\u00b7', '\u00b7'],
  ['\u00c3\u00a9', 'e'],
  ['\u00c3\u00a8', 'e'],
  ['\u00c3\u00aa', 'e'],
  ['\u00c3\u00b4', 'o'],
  ['\u00e2\u201a\u00ac\u00a6', '\u2026'],
  ['\u00e2\u201a\u00ac\u201d', '\u2014'],
  ['\u00e2\u201a\u00ac\u2022', '\u2022'],
  ['\u00e2\u201a\u00ac\u2013', '\u2013'],
];

function fixFile(filepath) {
  let c = fs.readFileSync(filepath, 'utf8');
  const orig = c;
  for (const [bad, good] of fixes) {
    if (c.includes(bad)) {
      c = c.split(bad).join(good);
    }
  }
  if (c !== orig) {
    fs.writeFileSync(filepath, c, 'utf8');
    return true;
  }
  return false;
}

function scan(dir) {
  const files = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'functions'].includes(f)) {
        files.push(...scan(p));
      } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
        files.push(p);
      }
    });
  } catch(e) {}
  return files;
}

let fixed = 0;
const files = scan('src');
console.log('Scanning', files.length, 'files...');
files.forEach(f => {
  try {
    if (fixFile(f)) {
      console.log('Fixed:', path.relative('src', f));
      fixed++;
    }
  } catch(e) {
    console.error('Error on', f, e.message);
  }
});
console.log('Done. Fixed', fixed, 'files');
