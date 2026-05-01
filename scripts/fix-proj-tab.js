const fs=require('fs');
const q=String.fromCharCode(34);
let c=fs.readFileSync('src/pages/EmaarDashboardV2.jsx','utf8');
const old='const [projDetailTab, setProjDetailTab] = useState('+q+'Overview'+q+');';
const neo='const [projDetailTab, setProjDetailTab] = useState(()=>{try{return sessionStorage.getItem('+q+'dxb_proj_tab'+q+')||('+q+'Overview'+q+');}catch(e){return '+q+'Overview'+q+';}});';
if(c.includes(old)){c=c.replace(old,neo);fs.writeFileSync('src/pages/EmaarDashboardV2.jsx',c,'utf8');console.log('Done');}
else{console.log('Not found');}