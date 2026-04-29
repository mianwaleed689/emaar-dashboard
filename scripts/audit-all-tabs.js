const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

const tabs = [
  "Overview","Market","DLD Volumes","Price History","Neighbourhoods",
  "Launch Calendar","Projects","Map","Handover","Service Charges",
  "Yields","STR vs LTR","Mortgage","Investment Score","Flip",
  "Golden Visa","DXB Estimate","Portfolio","My Leads","Team",
  "Pipeline","Listings","Agency","Compliance","Banking",
  "Currency","Competitors","Risk","Financials","Dev Portal",
  "Developer Health","Intelligence","Marketing"
];

tabs.forEach(tab => {
  const file = "src/tabs/"+tab.replace(/ /g,"")+"Tab.jsx";
  const altFile = tab==="Map"?"src/tabs/CommunityMapTab.jsx":
                  tab==="STR vs LTR"?"src/tabs/STRvsLTRTab.jsx":file;
  try {
    const src = fs.readFileSync(altFile,"latin1");
    const lines = src.split("\n").length;
    const hasSeed = src.includes("SEED_") || src.includes("seed_");
    const hasReal = src.includes("liveNeighbourhoods")||src.includes("liveProjects")||src.includes("liveDLD");
    const hasEmpty = src.includes("coming soon")||src.includes("Coming Soon")||src.includes("placeholder");
    const status = hasEmpty?"PLACEHOLDER":hasSeed&&!hasReal?"SEED DATA":hasReal?"HAS REAL DATA":"UNKNOWN";
    console.log(tab.padEnd(20), lines+"L", status.padEnd(15));
  } catch(e) {
    console.log(tab.padEnd(20), "FILE MISSING");
  }
});