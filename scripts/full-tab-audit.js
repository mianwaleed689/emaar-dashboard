const fs = require("fs");
const tabs = [
  {file:"OverviewTab",      priority:"HIGH",   needs:"community top picks, yield summary"},
  {file:"MarketTab",        priority:"HIGH",   needs:"price trends by community"},
  {file:"DLDVolumesTab",    priority:"MED",    needs:"volume by community"},
  {file:"PriceHistoryTab",  priority:"HIGH",   needs:"PPSF history by community"},
  {file:"LaunchCalendarTab",priority:"HIGH",   needs:"community intel per launch"},
  {file:"HandoverTab",      priority:"MED",    needs:"community context per project"},
  {file:"ServiceChargesTab",priority:"HIGH",   needs:"service charge by community"},
  {file:"InvestmentScoreTab",priority:"HIGH",  needs:"real scores from neighbourhoodScores"},
  {file:"GoldenVisaTab",    priority:"HIGH",   needs:"GV eligible communities list"},
  {file:"MortgageTab",      priority:"MED",    needs:"community PPSF for calculations"},
  {file:"FlipTab",          priority:"MED",    needs:"price appreciation by community"},
  {file:"DXBEstimateTab",   priority:"HIGH",   needs:"community PPSF for valuation"},
  {file:"MyLeadsTab",       priority:"HIGH",   needs:"suggest community per lead budget"},
  {file:"STRLTRTab",        priority:"HIGH",   needs:"STR vs LTR by community (MISSING)"},
  {file:"MapTab",           priority:"HIGH",   needs:"community pins + popups (MISSING)"},
];

console.log("TAB AUDIT REPORT\n");
tabs.forEach(t => {
  try {
    const src = fs.readFileSync("src/tabs/"+t.file+".jsx","latin1");
    const lines = src.split("\n").length;
    const hasSeed = src.includes("SEED_") || src.includes("seedData") || src.includes("hardcoded");
    const hasReal = src.includes("liveNeighbourhoods") || src.includes("neighbourhoodScores");
    const hasEmpty = src.includes("SmartEmptyState") || src.includes("coming soon") || src.includes("placeholder");
    
    console.log(`[${t.priority}] ${t.file}`);
    console.log(`  Lines: ${lines} | SeedData: ${hasSeed} | RealData: ${hasReal} | HasEmpty: ${hasEmpty}`);
    console.log(`  Needs: ${t.needs}`);
    console.log();
  } catch(e) {
    console.log(`[${t.priority}] ${t.file} — FILE MISSING`);
    console.log(`  Needs: ${t.needs}`);
    console.log();
  }
});