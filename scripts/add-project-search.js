const fs = require('fs');
let c = fs.readFileSync('src/tabs/ProjectsTab.jsx', 'utf8');
const lines = c.split('\n');

// Find CONTROL BAR line
const ctrlIdx = lines.findIndex((l,i) => i > 1240 && l.includes('CONTROL BAR'));
console.log('Control bar at:', ctrlIdx + 1);

// Find the sort select line
const sortIdx = lines.findIndex((l,i) => i > ctrlIdx && l.includes('Relevance') && l.includes('option'));
console.log('Sort at:', sortIdx + 1);

// Find the div that wraps the sort select - go back a few lines
let sortWrapIdx = sortIdx - 1;
while (sortWrapIdx > sortIdx - 5 && !lines[sortWrapIdx].includes('<select')) sortWrapIdx--;
console.log('Sort select at:', sortWrapIdx + 1);

// Insert search bar before the control bar div
const searchBar = `        {/* Project Search */}
        <div style={{ position:"relative", marginBottom:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={projSearch||""}
            onChange={e => { setProjSearch(e.target.value); setProjectPage(1); }}
            placeholder="Search projects, developers, communities..."
            style={{ width:"100%", padding:"10px 14px 10px 36px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:"#E2E8F0", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}
          />
          {projSearch && <button type="button" onClick={()=>{ setProjSearch(""); setProjectPage(1); }} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#64748B", cursor:"pointer", fontSize:16 }}>×</button>}
        </div>`;

lines.splice(ctrlIdx, 0, searchBar);
fs.writeFileSync('src/tabs/ProjectsTab.jsx', lines.join('\n'), 'utf8');
console.log('Search bar inserted');
