const fs = require("fs");
const lines = fs.readFileSync("src/tabs/DLDVolumesTab.jsx", "latin1").split("\n");
lines.slice(238, 262).forEach((l, i) => console.log(239+i, l));