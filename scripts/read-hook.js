const fs = require("fs");
const lines = fs.readFileSync("src/hooks/useCommunities.js", "latin1").split("\n");
lines.forEach((l, i) => console.log(i + 1, l));