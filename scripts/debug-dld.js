const fs = require("fs");
const lines = fs.readFileSync("src/tabs/DLDVolumesTab.jsx", "latin1").split("\n");
lines.slice(364, 378).forEach((l, i) => console.log(365+i, l));