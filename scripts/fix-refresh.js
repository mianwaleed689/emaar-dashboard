const fs=require('fs');
let c=fs.readFileSync('src/pages/EmaarDashboardV2.jsx','utf8');
const lines=c.split('\n');
const idx=lines.findIndex(l=>l.includes('sessionStorage.setItem') && l.includes('dxb_active_tab'));
console.log('found at:',idx+1);
lines.splice(idx+1,0,'  if(selectedProject) try{sessionStorage.setItem('+String.fromCharCode(34)+'dxb_selected_project'+String.fromCharCode(34)+',selectedProject.id||selectedProject.projectNumber||String.fromCharCode(34)+String.fromCharCode(34));}catch(e){}',
'  if(typeof projDetailTab!=='+String.fromCharCode(34)+'undefined'+String.fromCharCode(34)+') try{sessionStorage.setItem('+String.fromCharCode(34)+'dxb_proj_tab'+String.fromCharCode(34)+',projDetailTab);}catch(e){}');
fs.writeFileSync('src/pages/EmaarDashboardV2.jsx',lines.join('\n'),'utf8');
console.log('Done');