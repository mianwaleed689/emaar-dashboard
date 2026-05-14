const fs = require('fs');
let c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const lines = c.split('\n');

// Find the line after the sidebar group button closes for CRM group
// We look for the closing </button> after group.label span
let insertIdx = -1;
for (let i = 4295; i < 4320; i++) {
  if (lines[i] && lines[i].includes('</button>') && !lines[i].includes('type=')) {
    insertIdx = i + 1;
    break;
  }
}

console.log('Insert after line:', insertIdx + 1);
console.log('Context:', lines[insertIdx] && lines[insertIdx].trim().substring(0, 60));

const crmBtn = [
  "            {group.id === 'crm' && !sidebarSearch && (",
  "              <button type='button' onClick={() => setShowCRM(true)} style={{",
  "                display:'flex', alignItems:'center', gap:8, width:'100%',",
  "                padding:'8px 12px', margin:'4px 0',",
  "                background:'linear-gradient(135deg,rgba(212,168,67,0.15),rgba(0,191,165,0.1))',",
  "                border:'1px solid rgba(212,168,67,0.3)', borderRadius:8,",
  "                color:'#D4A843', fontSize:12, fontWeight:700, cursor:'pointer',",
  "                fontFamily:\"'Outfit',sans-serif\",",
  "              }}>",
  "                <span style={{fontSize:14}}>⚡</span>",
  "                Open CRM Dashboard",
  "                <span style={{marginLeft:'auto',fontSize:10,background:'rgba(212,168,67,0.2)',padding:'2px 6px',borderRadius:6}}>NEW</span>",
  "              </button>",
  "            )}",
];

if (insertIdx > 0) {
  lines.splice(insertIdx, 0, ...crmBtn);
  fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', lines.join('\n'), 'utf8');
  console.log('CRM button added successfully');
} else {
  console.log('Could not find insertion point');
}
