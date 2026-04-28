const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

src = src
  .replace('label=" Metro"',       'label="Metro"')
  .replace('label=" Beach"',       'label="Beach"')
  .replace('label=" Sports"',      'label="Sports"')
  .replace('label=" Golden Visa"', 'label="Golden Visa"')
  .replace('Sort: AZ',             'Sort: A-Z')
  .replace('>Sort: Score<',  '>Best Score<')
  .replace('>Sort: Yield<',  '>Highest Yield<')
  .replace('>Sort: PPSF<',   '>Highest PPSF<')
  .replace('>Sort: Near Airport<', '>Near Airport<')
  .replace('>All Communities<',    '>All Areas<')
  .replace('>All Yields<',         '>Any Yield<')
  .replace('>7%+ High Yield<',     '>7%+ Yield<')
  .replace('>6%+ Good Yield<',     '>6%+ Yield<')
  .replace('>5%+ Mid Yield<',      '>5%+ Yield<');

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Fixed. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);