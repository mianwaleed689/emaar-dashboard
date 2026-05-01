const fs=require('fs');
const q=String.fromCharCode(34);
let c=fs.readFileSync('src/tabs/ProjectsTab.jsx','utf8');
const t1='const [sidebarSearch, setSidebarSearch] = useState('+q+q+');';
c=c.replace(t1, t1+'\n  const [projectPage, setProjectPage] = useState(1);\n  const PROJECTS_PER_PAGE = 30;');
c=c.replace(
  'filtered.map((p,i) => <ProjectCard key={p.id||i} p={p} />)',
  'filtered.slice(0,projectPage*PROJECTS_PER_PAGE).map((p,i) => <ProjectCard key={p.id||i} p={p} />)'
);
const loadBtn='<div style={{textAlign:'+q+'center'+q+',marginTop:24,paddingBottom:20}}>{'+
  'filtered.length>projectPage*PROJECTS_PER_PAGE&&<button type='+q+'button'+q+' onClick={()=>setProjectPage(p=>p+1)} '+
  'style={{padding:'+q+'10px 30px'+q+',borderRadius:8,border:'+q+'1px solid rgba(212,168,67,0.3)'+q+',background:'+q+'rgba(212,168,67,0.08)'+q+',color:'+q+'#D4A843'+q+',fontSize:12,fontWeight:700,cursor:'+q+'pointer'+q+'}}>Load More ({filtered.length-projectPage*PROJECTS_PER_PAGE} remaining)</button>}</div>';
c=c.replace('</div>\n        )}', loadBtn+'\n</div>\n        )}');
fs.writeFileSync('src/tabs/ProjectsTab.jsx',c,'utf8');
console.log('Done. Has projectPage:',c.includes('projectPage'));