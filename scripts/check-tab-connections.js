const fs = require("fs");
const tabs = [
  "OverviewTab","MarketTab","DLDVolumesTab","PriceHistoryTab","NeighbourhoodsTab",
  "LaunchCalendarTab","ProjectsTab","MapTab","HandoverTab","ServiceChargesTab",
  "YieldsTab","STRvsLTRTab","MortgageTab","InvestmentScoreTab","FlipTab",
  "GoldenVisaTab","DXBEstimateTab","PortfolioTab","MyLeadsTab","TeamTab",
  "PipelineTab","ListingsTab","AgencyTab","ComplianceTab","BankingTab",
  "CurrencyTab","CompetitorsTab","RiskTab","FinancialsTab","DevPortalTab",
  "DeveloperHealthTab","IntelligenceTab","MarketingTab"
];

const results = [];
tabs.forEach(tab => {
  const file = "src/tabs/"+tab+".jsx";
  try {
    const src = fs.readFileSync(file, "latin1");
    const hasNbhd     = src.includes("liveNeighbourhoods")||src.includes("getCommunityData");
    const hasDLD      = src.includes("dldTransactions")||src.includes("liveDLDVolumes");
    const hasCommunity= src.includes("p.community")||src.includes("n.community");
    const hasProjects = src.includes("liveProjects")||src.includes("activeProjects");
    const hasLeads    = src.includes("myLeads")||src.includes("leads");
    const lines       = src.split("\n").length;
    results.push({tab, hasNbhd, hasDLD, hasCommunity, hasProjects, hasLeads, lines});
  } catch(e) {
    results.push({tab, missing:true});
  }
});

console.log("TAB".padEnd(28),"NBHD  DLD   COMM  PROJ  LEADS  LINES");
console.log("-".repeat(75));
results.forEach(r => {
  if(r.missing) { console.log(r.tab.padEnd(28), "FILE MISSING"); return; }
  const yn = v => v?"YES  ":"NO   ";
  console.log(
    r.tab.padEnd(28),
    yn(r.hasNbhd), yn(r.hasDLD), yn(r.hasCommunity),
    yn(r.hasProjects), yn(r.hasLeads), r.lines
  );
});

const connected = results.filter(r=>!r.missing&&r.hasNbhd).length;
const missing   = results.filter(r=>r.missing).length;
console.log("\nConnected to Neighbourhoods:", connected+"/"+tabs.length);
console.log("Missing files:", missing);