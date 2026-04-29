const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Find mortgage tab render and add liveNeighbourhoods
const mortSearch = `liveMortgageRates={liveMortgageRates}`;
if(dash.includes(mortSearch)) {
  dash = dash.replace(mortSearch, 
    mortSearch+`\n              liveNeighbourhoods={liveNeighbourhoods}`);
  console.log("Mortgage wired");
}

// Find flip tab render
const flipSearch = `flipBuyPrice={flipBuyPrice}`;
if(dash.includes(flipSearch)) {
  dash = dash.replace(flipSearch,
    flipSearch+`\n              liveNeighbourhoods={liveNeighbourhoods}`);
  console.log("Flip wired");
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");