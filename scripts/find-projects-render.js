const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Find ProjectsTab component render
lines.forEach((l,i)=>{
  if(l.includes("<ProjectsTab")) {
    console.log("ProjectsTab at line:", i+1);
    lines.slice(i,i+20).forEach((ll,j)=>
      console.log(i+j+1, ll.replace(/[^\x20-\x7E]/g,"").substring(0,100))
    );
  }
});