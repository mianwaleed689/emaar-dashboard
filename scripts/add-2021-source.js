const fs = require("fs");
const p = "src/tabs/MarketTab.jsx";
let s = fs.readFileSync(p, "latin1");

s = s.replace(
  `{ name: "DLD 2020 Annual — Media Office", desc: "51,414 transactions · AED 175B · Covid year recovery", url: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai", tag: "DLD 2020" },`,
  `{ name: "DLD 2020 Annual — Media Office", desc: "51,414 transactions · AED 175B · Covid year recovery", url: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai", tag: "DLD 2020" },
                      { name: "DLD 2021 — Post-Covid Boom", desc: "84,196 transactions · AED 300B · +72% value YoY · Expo 2020 catalyst", url: "https://dubailand.gov.ae/en/news-media/dld-2021-achieved-exceptional-results-that-will-contribute-to-enabling-the-real-estate-sector-s-journey-towards-the-next-50-years/", tag: "DLD 2021" },`
);

fs.writeFileSync(p, s, "latin1");
console.log("Done. Total lines:", s.split("\n").length);