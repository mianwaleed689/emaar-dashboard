const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// Fix the template literal conflict on the totalProjects line
src = src.replace(
  `{n.totalProjects?\` · \${n.totalProjects} projects\`:""}`,
  `{n.totalProjects?" · "+n.totalProjects+" projects":""}`
);

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Fixed");