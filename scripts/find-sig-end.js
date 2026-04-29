const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find the closing }) of function signature — look for line with just }) after line 219
let insertLine = -1;
for(let i=219; i<260; i++) {
  const l = lines[i].trim();
  if(l==="})" || l==="}){" || l.startsWith("}) {") || l.startsWith("})  {")) {
    insertLine = i;
    break;
  }
}
console.log("Closing )} at line:", insertLine+1);
if(insertLine>-1) {
  lines.slice(insertLine-2, insertLine+5).forEach((l,j)=>
    console.log(insertLine-1+j, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
  );
}