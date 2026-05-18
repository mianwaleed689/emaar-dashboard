const fs = require('fs');
const path = require('path');

// These are the actual garbled sequences found in the files
// Pattern: \ufffd\u0192\u00a2\ufffd\u201a\ufffd = garbled em-dash/arrow sequences
const fixes = [
  // em dash variations
  ['\ufffd\u0192\u00a2\ufffd\u201a\u00ac\ufffd\u201a\u00ac', '\u2014'],
  ['\ufffd\u0192\u00a2\ufffd\u201a\u00ac', '\u2014'],
  // Arrow right
  ['\ufffd\u0192\u00a2\ufffd\u2020\u2019', '\u2192'],
  // Bullet
  ['\ufffd\u0192\u00a2\ufffd\u201a\u00a2', '\u2022'],
  // En dash  
  ['\ufffd\u0192\u00a2\ufffd\u201a\u00ac\ufffd', '\u2013'],
  // Ellipsis
  ['\ufffd\u0192\u00a2\ufffd\u201a\u00a6', '\u2026'],
  // Right single quote
  ['\ufffd\u0192\u00a2\ufffd\u201a\u2122', '\u2019'],
  // Left double quote  
  ['\ufffd\u0192\u00a2\ufffd\u201a\u0153', '\u201c'],
  // Right double quote
  ['\ufffd\u0192\u00a2\ufffd\u201a\u009d', '\u201d'],
  // Checkmark sequences
  ['\ufffd\u0192\u00a2\ufffd\u0161\u00bc', '\u2714'],
  ['\ufffd\u0192\u00a2\ufffd\u0161\u00b4', '\u2713'],
  // Warning/alert
  ['\ufffd\u0192\u00a2\ufffd\u009a\u00a0', '\u26a0'],
  // Star
  ['\ufffd\u0192\u00a2\ufffd\u00ad\u0090', '\u2b50'],
  // Generic cleanup - remove remaining \ufffd sequences with surrounding garbage
  // Replace common 3-char garbled sequences
  ['\ufffd\u201a\u00ac', '\u2014'],
  ['\ufffd\u2020\u2019', '\u2192'],
  ['\ufffd\u201a\u00a2', '\u2022'],
  ['\ufffd\u201a\u2122', '\u2019'],
  ['\ufffd\u201a\u0153', '\u201c'],
  ['\ufffd\u201a\u009d', '\u201d'],
  ['\ufffd\u201a\u00a6', '\u2026'],
  // Remove standalone replacement chars that are leftover
  ['\u0192\u00a2\ufffd', ''],
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
    const remaining = (c.match(/\ufffd/g) || []).length;
    return remaining;
  }
  return -1;
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
    const result = fixFile(f);
    if (result >= 0) {
      console.log('Fixed:', path.relative('src', f), '| Remaining \ufffd:', result);
      fixed++;
    }
  } catch(e) {
    console.error('Error on', f, e.message);
  }
});
console.log('Done. Fixed', fixed, 'files');
