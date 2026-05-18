const fs = require('fs');
const path = require('path');

function fixFile(filepath) {
  let c = fs.readFileSync(filepath, 'utf8');
  const orig = c;
  
  // Replace garbled sequences - these are all UTF-8 mojibake patterns
  // The core pattern is \ufffd mixed with latin chars
  
  // Known emoji/symbol sequences
  const knownFixes = [
    // Arrows
    [/\ufffd[\u0192\u0192]\u00a2\ufffd[\u2020\u2021]\u2019/g, '\u2192'],
    [/\ufffd\u0192\u00a2\ufffd\u2020\u2019/g, '\u2192'],
    // Em dash
    [/\ufffd\u0192\u00a2\ufffd\u201a[\u00ac\u20ac]/g, '\u2014'],
    // Bullet  
    [/\ufffd\u0192\u00a2\ufffd\u201a\u00a2/g, '\u2022'],
    // En dash
    [/\ufffd\u0192\u00a2\ufffd\u201a\u0093/g, '\u2013'],
    // Ellipsis
    [/\ufffd\u0192\u00a2\ufffd\u201a\u00a6/g, '\u2026'],
    // Single right quote
    [/\ufffd\u0192\u00a2\ufffd\u201a\u2122/g, '\u2019'],
    // Left double quote
    [/\ufffd\u0192\u00a2\ufffd\u201a\u0153/g, '\u201c'],
    // Right double quote  
    [/\ufffd\u0192\u00a2\ufffd\u201a[\u009d\u009e]/g, '\u201d'],
    // Checkmarks
    [/\ufffd\u0192\u00a2\ufffd\u0161[\u00b4\u00bc\u00be]/g, '\u2714'],
    // Star
    [/\ufffd\u0192\u00a2\ufffd\u00ad\u0090/g, '\u2b50'],
    // Section dividers (=====) - just use dashes
    [/[\ufffd][\u0192][\u00a2][\ufffd][\u201a][\u00ac][\ufffd][\u0192][\u00a2][\ufffd][\u201a][\u00ac]/g, '\u2014\u2014\u2014'],
  ];

  for (const [pattern, replacement] of knownFixes) {
    c = c.replace(pattern, replacement);
  }

  // Now handle remaining \ufffd sequences
  // In comments: replace garbled sequences with clean dashes
  // Pattern: multiple \ufffd chars in a row (section dividers)
  c = c.replace(/(\ufffd[\u0080-\u00ff\u0100-\u024f\u2000-\u2fff]*){2,}/g, '\u2014');
  
  // Single remaining \ufffd with latin supplement chars - just remove them
  c = c.replace(/\ufffd[\u0080-\u00ff]/g, '');
  c = c.replace(/[\u0080-\u009f]\ufffd/g, '');
  
  // Clean up leftover single \ufffd
  c = c.replace(/\ufffd/g, '');
  
  // Clean up \u0192\u00a2 (ƒ¢) leftover from garbled sequences
  c = c.replace(/\u0192\u00a2/g, '');
  
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
    console.error('Error:', path.relative('src', f), e.message);
  }
});
console.log('\nDone. Fixed', fixed, 'files');
