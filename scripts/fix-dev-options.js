const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Replace devOptions to use allDevelopers collection
src = src.replace(
  `const devOptions = ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projM`,
  `// Use allDevelopers from Firestore for complete developer list
            const devOptions = allDevelopers && allDevelopers.length > 0
              ? ["All", ...allDevelopers
                  .filter(d => d.name && d.verified !== false)
                  .sort((a,b) => {
                    const ta = a.tier===1?0:a.tier===2?1:a.tier===3?2:3;
                    const tb = b.tier===1?0:b.tier===2?1:b.tier===3?2:3;
                    if(ta!==tb) return ta-tb;
                    return (b.totalProjects||0)-(a.totalProjects||0);
                  })
                  .map(d => d.name)
                ]
              : ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projM`
);

// Find closing of the original devOptions line and add closing bracket
src = src.replace(
  `const dbByName = new Map();`,
  `)];\n            const dbByName = new Map();`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
console.log("Done");