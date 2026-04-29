const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

lines.forEach((l,i) => {
  if(l.includes('tab === "Projects"')) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100));
    lines.slice(i,i+20).forEach((ll,j) => 
      console.log(i+j+1, ll.replace(/[^\x20-\x7E]/g,"").substring(0,100))
    );
  }
});