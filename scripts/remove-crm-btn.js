const fs = require('fs');
let c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const lines = c.split('\n');

const startIdx = lines.findIndex((l, i) => i > 4304 && l.includes('group.id==="crm"'));
console.log('Bad button at line:', startIdx + 1);

if (startIdx > 0) {
  lines.splice(startIdx, 14);
  fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', lines.join('\n'), 'utf8');
  console.log('Removed. Line 4307 now:', lines[4306] && lines[4306].trim());
} else {
  console.log('Not found');
}
