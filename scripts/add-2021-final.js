const fs = require("fs");
const p = "src/tabs/MarketTab.jsx";
let s = fs.readFileSync(p, "latin1");

const lines = s.split("\n");
const idx = lines.findIndex(l => l.includes("DLD 2020 Annual"));
if (idx === -1) { console.log("Not found"); process.exit(1); }

// Insert 2021 line after 2020 line
const line2021 = `                      { name: "DLD 2021 \u0014 Post-Covid Boom", desc: "84,196 transactions \u00b7 AED 300B \u00b7 +72% value YoY \u00b7 Expo 2020 catalyst", url: "https://dubailand.gov.ae/en/news-media/dld-2021-achieved-exceptional-results-that-will-contribute-to-enabling-the-real-estate-sector-s-journey-towards-the-next-50-years/", tag: "DLD 2021" },`;

lines.splice(idx + 1, 0, line2021);
fs.writeFileSync(p, lines.join("\n"), "latin1");
console.log("Done. Total lines:", lines.length);