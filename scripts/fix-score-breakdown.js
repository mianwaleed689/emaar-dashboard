const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// Fix Investment Score Breakdown to match actual scoring formula
const OLD_BREAKDOWN = `{[
                  {label:"Rental Yield",  score:grossY>=7?20:grossY>=6?15:grossY>=5?10:5, max:20},
                  {label:"Metro Access",  score:parseFloat(n.distMetro||99)<1?12:parseFloat(n.distMetro||99)<2?8:parseFloat(n.distMetro||99)<5?4:0, max:12},
                  {label:"PPSF Premium",  score:(n.avgPpsf||0)>=3000?8:(n.avgPpsf||0)>=2000?5:(n.avgPpsf||0)>=1000?2:0, max:8},
                  {label:"Waterfront",    score:n.hasBeach?8:0, max:8},
                  {label:"Amenities",     score:(n.hasMall?3:0)+(n.hasSchool?2:0)+(n.hasSports?2:0)+(n.hasPark?2:0), max:9},
                  {label:"Golden Visa",   score:n.goldenVisa?5:0, max:5},
                ].map((r,i)=>(`;

const NEW_BREAKDOWN = `{[
                  {label:"Rental Yield",  score:grossY>=9?20:grossY>=8?18:grossY>=7?15:grossY>=6?12:grossY>=5?8:5, max:20},
                  {label:"Metro Access",  score:parseFloat(n.distMetro||99)<0.5?12:parseFloat(n.distMetro||99)<1?10:parseFloat(n.distMetro||99)<2?7:parseFloat(n.distMetro||99)<3?5:parseFloat(n.distMetro||99)<5?2:0, max:12},
                  {label:"PPSF Premium",  score:(n.avgPpsf||0)>=4000?8:(n.avgPpsf||0)>=3000?7:(n.avgPpsf||0)>=2000?5:(n.avgPpsf||0)>=1500?3:(n.avgPpsf||0)>=1000?1:0, max:8},
                  {label:"Waterfront",    score:n.hasBeach?8:0, max:8},
                  {label:"Amenities",     score:(n.hasMall?3:0)+(n.hasSchool?2:0)+(n.hasMetro?3:0)+(n.hasSports?1:0), max:9},
                  {label:"Golden Visa",   score:n.goldenVisa?5:0, max:5},
                ].map((r,i)=>(`;

src = src.replace(OLD_BREAKDOWN, NEW_BREAKDOWN);
fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Fixed. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);