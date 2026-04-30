const fs = require('fs');
let c = fs.readFileSync('src/tabs/PriceHistoryTab.jsx', 'utf8');
const old = 'const communities = [' + String.fromCharCode(34) + 'All' + String.fromCharCode(34) + ', ...new Set(phCommunityData.map(d => d.community).filter(Boolean))];';
const neo = 'const communities = [' + String.fromCharCode(34) + 'All' + String.fromCharCode(34) + ', ...new Set(phFromFirestore.length > 0 ? phFromFirestore.map(d => d.community).filter(Boolean).sort() : phCommunityData.map(d => d.community).filter(Boolean))];';
if (c.includes(old)) {
  c = c.replace(old, neo);
  fs.writeFileSync('src/tabs/PriceHistoryTab.jsx', c, 'utf8');
  console.log('Fixed');
} else { console.log('Not found'); }