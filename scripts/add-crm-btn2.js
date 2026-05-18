const fs = require('fs');
let c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const lines = c.split('\n');

const btn = [
  '              {group.id==="crm"&&!sidebarSearch&&(',
  '                <button type="button" onClick={()=>setShowCRM(true)} style={{',
  '                  display:"flex",alignItems:"center",gap:8,width:"100%",',
  '                  padding:"7px 10px",margin:"3px 0 6px",',
  '                  background:"linear-gradient(135deg,rgba(212,168,67,0.12),rgba(0,191,165,0.08))",',
  '                  border:"1px solid rgba(212,168,67,0.25)",borderRadius:8,',
  '                  color:"#D4A843",fontSize:11,fontWeight:700,cursor:"pointer",',
  '                  fontFamily:"Outfit,sans-serif",',
  '                }}>',
  '                  <span>⚡</span>',
  '                  <span>Open Full CRM</span>',
  '                  <span style={{marginLeft:"auto",fontSize:9,background:"rgba(212,168,67,0.2)",padding:"1px 5px",borderRadius:4}}>NEW</span>',
  '                </button>',
  '              )}',
];

lines.splice(4307, 0, ...btn);
fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', lines.join('\n'), 'utf8');
console.log('CRM button added. showCRM references:', (lines.join('\n').match(/showCRM/g)||[]).length);
