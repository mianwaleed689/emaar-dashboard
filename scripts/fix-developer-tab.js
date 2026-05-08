var fs=require("fs");
var c=fs.readFileSync("src/tabs/ProjectsTab.jsx","utf8");
var o="marginBottom:4 }}>{selectedProject.developer || ";
var n="marginBottom:4 }}>{selectedProject.developerActual || selectedProject.developer || ";
if(!c.includes(o)){console.log("ERROR: not found");process.exit(1);}
c=c.replace(o,n);
c=c.replace("Flagship Projects by {selectedProject.developer ","Flagship Projects by {selectedProject.developerActual || selectedProject.developer ");
fs.writeFileSync("src/tabs/ProjectsTab.jsx",c,"utf8");
console.log("Done");