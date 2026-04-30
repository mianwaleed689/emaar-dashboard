const fs = require('fs');
const c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const rows = c.split('\n');
const dash = '\u2014'.repeat(18);
const newLine = '                    const txt = \u{1F3D7}\uFE0F DXB ANALYTICS ' + dash + '\\n\u{1F4CC} \\
\u{1F3E2}  \xB7 \\
\\n\u{1F4CA} STATUS: \\
\u{1F527} Construction: %\\n\u{1F4C5} Expected: \\
\u26A0\uFE0F Delay Risk: \\
\\n\u{1F510} RERA: \\
\u{1F3E6} Escrow: \\
' + dash + '\\nPowered by DXB Analytics\\nemaar-dashboard.pages.dev;';
rows[4858] = newLine;
fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', rows.join('\n'), 'utf8');
console.log('Fixed');