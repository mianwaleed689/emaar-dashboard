const fs = require('fs');
let c = fs.readFileSync('src/tabs/ProjectsTab.jsx', 'utf8');
const old = '{key:'+ String.fromCharCode(34) +'report'+ String.fromCharCode(34) +',label:'+ String.fromCharCode(34) +'Full Report'+ String.fromCharCode(34) +'}'; 
const neo = old + ',{key:'+ String.fromCharCode(34) +'dldSales'+ String.fromCharCode(34) +',label:'+ String.fromCharCode(34) +'DLD Sales'+ String.fromCharCode(34) +'}'; 
c = c.replace(old, neo);
console.log('Tab added:', c.includes('dldSales'));
fs.writeFileSync('src/tabs/ProjectsTab.jsx', c, 'utf8');
console.log('Done');