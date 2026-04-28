const fs = require("fs");
const src = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
console.log("Admin panel size:", src.split("\n").length, "lines");

// Check which tabs actually have content vs empty/placeholder
const tabs = ["analytics","auditlog","billing","cancellation","data","data_health","digest","dxbsales","eibor","filter_schema","leads","market_intelligence","notifications","orgs","overview","platform_settings","pricing_plans","referral","revenue","support","tabcontrol","users"];

tabs.forEach(tab => {
  const idx = src.indexOf(`tab === "${tab}"`);
  if (idx > -1) {
    // Get ~200 chars after the tab check to see if there is real content
    const content = src.substring(idx, idx+300).replace(/[^\x20-\x7E]/g,"");
    const hasRealContent = content.length > 100;
    console.log(tab.padEnd(25), hasRealContent ? "HAS CONTENT" : "EMPTY/PLACEHOLDER");
  } else {
    console.log(tab.padEnd(25), "NOT FOUND");
  }
});