const fs = require("fs");
let src = fs.readFileSync("src/data/countries.js", "utf8");

// Add missing countries before the closing ];
const missing = `  { code:"PS", flag:"🇵🇸", name:"Palestine",          nationality:"Palestinian",     dial:"+970" },
  { code:"XK", flag:"🇽🇰", name:"Kosovo",              nationality:"Kosovar",         dial:"+383" },
  { code:"VA", flag:"🇻🇦", name:"Vatican City",         nationality:"Vatican",         dial:"+39"  },
  { code:"EH", flag:"🇪🇭", name:"Western Sahara",       nationality:"Sahrawi",         dial:"+212" },
  { code:"CW", flag:"🇨🇼", name:"Curacao",              nationality:"Curacaoan",       dial:"+599" },
  { code:"MO", flag:"🇲🇴", name:"Macau",                nationality:"Macanese",        dial:"+853" },
  { code:"HK", flag:"🇭🇰", name:"Hong Kong",            nationality:"Hong Konger",     dial:"+852" },`;

src = src.replace("];", missing + "\n];");

// Verify
const matches = src.match(/{ code:"/g);
console.log("Total countries now:", matches ? matches.length : 0);

fs.writeFileSync("src/data/countries.js", src, "utf8");
console.log("Done");