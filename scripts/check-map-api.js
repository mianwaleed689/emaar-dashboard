const fs = require("fs");
// Check CommunityMapTab for API key usage
const src = fs.readFileSync("src/tabs/CommunityMapTab.jsx", "latin1");
const lines = src.split("\n");
lines.forEach((l, i) => {
  if (l.includes("google") || l.includes("Google") || l.includes("API") || l.includes("key") || l.includes("VITE_")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});