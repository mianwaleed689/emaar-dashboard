# DXB ANALYTICS - SESSION 17 HANDOFF
Generated: 2026-04-29

## HOW TO CONTINUE
Say: "Read this file and continue DXB Analytics Session 17"
Repo: github.com/mianwaleed689/emaar-dashboard
Deploy: Cloudflare Pages (auto on git push)
Firebase: dxb-analytics (Google Cloud)
Maps API: AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw

## POWERSHELL HELPER
function Save-UTF8($path, $content) {
  [System.IO.File]::WriteAllText("$PWD\$path", $content, [System.Text.Encoding]::UTF8)
  Write-Host "Saved safely: $path"
}

## STACK
React 19.2 + Vite 5.4 + Firebase 12.11
Firestore collections: projects, neighbourhoodScores, developers,
  communityLookup, liveMarketData, dldVolumes, neighbourhoods

## PLATFORM STATS (Session 16 end)
Projects:     1,663 total | 1,515 active | 148 archived
Developers:   2,034 in Firestore (verified+published)
Communities:  281 in neighbourhoodScores
Tabs:         25/33 connected

## DATA COMPLETENESS (all 1,515 projects)
nearestMetro:    1515/1515  100%
grossYield:      1501/1515   99% (1,312 real DLD data)
ppsf:            1501/1515   99%
priceMin:        1501/1515   99% (ESTIMATED: comm PPSF x 700sqft)
nearestMall:     1479/1515   98%
nearestHospital: 1479/1515   98%
serviceCharge:   1479/1515   98%
developerTier:   1443/1515   95%
coordinates:     1501/1515   99%

## DATA SOURCES USED
1. DLD Real_Estate_Projects_2026-04-29.csv -> 1,569 projects
2. DLD transactions-2026-04-29.csv -> 61,162 sales -> yield/PPSF
3. DLD Owners_Association_Service_Charges -> service charges
4. DLD Registered_Freehold_Real_Estate_Units -> unit sizes
5. DLD Rent_Contracts_2026-04-29.csv -> real rental yields
6. DLD Residential_Sale_Index -> price index
7. Manual research -> 71 verified communities
8. Google Maps API -> distances

## WHAT GOLF GRAND HAS THAT OTHERS DONT
Golf Grand = reference template (manually researched)
Missing for 1,514 DLD projects:
  - priceMin/Max (REAL) -> need Property Finder/Bayut
  - paymentPlan -> need developer websites
  - unitBreakdown (1BR/2BR/3BR sizes+counts) -> need DLD units login
  - sizeMin/sizeMax (exact) -> need DLD units login
  - constructionStart, mainContractor -> need research
  - nearestSchool (15% missing) -> need research

## CURRENT BUGS
1. Community Intel tab "No community data" -> JUST FIXED
   liveNeighbourhoods prop added to ProjectsTab line 4589
   Deploy pending - check after 2 min

2. Developer filter - searchable dropdown implemented
   showDevDrop states at line 249 inside ProjectsTab

## TABS STATUS (25/33 connected)
WORLD CLASS REBUILT:
  NeighbourhoodsTab  630L  world class
  LaunchCalendarTab  486L  world class v4 (rich cards)
  HandoverTab        366L  world class
  CommunityMapTab    338L  world class
  YieldsTab          281L  world class
  STRvsLTRTab        238L  world class
  InvestmentScoreTab 191L  world class
  DXBEstimateTab     181L  world class
  GoldenVisaTab      179L  world class
  ServiceChargesTab  140L  world class

CONNECTED (not rebuilt):
  Overview, Market, DLDVolumes, PriceHistory, Projects
  Mortgage, Flip, Portfolio, MyLeads, Pipeline
  Listings, Risk, DeveloperHealth, Intelligence, Marketing

STANDALONE (8 - need work):
  Agency, Compliance, Banking, Currency
  DevPortal, Competitors, Financials, Team

## SESSION 17 PRIORITIES (IN ORDER)
1. VERIFY Community Intel tab works after deploy
2. Projects tab - community filter searchable (same as dev filter)
3. Firestore rules - communityLookup added (already done)
4. DATA: Register Dubai Pulse login -> download full units CSV
5. DATA: Register Property Finder agency -> real prices
6. REBUILD: Portfolio tab world class
7. REBUILD: Pipeline tab world class
8. REBUILD: Listings tab world class
9. Admin Community Data Editor
10. Cloud Function auto-sync on project write

## KEY SCRIPTS
scripts/platform-stats.js          -> show all stats
scripts/compare-projects.js        -> Golf Grand vs DLD comparison
scripts/final-enrichment.js        -> enrich all projects
scripts/sync-communities.js        -> update supply risk
scripts/enrich-from-dld-files.js   -> enrich from DLD CSVs
scripts/seed-developers-communities.js -> seed devs+comms

## FIRESTORE RULES
communityLookup added. All collections readable by isAuthed()
Rules file: firebase console -> dxb-analytics -> Firestore Rules

## IMPORTANT FILES
src/tabs/ProjectsTab.jsx           2320L - has getCommunityData at line 256
src/tabs/LaunchCalendarTab.jsx     486L
src/tabs/HandoverTab.jsx           366L
src/pages/EmaarDashboardV2.jsx     ~6200L
  - ProjectsTab render at line 4561
  - liveNeighbourhoods added at line 4589

## DEVELOPER NAMES (12 clean)
Dubai Properties 370, Nakheel 321, Emaar 242
Jumeirah Village 159, Meydan 128, Majid Al Futtaim 79
Dubai Airports Corp 72, Dubai Sports City 70
Damac 63, TECOM 51, Dubai Investments 39, Sobha 15

## COMMUNITY NAMES (37 branded)
JVC 161, Tilal Al Ghaf 151, Dubailand 122
Emaar South 113, Palm Deira 103, Dubai Sports City 80
Jebel Ali 77, JVT 54, Business Bay 49...

## DATA PIPELINE (how enrichment works)
Project.community -> lookup neighbourhoodScores ->
  copy yield, PPSF, metro, mall, hospital, school,
  service charge, golden visa, supply risk, coordinates
Project.developer -> lookup developers collection ->
  copy tier, founded, onTime rate, specialty

## SCORING FORMULA
30% Gross Yield (DLD Rent Contracts 2026)
25% Transaction Liquidity (DLD transactions)
20% PPSF Value (DLD 2026)
15% Supply Risk (project pipeline sync)
10% Metro Access (Google Maps)