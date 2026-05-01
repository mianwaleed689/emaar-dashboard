/* ввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђ
   DXB ANALYTICS вв‚¬вЂќ RESEARCH-BASED SEED DATA
   Extracted from EmaarDashboardV2.jsx
   All figures sourced from official publications вв‚¬вЂќ listed per dataset
   Seed data displays until real Firestore data is imported from Admin
   isSeedData: true flag marks all seed entries for easy identification
   ввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђ */

const SEED_DATA = {

  /* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ MARKET TAB ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
     Sources: DLD Annual Report 2025, DXB Interact Jan 2026,
     Property Monitor DPI Dec 2025, REIDIN Residential Index Dec 2025
     URL: dubailand.gov.ae/en/open-data/research/annual-report-real-estate-sector-performance-2024
  ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
  market: [
    { metric: "Total Market Value",       value: "AED 682.6B",  change: "+21% YoY",  numericValue: 682.6, isSeedData: true, source: "DLD / DXB Interact Jan 2026" },
    { metric: "Total Transactions",       value: "215,060",     change: "+19% YoY",  numericValue: 215060, isSeedData: true, source: "DLD Annual Report 2025" },
    { metric: "Off-Plan Share",           value: "63%",         change: "+3pp YoY",  numericValue: 63, isSeedData: true, source: "DLD / Property Monitor 2025" },
    { metric: "Units Launched",           value: "131,504",     change: "532 projects", isSeedData: true, source: "DLD Oct 2025" },
    { metric: "Mortgage Transactions",    value: "50,974",      change: "+22.5% YoY", isSeedData: true, source: "DLD 2025" },
    { metric: "Investor Base",            value: "94,700",      change: "+26% YoY",  isSeedData: true, source: "DLD H1 2025" },
    { metric: "Price Growth",             value: "+19.8%",      change: "REIDIN Index Dec 2025", isSeedData: true, source: "REIDIN Residential Sales Price Index" },
    { metric: "Women Investors",          value: "AED 73.2B",   change: "34,792 transactions", isSeedData: true, source: "DLD H1 2025" },
    { metric: "Population Target",        value: "5.8M by 2040", isSeedData: true, source: "Dubai 2040 Urban Master Plan" },
    { metric: "Price Cycle",              value: "56+ months",  isSeedData: true, source: "Property Monitor DPI Dec 2025" },
    { metric: "2026 Pipeline",            value: "~120K units", isSeedData: true, source: "Knight Frank / CW Core 2025" },
    { metric: "Nationalities",            value: "193+",        isSeedData: true, source: "DLD Investor Base Report 2025" },
    { metric: "Off-Plan Share",           numericValue: 63,     isSeedData: true },
    { metric: "Cash Share",               numericValue: 55,     isSeedData: true, source: "DLD Mortgage Report 2025" },
    { metric: "Active Developers", value: "50+", change: "RERA registered В· DLD approved", isSeedData: true, source: "RERA Registry 2026" },
    { metric: "REIDIN Growth",      value: "+19.8%", change: "Residential Sales Price Index Dec 2025", isSeedData: true, source: "REIDIN Dec 2025" },
    { metric: "Price Growth YoY",   value: "+19.8%", change: "Dec 2025", isSeedData: true, source: "REIDIN 2025" },
    { metric: "Mortgage Share",           numericValue: 45,     isSeedData: true },
    /* Historical sales chart data */
    { year: "2020", value: 175,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2021", value: 270,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2022", value: 407,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2023", value: 520,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2024", value: 761,  type: "annual", isSeedData: true, source: "DLD Annual Report 2024" },
    { year: "2025", value: 919,  type: "annual", isSeedData: true, source: "DLD / DXB Interact Jan 2026" },
  ],

  /* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ DLD VOLUMES TAB ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
     Sources: DXBAnalytics.com Community Volume Report Feb 2026,
     DLD Direct Database Query, Property Monitor 2025
     URL: dxbanalytics.com/blog/dubai-property-transaction-volume-2026
  ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
  dldVolumes: [
    { community: "Jumeirah Village Circle",   type: "Apartment", transactions: 18782, avgPpsf: 1180, volume: 9800000000,  change: 17,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Business Bay",              type: "Apartment", transactions: 12450, avgPpsf: 2050, volume: 14200000000, change: 8,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai Marina",              type: "Apartment", transactions: 11200, avgPpsf: 2280, volume: 15800000000, change: 6,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Downtown Dubai",            type: "Apartment", transactions: 8900,  avgPpsf: 3100, volume: 18200000000, change: 12,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai Hills Estate",        type: "Mixed",     transactions: 8200,  avgPpsf: 1850, volume: 12400000000, change: 22,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Sobha Hartland",            type: "Mixed",     transactions: 6800,  avgPpsf: 2100, volume: 9800000000,  change: 31,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai Creek Harbour",       type: "Apartment", transactions: 6400,  avgPpsf: 1620, volume: 7200000000,  change: 45,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Palm Jumeirah",             type: "Villa",     transactions: 5200,  avgPpsf: 4800, volume: 28600000000, change: 15,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Mohammed Bin Rashid City",  type: "Mixed",     transactions: 5100,  avgPpsf: 1950, volume: 8900000000,  change: 28,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Arabian Ranches",           type: "Villa",     transactions: 4800,  avgPpsf: 1380, volume: 6200000000,  change: 20,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Jumeirah Lake Towers",      type: "Apartment", transactions: 4600,  avgPpsf: 1420, volume: 4800000000,  change: 5,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Al Furjan",                 type: "Mixed",     transactions: 4200,  avgPpsf: 1080, volume: 3200000000,  change: 14,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai South",               type: "Mixed",     transactions: 4100,  avgPpsf: 850,  volume: 2900000000,  change: 38,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "International City",        type: "Apartment", transactions: 3800,  avgPpsf: 580,  volume: 1200000000,  change: 9,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Tilal Al Ghaf",             type: "Villa",     transactions: 3600,  avgPpsf: 1650, volume: 5800000000,  change: 52,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
  ],

  /* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ PRICE HISTORY TAB ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
     Sources: ValuStrat VPI Q4 2025, REIDIN Residential Index Dec 2025,
     Property Monitor DPI 2025, Knight Frank Dubai Residential Q1 2025
     URL: reidin.com | valustrat.com/vpi
  ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
  priceHistory: [
    /* 5-year PPSF trend вв‚¬вЂќ Dubai overall apartment average */
    { period: "2020", ppsf: 1050, offPlanPpsf: 980,  secondaryPpsf: 1100, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2021", ppsf: 1080, offPlanPpsf: 1020, secondaryPpsf: 1140, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2022", ppsf: 1250, offPlanPpsf: 1180, secondaryPpsf: 1310, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2023", ppsf: 1380, offPlanPpsf: 1290, secondaryPpsf: 1460, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2024", ppsf: 1600, offPlanPpsf: 1520, secondaryPpsf: 1680, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2025", ppsf: 1840, offPlanPpsf: 1760, secondaryPpsf: 1920, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    /* Community-level momentum */
    { community: "Dubai Hills Estate",   ppsf: 1850, change6m: 8.2,  change1y: 22.1, change3y: 58.4, change5y: 89.2, type: "priceHistory", isSeedData: true, source: "Knight Frank / REIDIN 2025" },
    { community: "Downtown Dubai",       ppsf: 3100, change6m: 4.1,  change1y: 12.3, change3y: 38.6, change5y: 71.4, type: "priceHistory", isSeedData: true, source: "Property Monitor DPI" },
    { community: "Dubai Marina",         ppsf: 2280, change6m: 3.8,  change1y: 9.8,  change3y: 31.2, change5y: 64.8, type: "priceHistory", isSeedData: true, source: "REIDIN Dec 2025" },
    { community: "JVC",                  ppsf: 1180, change6m: 6.4,  change1y: 17.2, change3y: 48.9, change5y: 82.1, type: "priceHistory", isSeedData: true, source: "Property Monitor / Bayut 2025" },
    { community: "Palm Jumeirah",        ppsf: 4800, change6m: 5.2,  change1y: 14.8, change3y: 42.3, change5y: 94.6, type: "priceHistory", isSeedData: true, source: "Knight Frank Q1 2025" },
    { community: "Business Bay",         ppsf: 2050, change6m: 3.1,  change1y: 8.4,  change3y: 29.7, change5y: 58.9, type: "priceHistory", isSeedData: true, source: "REIDIN Dec 2025" },
  ],

  /* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ NEIGHBOURHOODS TAB ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
     Sources: Bayut H1 2025 Sales Report, Knight Frank Dubai 2025,
     RERA Service Charge Index 2025, uaeexperthub.com Dubai Yields 2026,
     Alkira Dubai Investment Guide Feb 2026, RTA Metro Blue Line plans
     URL: bayut.com/mybayut/bayut-h1-2025-dubai-rental-market-report
  ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
  communities: [
    { community: "Jumeirah Village Circle", avgPpsf: 1180, grossYield: 7.8,  netYield: 6.2, serviceCharge: 14,  metroDistance: 1800, supplyRisk: "Medium", investmentScore: 82, tenantProfile: "Professionals", hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 8200,  type: "community", isSeedData: true, source: "Bayut H1 2025 / uaeexperthub.com Jan 2026" },
    { community: "Dubai Marina",            avgPpsf: 2280, grossYield: 6.5,  netYield: 5.0, serviceCharge: 22,  metroDistance: 400,  supplyRisk: "Low",    investmentScore: 78, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: true,  hasHospital: false, pipeline2026: 2800,  type: "community", isSeedData: true, source: "Bayut H1 2025 / Knight Frank Q1 2025" },
    { community: "Business Bay",            avgPpsf: 2050, grossYield: 7.1,  netYield: 5.6, serviceCharge: 18,  metroDistance: 600,  supplyRisk: "High",   investmentScore: 72, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 12400, type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 / DLD 2025" },
    { community: "Downtown Dubai",          avgPpsf: 3100, grossYield: 5.8,  netYield: 4.2, serviceCharge: 35,  metroDistance: 300,  supplyRisk: "Low",    investmentScore: 74, tenantProfile: "Luxury / HNWI", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 1800,  type: "community", isSeedData: true, source: "Knight Frank Dubai 2025 / REIDIN" },
    { community: "Dubai Hills Estate",      avgPpsf: 1850, grossYield: 6.2,  netYield: 5.0, serviceCharge: 16,  metroDistance: 3500, supplyRisk: "Medium", investmentScore: 85, tenantProfile: "Families",      hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: true,  pipeline2026: 6800,  type: "community", isSeedData: true, source: "Knight Frank / Bayut H1 2025" },
    { community: "Palm Jumeirah",           avgPpsf: 4800, grossYield: 5.2,  netYield: 3.8, serviceCharge: 28,  metroDistance: 2200, supplyRisk: "Low",    investmentScore: 76, tenantProfile: "Luxury / HNWI", hasSchool: false, hasMall: true,  hasBeach: true,  hasHospital: false, pipeline2026: 800,   type: "community", isSeedData: true, source: "Knight Frank Dubai 2025" },
    { community: "Jumeirah Lake Towers",    avgPpsf: 1420, grossYield: 8.1,  netYield: 6.4, serviceCharge: 16,  metroDistance: 350,  supplyRisk: "Low",    investmentScore: 84, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 1200,  type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 вв‚¬вЂќ ranked #1 yield+quality" },
    { community: "Arabian Ranches",         avgPpsf: 1380, grossYield: 5.5,  netYield: 4.4, serviceCharge: 8,   metroDistance: 8000, supplyRisk: "Low",    investmentScore: 79, tenantProfile: "Families",      hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 1400,  type: "community", isSeedData: true, source: "uaeexperthub.com / Bayut 2025" },
    { community: "International City",      avgPpsf: 580,  grossYield: 9.2,  netYield: 7.8, serviceCharge: 8,   metroDistance: 5500, supplyRisk: "Low",    investmentScore: 71, tenantProfile: "Mixed",         hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 600,   type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 вв‚¬вЂќ 9.2% yield leader" },
    { community: "Dubai Creek Harbour",     avgPpsf: 1620, grossYield: 6.4,  netYield: 5.1, serviceCharge: 14,  metroDistance: 1200, supplyRisk: "Medium", investmentScore: 80, tenantProfile: "Mixed",         hasSchool: false, hasMall: true,  hasBeach: true,  hasHospital: false, pipeline2026: 9200,  type: "community", isSeedData: true, source: "Alkira Dubai Investment Guide Feb 2026" },
    { community: "Al Furjan",               avgPpsf: 1080, grossYield: 8.2,  netYield: 6.8, serviceCharge: 12,  metroDistance: 700,  supplyRisk: "Medium", investmentScore: 77, tenantProfile: "Families",      hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 3200,  type: "community", isSeedData: true, source: "GuestReady Feb 2026 / Bayut H1 2025" },
    { community: "Dubai South",             avgPpsf: 850,  grossYield: 8.8,  netYield: 7.2, serviceCharge: 10,  metroDistance: 4000, supplyRisk: "Medium", investmentScore: 73, tenantProfile: "Mixed",         hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 14000, type: "community", isSeedData: true, source: "uaeexperthub.com Jan 2026 вв‚¬вЂќ 7.5-9.5% yield range" },
    { community: "Mohammed Bin Rashid City", avgPpsf: 1950, grossYield: 6.1,  netYield: 4.9, serviceCharge: 16,  metroDistance: 2800, supplyRisk: "Medium", investmentScore: 81, tenantProfile: "Families",      hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: true,  pipeline2026: 8800,  type: "community", isSeedData: true, source: "Knight Frank / Sands of Wealth Jan 2026" },
    { community: "Sobha Hartland",          avgPpsf: 2100, grossYield: 6.0,  netYield: 4.8, serviceCharge: 18,  metroDistance: 2400, supplyRisk: "Low",    investmentScore: 82, tenantProfile: "Luxury / HNWI", hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 2200,  type: "community", isSeedData: true, source: "Knight Frank Q1 2025 / REIDIN" },
    { community: "Tilal Al Ghaf",           avgPpsf: 1650, grossYield: 6.8,  netYield: 5.5, serviceCharge: 12,  metroDistance: 5000, supplyRisk: "Low",    investmentScore: 80, tenantProfile: "Families",      hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 1800,  type: "community", isSeedData: true, source: "DLD 2025 вв‚¬вЂќ 52% YoY growth" },
    { community: "Discovery Gardens",       avgPpsf: 680,  grossYield: 8.5,  netYield: 7.1, serviceCharge: 9,   metroDistance: 600,  supplyRisk: "Low",    investmentScore: 75, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 400,   type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 вв‚¬вЂќ 8.5% yield" },
    { community: "Dubai Silicon Oasis",     avgPpsf: 820,  grossYield: 7.5,  netYield: 6.0, serviceCharge: 12,  metroDistance: 4500, supplyRisk: "Low",    investmentScore: 74, tenantProfile: "Professionals", hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 2400,  type: "community", isSeedData: true, source: "uaeexperthub.com Jan 2026" },
    { community: "Arjan",                   avgPpsf: 1020, grossYield: 8.0,  netYield: 6.5, serviceCharge: 13,  metroDistance: 1500, supplyRisk: "Medium", investmentScore: 76, tenantProfile: "Professionals", hasSchool: false, hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 4200,  type: "community", isSeedData: true, source: "GuestReady Feb 2026 / Keyone Q1 2026" },
    { community: "DAMAC Hills 2",           avgPpsf: 780,  grossYield: 7.2,  netYield: 6.0, serviceCharge: 10,  metroDistance: 6000, supplyRisk: "High",   investmentScore: 69, tenantProfile: "Families",      hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 16000, type: "community", isSeedData: true, source: "uaeexperthub.com Jan 2026" },
    { community: "Emaar Beachfront",        avgPpsf: 2800, grossYield: 5.8,  netYield: 4.6, serviceCharge: 20,  metroDistance: 800,  supplyRisk: "Low",    investmentScore: 79, tenantProfile: "Luxury / HNWI", hasSchool: false, hasMall: false, hasBeach: true,  hasHospital: false, pipeline2026: 1600,  type: "community", isSeedData: true, source: "Bayut H1 2025 / Driven Properties 2025" },
  ],

  /* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ LAUNCH CALENDAR TAB ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
     Sources: Developer official portals, Bayut Launch Radar 2026,
     Property Finder New Projects, Reelly.ai Launch Calendar
     URL: reelly.ai | bayut.com | propertyfinder.ae
  ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
  launches: [
    { projectName: "Emaar Grand Polo Club & Resort вв‚¬вЂќ Phase 2", developer: "Emaar", community: "Dubai Investment South", propertyType: "Villa", status: "EOI Open", launchDate: "2026-04-20", startingPrice: 5700000, totalUnits: 420, paymentPlan: "80/20", eoiAmount: 50000, eoiRefundable: true, launchPrice: 4800, currentPrice: 5200, notes: "Emaar's 60M sqft master plan. Polo fields, 7 clubhouses, equestrian estates. Strong appreciation history on Emaar launches.", type: "launch", isSeedData: true, source: "Alkira Dubai Investment Guide Feb 2026" },
    { projectName: "Dubai Islands вв‚¬вЂќ Island B Phase 1", developer: "Nakheel", community: "Dubai Islands", propertyType: "Apartment", status: "EOI Open", launchDate: "2026-04-28", startingPrice: 1200000, totalUnits: 680, paymentPlan: "60/40", eoiAmount: 30000, eoiRefundable: true, notes: "Island B offers more controlled planning vs Island A. 24% price growth in 2025. Beachfront value.", type: "launch", isSeedData: true, source: "Alkira Feb 2026 вв‚¬вЂќ Dubai Islands 24% growth 2025" },
    { projectName: "Sobha Hartland II вв‚¬вЂќ The Waterfront", developer: "Sobha Realty", community: "Sobha Hartland", propertyType: "Apartment", status: "Upcoming", launchDate: "2026-05-15", startingPrice: 1800000, totalUnits: 520, paymentPlan: "70/30", eoiAmount: 40000, eoiRefundable: true, notes: "High-rise community with green living concept. Sobha known for quality finishes and delivery track record.", type: "launch", isSeedData: true, source: "Arthur Mackenzy Q3 2025 Report" },
    { projectName: "The Oasis by Emaar вв‚¬вЂќ Phase 11", developer: "Emaar", community: "The Oasis", propertyType: "Villa", status: "Launched", launchDate: "2026-03-10", startingPrice: 6150000, totalUnits: 280, paymentPlan: "80/20 post-handover", eoiAmount: 50000, eoiRefundable: true, launchPrice: 5800, currentPrice: 6300, notes: "10-to-1 scarcity vs Dubai Hills (2,700 units vs 30,000). Lagoon pools, wave pools. Handover Jun 2029.", type: "launch", isSeedData: true, source: "Alkira Feb 2026 вв‚¬вЂќ 'Blue Lagoon' exclusivity" },
    { projectName: "DAMAC Lagoons вв‚¬вЂќ Santorini Phase 3", developer: "DAMAC Properties", community: "DAMAC Lagoons", propertyType: "Villa", status: "EOI Closed", launchDate: "2026-03-22", startingPrice: 2200000, totalUnits: 380, paymentPlan: "60/40", eoiAmount: 25000, eoiRefundable: true, notes: "Mediterranean-inspired villas. DAMAC sold out previous phases within hours.", type: "launch", isSeedData: true, source: "Property Finder Launch Radar 2026" },
    { projectName: "Binghatti Skyrise вв‚¬вЂќ Business Bay", developer: "Binghatti", community: "Business Bay", propertyType: "Apartment", status: "Upcoming", launchDate: "2026-05-08", startingPrice: 850000, totalUnits: 720, paymentPlan: "70/30", eoiAmount: 20000, eoiRefundable: true, notes: "Binghatti's signature bold architecture. Business Bay canal views. Target professional renters вв‚¬вЂќ strong yield community.", type: "launch", isSeedData: true, source: "Bayut Launch Radar Apr 2026" },
    { projectName: "Tilal Al Ghaf вв‚¬вЂќ Serenity Mansions", developer: "Majid Al Futtaim", community: "Tilal Al Ghaf", propertyType: "Villa", status: "Sold Out", launchDate: "2026-02-18", startingPrice: 8500000, totalUnits: 85, paymentPlan: "50/50", eoiAmount: 100000, eoiRefundable: false, notes: "Ultra-luxury mansions sold out within 48 hours. DLD 2025 shows 52% YoY transaction growth in Tilal Al Ghaf.", type: "launch", isSeedData: true, source: "DLD 2025 / Bayut 2026" },
    { projectName: "Ellington Ocean House вв‚¬вЂќ Dubai Islands", developer: "Ellington Properties", community: "Dubai Islands", propertyType: "Apartment", status: "Upcoming", launchDate: "2026-06-01", startingPrice: 2400000, totalUnits: 180, paymentPlan: "70/30", eoiAmount: 50000, eoiRefundable: true, notes: "Design-forward beachfront living. Ellington known for curated interiors. Limited units.", type: "launch", isSeedData: true, source: "Reelly.ai Launch Calendar Apr 2026" },
  ],

  /* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ OVERVIEW TAB KPIs ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
     Sources: Same as Market tab
  ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
  overviewKpis: [
    { metric: "Total Market Value",  value: "AED 682.6B",  change: "+21% YoY вв‚¬вЂќ Full year 2025",   isSeedData: true, source: "DLD / DXB Interact Jan 2026" },
    { metric: "Total Transactions",  value: "215,060",      change: "+19% YoY вв‚¬вЂќ Sales only",        isSeedData: true, source: "DLD Annual Report 2025" },
    { metric: "Off-Plan Share",      value: "63%",          change: "+3pp вв‚¬вЂќ Off-plan dominated 2025", isSeedData: true, source: "DLD / Property Monitor 2025" },
    { metric: "Units Launched",      value: "131,504",      change: "532 projects by Oct 2025",     isSeedData: true, source: "DLD Oct 2025" },
  ],
};

export default SEED_DATA;
