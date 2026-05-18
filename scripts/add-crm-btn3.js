const fs = require('fs');
let c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const lines = c.split('\n');

// Find the filteredTabs.map line (4309) — insert CRM button before it
const mapIdx = lines.findIndex((l, i) => i > 4305 && l.includes('filteredTabs.map(t =>'));
console.log('filteredTabs.map at line:', mapIdx + 1);

const crmBtn = [
  '                      {group.id === "crm" && !sidebarSearch && (',
  '                        <button type="button" onClick={() => setShowCRM(true)} style={{',
  '                          display:"flex", alignItems:"center", gap:6, width:"100%",',
  '                          padding:"7px 10px", marginBottom:6,',
  '                          background:"linear-gradient(135deg,rgba(212,168,67,0.12),rgba(0,191,165,0.08))",',
  '                          border:"1px solid rgba(212,168,67,0.25)", borderRadius:8,',
  '                          color:"#D4A843", fontSize:11, fontWeight:700, cursor:"pointer",',
  '                          fontFamily:"Outfit,sans-serif",',
  '                        }}>',
  '                          <span>⚡</span>',
  '                          <span>Open Full CRM</span>',
  '                          <span style={{marginLeft:"auto",fontSize:9,background:"rgba(212,168,67,0.2)",padding:"1px 5px",borderRadius:4}}>NEW</span>',
  '                        </button>',
  '                      )}',
];

if (mapIdx > 0) {
  lines.splice(mapIdx, 0, ...crmBtn);
  fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', lines.join('\n'), 'utf8');
  console.log('CRM button inserted before filteredTabs.map');
} else {
  console.log('Could not find filteredTabs.map');
}
