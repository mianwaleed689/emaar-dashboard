const fs = require('fs');
const rows = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8').split('\n');
const BT = String.fromCharCode(96);
const S = String.fromCharCode(36);
const d = '\u2014'.repeat(18);
const line = [
  '\uD83C\uDFD7\uFE0F DAX ANALYTICS ' + d,
  '\uD83D\uDC4C ' + S + '{dvSelected.project}',
  '\uD83C\uDFE2 ' + S + '{dvSelected.developer} \u00B7 ' + S + '{dvSelected.community}',
  '',
  '\uD83D\uDCCA STATUS: ' + S + '{hdvSelected.status}',
  '\uD83D\uDD27 Construction: ' + S + '{hdvSelected.constructionPct}% complete',
  '\uD83D\uDC45 Expected: ' + S + '{new Date(hdvSelected.expectedDate).toLocaleDateString(\"en-GB\")}',
  '\u26A0\uFE0F Delay Risk: ' + S + '{hdvSelected.delayRisk}',
  '',
  '\uD83D\uDD10 RERA: ' + S + '{hdvSelected.reraNo}',
  '\uD83C\uDFE6 Escrow: ' + S + '{hdvSelected.escrowBank}',
  d,
  'Powered by DXB Analytics',
  'emaar-dashboard.pages.dev'
].join('\\n');
rows[4858] = '                    const txt = ' + BT + line + BT + ';';
rows[4858] = rows[4858].replace('DAX', 'DB');
fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', rows.join('\n'), 'utf8');
console.log('Fixed:', rows[4858].substring(20,160));