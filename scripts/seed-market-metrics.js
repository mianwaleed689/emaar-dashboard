const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

const marketMetrics = [

  // ════════════════════════════════════════════════════════════════
  // MARKET KPIs — Full Year 2025 (DLD Official + Multi-Source Verified)
  // ════════════════════════════════════════════════════════════════

  {
    id: "total-market-value",
    metric: "Total Market Value",
    value: "AED 917B",
    change: "+20% YoY",
    numericValue: 917,
    category: "market",
    source: "DLD Full Year 2025",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone",
    note: "All transaction types (sales + mortgages + gifts). Sales-only: AED 682.5B across 214,912 transactions (DLD/Gulf News Jan 2026)"
  },
  {
    id: "total-transactions",
    metric: "Total Transactions",
    value: "270,000+",
    change: "+20% YoY",
    numericValue: 270000,
    category: "market",
    source: "DLD Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone",
    note: "All types. Residential sales only: 214,912 (DLD/Emarat Al Youm Jan 2026). 5th consecutive annual record."
  },
  {
    id: "off-plan-share",
    metric: "Off-Plan Share",
    value: "65%",
    change: "+2pp YoY",
    numericValue: 65,
    category: "market",
    source: "BetterHomes Dubai Residential FY2025 / Zawya Jan 2026",
    sourceUrl: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025",
    note: "132,000 off-plan transactions. Range: 62.6% (Zawya) to 65% (BetterHomes) depending on methodology. Q3 peak: 76% (Cavendish Maxwell)"
  },
  {
    id: "units-launched",
    metric: "Units Launched",
    value: "131,504",
    change: "228 developers (vs 163 in 2024)",
    category: "market",
    source: "DLD Oct 2025 — Roya International Feb 2026",
    sourceUrl: "https://royainternational.co.uk/pages/market-reports.php",
    note: "YTD October 2025. Developer count up 40% YoY."
  },
  {
    id: "mortgage-transactions",
    metric: "Mortgage Transactions",
    value: "50,974",
    change: "+22.5% YoY",
    numericValue: 50974,
    category: "market",
    source: "DLD Full Year 2025 — Zawya / Gulf News Jan 2026",
    sourceUrl: "https://www.zawya.com/en/press-release/research-and-studies/dubai-real-estate-market-hits-aed-6825bln-with-214-912-transactions-in-2025-lnxen66w",
    note: "Mortgage value: AED 179.26B. Mortgage share ~13% of transactions (cash buyers: 87%, Knight Frank Q1-Q3 2025)"
  },
  {
    id: "investor-base",
    metric: "Investor Base",
    value: "193,100",
    change: "+24% YoY",
    numericValue: 193100,
    category: "market",
    source: "DLD Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone",
    note: "129,600 new investors (+23%). Resident investors: 56.6% of total. Updated from H1 figure (94,700)."
  },
  {
    id: "price-growth",
    metric: "Price Growth",
    value: "+19.8%",
    change: "ValuStrat VPI Dec 2025",
    numericValue: 19.8,
    category: "market",
    source: "ValuStrat VPI December 2025 / REIDIN Residential Sales Price Index Dec 2025",
    sourceUrl: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025",
    note: "ValuStrat citywide weighted avg: AED 1,689/sqft (+19.8% YoY). REIDIN index: +12.88% YoY (villas +15.16%, apts +12.52%). Difference due to methodology."
  },
  {
    id: "women-investors",
    metric: "Women Investors",
    value: "AED 154B",
    change: "76,700 deals — +31% value YoY",
    category: "market",
    source: "DLD Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone",
    note: "Full year 2025. Updated from H1 figure (AED 73.2B, 34,792 transactions)."
  },
  {
    id: "avg-ppsf",
    metric: "Avg PPSF",
    value: "AED 1,863",
    change: "+6% YoY (full year avg)",
    numericValue: 1863,
    category: "market",
    source: "DXB Analytics / DLD Transaction Data Full Year 2025 — Mar 2026",
    sourceUrl: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026",
    note: "Full year 2025 average. Jan 2026: AED 1,976/sqft (+18% YoY). ValuStrat Dec 2025 weighted avg: AED 1,689/sqft (different methodology — hedonic index)."
  },
  {
    id: "avg-gross-yield",
    metric: "Avg Gross Yield",
    value: "6.55%",
    change: "Apts 7.03%, Villas 4.63%",
    numericValue: 6.55,
    category: "market",
    source: "REIDIN Residential Market Dec 2025",
    sourceUrl: "https://reidin.com",
    note: "REIDIN Dec 2025: 6.55% citywide. Global Property Guide Nov 2025: 6.66%. Bayut/Cavendish Maxwell: ~6.8%. Roya International: ~6.8% (Bayut H1 2025 + Cavendish Maxwell)."
  },
  {
    id: "price-cycle",
    metric: "Price Cycle",
    value: "56+ months",
    category: "market",
    source: "Property Monitor Dynamic Price Index Dec 2025",
    sourceUrl: "https://propertymonitor.com",
    note: "Longest unbroken growth cycle in Dubai freehold history. Avg +1.19% monthly."
  },
  {
    id: "pipeline-2026",
    metric: "2026 Pipeline",
    value: "~98K units",
    category: "market",
    source: "BetterHomes FY2025 Report / Knight Frank Q3 2025",
    sourceUrl: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025",
    note: "BetterHomes: ~98K units for 2026. Knight Frank best-case: 66K/yr (70% delivery rate assumption). ~366K total projected through 2028 (Cavendish Maxwell Q3 2025)."
  },
  {
    id: "population-target",
    metric: "Population Target",
    value: "5.8M by 2040",
    category: "market",
    source: "Dubai 2040 Urban Master Plan",
    sourceUrl: "https://dubailand.gov.ae",
    note: "Current population: ~4M (Aug 2025, Cavendish Maxwell). On track for 5M by late 2029 / early 2030."
  },
  {
    id: "nationalities",
    metric: "Nationalities",
    value: "193+",
    category: "market",
    source: "DLD Investor Base Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone"
  },
  {
    id: "cash-share",
    metric: "Cash Share",
    value: "87%",
    numericValue: 87,
    category: "market",
    source: "Knight Frank Q1-Q3 2025 / Roya International Feb 2026",
    sourceUrl: "https://royainternational.co.uk/pages/market-reports.php",
    note: "Knight Frank estimated 86% in Q1-Q3 2025. Roya: 87% for full year. Cash dominance driven by Golden Visa buyers and HNWI investors."
  },
  {
    id: "active-developers",
    metric: "Active Developers",
    value: "228",
    change: "vs 163 in 2024 (+40%)",
    numericValue: 228,
    category: "market",
    source: "DLD Oct 2025 — Roya International / DXB Analytics Feb 2026",
    sourceUrl: "https://royainternational.co.uk/pages/market-reports.php"
  },

  // ════════════════════════════════════════════════════════════════
  // ANNUAL CHART — Post-Covid Recovery 2020–2026
  // Source: DLD Official Annual Reports + Dubai Media Office
  // ════════════════════════════════════════════════════════════════

  // 2020: Covid year — DLD Annual Report 2020 / DXB Media Office Feb 2021
  // Total: 51,414 transactions, AED 175B
  {
    id: "annual-2020",
    year: "2020", transactions: 51414, value: 175,
    type: "annual", category: "marketChart",
    offPlanShare: 40, ppsf: null, yoyValueChange: null,
    note: "Covid year. V-shaped recovery in H2. Sales-only: AED 72.5B / 35,423 tx. 40% off-plan (lowest in decade).",
    source: "DLD Annual Report 2020 — DXB Media Office Feb 2021",
    sourceUrl: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai"
  },
  // 2021: Post-Covid boom, Expo 2020 catalyst — DLD Jan 2022
  // Total: 84,196 transactions, AED 300B (+72% value YoY)
  {
    id: "annual-2021",
    year: "2021", transactions: 84196, value: 300,
    type: "annual", category: "marketChart",
    offPlanShare: 40, ppsf: null, yoyValueChange: 71,
    note: "Post-Covid surge. Expo 2020 catalyst. Sales: AED 151B / 61,241 tx. Secondary dominated at 59.6%.",
    source: "DLD Annual Report 2021 — Dubai Media Office Jan 2022",
    sourceUrl: "https://dubailand.gov.ae/en/news-media/dld-2021-achieved-exceptional-results"
  },
  // 2022: First half-trillion year — Dubai Media Office Jan 2023
  // Total: 122,658 transactions, AED 528B (+76.5% value YoY)
  {
    id: "annual-2022",
    year: "2022", transactions: 122658, value: 528,
    type: "annual", category: "marketChart",
    offPlanShare: 56, ppsf: null, yoyValueChange: 76,
    note: "First year crossing AED 500B. Off-plan rising. +44.7% volume, +76.5% value YoY.",
    source: "DLD Annual Report 2022 — Dubai Media Office Jan 2023",
    sourceUrl: "https://www.uaemoments.com/amp/dubais-real-estate-transactions-hit-a-record-high-in-2022-553424.html"
  },
  // 2023: Strong growth continues — DLD / The National Feb 2024
  // Total: 166,400 transactions, AED 634B (+20% value, +36% volume)
  {
    id: "annual-2023",
    year: "2023", transactions: 166400, value: 634,
    type: "annual", category: "marketChart",
    offPlanShare: 59, ppsf: null, yoyValueChange: 20,
    note: "+36% volume, +20% value YoY. Sales prices +18%, rents +26% (Deloitte 2023 report).",
    source: "DLD Annual Report 2023 — The National / Dubai Media Office Feb 2024",
    sourceUrl: "https://www.thenationalnews.com/business/property/2024/02/07/dubais-real-estate-transactions-surge-17-to-record-16-million-in-2023/"
  },
  // 2024: Another record — DLD Official Jan 2025
  // Total: 226,000 transactions, AED 761B (+36% volume, +20% value)
  {
    id: "annual-2024",
    year: "2024", transactions: 226000, value: 761,
    type: "annual", category: "marketChart",
    offPlanShare: 66, ppsf: null, yoyValueChange: 20,
    note: "+36% volume, +20% value YoY. Off-plan: 66% of transactions (DLD Annual 2024). Sales: AED 522.1B / 180,900 tx.",
    source: "DLD Official Annual Report 2024 — Dubai Media Office Jan 2025",
    sourceUrl: "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024"
  },
  // 2025: All-time record — DLD / Dubai Media Office Jan 2026
  // Total: 270,000+ transactions, AED 917B (+20% value YoY)
  {
    id: "annual-2025",
    year: "2025", transactions: 270000, value: 917,
    type: "annual", category: "marketChart",
    offPlanShare: 65, ppsf: 1863, yoyValueChange: 20,
    note: "All-time record. 5th consecutive annual record. Sales: AED 682.5B / 214,912 tx. Avg PPSF: AED 1,863.",
    source: "DLD Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone"
  },
  // 2026 YTD (Jan 2026 only — DXB Analytics Mar 2026)
  {
    id: "annual-2026-ytd",
    year: "2026 YTD", transactions: 16919, value: 32,
    type: "annual", category: "marketChart",
    offPlanShare: 64, ppsf: 1976, yoyValueChange: 18,
    note: "January 2026 only. Avg PPSF: AED 1,976 (+18% YoY). Off-plan: 64%. Full year momentum on track to exceed 200K transactions.",
    source: "DXB Analytics / DLD January 2026 — Mar 2026",
    sourceUrl: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026"
  },

  // ════════════════════════════════════════════════════════════════
  // OVERVIEW KPIs — headline numbers for dashboard home
  // ════════════════════════════════════════════════════════════════
  {
    id: "kpi-total-market-value",
    metric: "Total Market Value", value: "AED 917B",
    change: "+20% YoY — DLD 2025",
    category: "overviewKpi",
    source: "DLD Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone"
  },
  {
    id: "kpi-total-transactions",
    metric: "Total Transactions", value: "270,000+",
    change: "+20% YoY — DLD 2025",
    category: "overviewKpi",
    source: "DLD Full Year 2025 — Dubai Media Office Jan 2026",
    sourceUrl: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone"
  },
  {
    id: "kpi-off-plan-share",
    metric: "Off-Plan Share", value: "65%",
    change: "+2pp — BetterHomes FY2025",
    category: "overviewKpi",
    source: "BetterHomes Dubai Residential FY2025",
    sourceUrl: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025"
  },
  {
    id: "kpi-units-launched",
    metric: "Units Launched", value: "131,504",
    change: "228 developers by Oct 2025",
    category: "overviewKpi",
    source: "DLD Oct 2025",
    sourceUrl: "https://royainternational.co.uk/pages/market-reports.php"
  },
];

(async () => {
  console.log(`\n${APPLY ? "⚡ APPLYING" : "🔍 DRY RUN"} — ${marketMetrics.length} docs to marketMetrics\n`);
  console.log("Categories:");
  const cats = {};
  marketMetrics.forEach(d => { cats[d.category] = (cats[d.category]||0)+1; });
  Object.entries(cats).forEach(([k,v]) => console.log(`  ${k}: ${v} docs`));

  console.log("\nKey upgrades vs old seed data:");
  console.log("  Total Market Value: AED 682.6B → AED 917B (all transaction types, full year)");
  console.log("  Total Transactions: 215,060 → 270,000+ (all types, full year)");
  console.log("  Women Investors: AED 73.2B (H1) → AED 154B (full year)");
  console.log("  Investor Base: 94,700 (H1) → 193,100 (full year)");
  console.log("  Chart: 2020-2026 YTD with transactions + value + off-plan share + PPSF");
  console.log("  New KPIs: Avg PPSF, Avg Gross Yield, Cash Share, Active Developers, Pipeline");

  if (!APPLY) {
    console.log("\nRun with --apply to write to Firestore.");
    process.exit(0);
  }

  const batch = db.batch();
  const ts = admin.firestore.FieldValue.serverTimestamp();
  marketMetrics.forEach(({ id, ...data }) => {
    batch.set(db.collection("marketMetrics").doc(id), { ...data, updatedAt: ts });
  });
  await batch.commit();
  console.log(`\n✅ Done. ${marketMetrics.length} docs written to marketMetrics collection.`);
  process.exit(0);
})();