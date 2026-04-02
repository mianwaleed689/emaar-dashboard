/* ─── DXB ANALYTICS — ALDAR PROPERTIES DATA ─────────────────────────────────
   S28: Aldar Full Intelligence Module
   Sources: Aldar IR · ADX · Gulf News · The National · Khaleej Times · Zawya
   Last verified: March 2026 — FY2025 AUDITED RESULTS
────────────────────────────────────────────────────────────────────────── */

export const aldarIdentity = {
  id: "aldar", name: "Aldar Properties", legalName: "Aldar Properties PJSC",
  founded: 2004, ceo: "Talal Al Dhiyebi", chairman: "Mohamed Khalifa Al Mubarak",
  hq: "Yas Island, Abu Dhabi, UAE",
  type: "Public (ADX listed)", listed: true, exchange: "ADX", ticker: "ALDAR",
  tier: "T1", segment: "Abu Dhabi + Dubai — Full Spectrum",
  color: "#06B6D4", website: "https://www.aldar.com",
  confidence: "VERIFIED",
  usp: "Abu Dhabi's largest developer — bridging Abu Dhabi + Dubai + International",
  tagline: "Great at Living",
};

export const aldarFinancialHistory = [
  { year:2020, revenue:8.2,  netProfit:1.9,  propertySales:9.9  },
  { year:2021, revenue:9.8,  netProfit:2.3,  propertySales:13.2 },
  { year:2022, revenue:14.1, netProfit:3.4,  propertySales:19.8 },
  { year:2023, revenue:18.4, netProfit:4.6,  propertySales:26.3 },
  { year:2024, revenue:23.0, netProfit:6.5,  propertySales:33.6 },
  { year:2025, revenue:33.8, netProfit:8.8,  propertySales:40.6 },
];

export const aldarLive = {
  propertySales:    40.6,   // AED Billion FY2025 GROUP RECORD
  propertySalesUAE: 35.5,   // AED Billion UAE only (+25% YoY)
  propertySalesUSD: 11.1,
  revenue:          33.8,   // AED Billion +47% YoY AUDITED
  netProfit:        8.8,    // AED Billion AFTER tax +36% YoY AUDITED
  netProfitBeforeTax: 10.0, // AED Billion BEFORE tax (UAE DMTT 15% applied FY2025)
  taxNote:          "UAE Domestic Minimum Top-up Tax (DMTT) 15% applied Jan 2025. Effective rate 11.35%. Pre-tax: AED 10.0B, Post-tax: AED 8.8B.",
  ebitda:           11.2,   // AED Billion +46% YoY
  backlog:          71700,  // AED million RECORD — provides 2-3yr revenue visibility
  uaeBacklog:       61000,  // AED million
  aum:              49000,  // AED million — assets under management
  projectMgmtBacklog: 94800,// AED million
  internationalSales: 5100, // AED million
  intlBuyerPct:     77,     // % of UAE sales from overseas + expat buyers
  rank:             "#1 Abu Dhabi · #2 UAE by Sales Value",
  ticker:           "ALDAR.AE",
  creditRating:     "Investment Grade — ADX listed",
  latestReportLabel:"FY2025 Annual Results",
  latestReportDate: "February 2026",
  source:           "Aldar Official IR · ADX · Gulf News · The National",
  updatedAt:        "2026-03-27",
};

export const aldarCommunities = [
  { id:"yas-island",      name:"Yas Island",         location:"Abu Dhabi",    type:"Entertainment + Residential", avgPpsf:2200, avgGrossYield:6.2, highlights:["Ferrari World","Yas Waterworld","Yas Mall","F1 Grand Prix Circuit","Yas Marina","W Hotel"] },
  { id:"saadiyat-island", name:"Saadiyat Island",    location:"Abu Dhabi",    type:"Ultra-Luxury Cultural",      avgPpsf:4800, avgGrossYield:4.8, highlights:["Louvre Abu Dhabi","Guggenheim (coming)","Zayed National Museum","Beach","Nudra Villas","AED 400M mansion"] },
  { id:"reem-island",     name:"Reem Island",         location:"Abu Dhabi",    type:"Urban Residential",          avgPpsf:1800, avgGrossYield:7.0, highlights:["City center adjacent","Shams Abu Dhabi","Mixed-use"] },
  { id:"al-maryah",       name:"Al Maryah Island",   location:"Abu Dhabi",    type:"Financial District",         avgPpsf:3200, avgGrossYield:5.5, highlights:["ADGM","Galleria Mall","Four Seasons","Financial hub"] },
  { id:"aldar-dubai",     name:"Dubai Portfolio",    location:"Dubai (Various)",type:"Mixed",                    avgPpsf:2500, avgGrossYield:6.5, highlights:["Dubai Holding JV","Expanding Dubai presence","Fahid Beach","The Wilds"] },
  { id:"fahid-island",    name:"Fahid Island",        location:"Abu Dhabi",    type:"Waterfront",                 avgPpsf:2800, avgGrossYield:5.8, highlights:["Abu Dhabi's most successful off-plan 2025","Beachfront","Island living"] },
  { id:"athlon",          name:"Athlon by Aldar",     location:"Dubailand Dubai",type:"Active Lifestyle",        avgPpsf:1900, avgGrossYield:6.8, highlights:["Sports + wellness focus","Cycling tracks","Dubailand","Rapid sellout"] },
];

export const aldarProjects = [
  { id:"aldar-1",  developerId:"aldar", name:"Rise by Athlon Phase 1",    officialUrl:"https://www.aldar.com/en/communities/athlon/rise-by-athlon", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/rise-by-athlon",bayut:"https://www.bayut.com/buildings/rise-by-athlon/"}, community:"Athlon by Aldar", district:"Dubailand", type:"Apartments", beds:"1–3BR", status:"Off Plan", handover:"Q4 2026", price:1650000, sizeFrom:650,  sizeTo:2000, ppsf:2538, payment:"60/40", construction:35, branded:false, brand:"—", tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:650,sqftTo:850,priceFrom:1650000},{type:"2BR",sqftFrom:1100,sqftTo:1400,priceFrom:2750000},{type:"3BR",sqftFrom:1600,sqftTo:2000,priceFrom:4000000}] },
  { id:"aldar-2",  developerId:"aldar", name:"Rise by Athlon Phase 2",    officialUrl:"https://www.aldar.com/en/communities/athlon/rise-by-athlon", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/rise-by-athlon-2",bayut:"https://www.bayut.com/buildings/rise-by-athlon-2/"}, community:"Athlon by Aldar", district:"Dubailand", type:"Apartments", beds:"1–3BR", status:"Off Plan", handover:"Q4 2026", price:2300000, sizeFrom:750,  sizeTo:2200, ppsf:3067, payment:"60/40", construction:20, branded:false, brand:"—", tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:750,sqftTo:950,priceFrom:2300000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:3833000},{type:"3BR",sqftFrom:1700,sqftTo:2200,priceFrom:5500000}] },
  { id:"aldar-3",  developerId:"aldar", name:"Athlon — Delphi Villas",    officialUrl:"https://www.aldar.com/en/communities/athlon",                links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/athlon-delphi",bayut:"https://www.bayut.com/new-projects/dubai/dubailand/athlon-by-aldar/"}, community:"Athlon by Aldar", district:"Dubailand", type:"Townhouses",  beds:"3–4BR TH", status:"Off Plan", handover:"Q2 2028", price:2800000, sizeFrom:2200, sizeTo:3800, ppsf:1273, payment:"60/40", construction:10, branded:false, brand:"—", tier:"Premium",      source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"3BR TH",sqftFrom:2200,sqftTo:2800,priceFrom:2800000},{type:"4BR TH",sqftFrom:3000,sqftTo:3800,priceFrom:3800000}] },
  { id:"aldar-4",  developerId:"aldar", name:"Haven by Aldar",            officialUrl:"https://www.aldar.com/en/communities/haven",                  links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/haven",bayut:"https://www.bayut.com/new-projects/dubai/dubailand/haven-by-aldar/"}, community:"Haven by Aldar", district:"Dubailand", type:"Villas",      beds:"3–5BR TH/Villa", status:"Off Plan", handover:"Q4 2027", price:2500000, sizeFrom:2000, sizeTo:5500, ppsf:1250, payment:"60/40", construction:25, branded:false, brand:"—", tier:"Premium",      source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"3BR TH",sqftFrom:2000,sqftTo:2500,priceFrom:2500000},{type:"4BR Villa",sqftFrom:3000,sqftTo:4000,priceFrom:3750000},{type:"5BR Villa",sqftFrom:4500,sqftTo:5500,priceFrom:5625000}] },
  { id:"aldar-5",  developerId:"aldar", name:"The Wilds by Aldar",        officialUrl:"https://www.aldar.com/en/communities/the-wilds",              links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/wilds-by-aldar",bayut:"https://www.bayut.com/new-projects/dubai/dubailand/the-wilds-by-aldar/"}, community:"The Wilds", district:"Dubailand", type:"Villas",      beds:"3–6BR Villas", status:"Off Plan", handover:"Q2 2029", price:5100000, sizeFrom:3500, sizeTo:8000, ppsf:1457, payment:"65/35", construction:5,  branded:false, brand:"—", tier:"Luxury",       source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"3BR Villa",sqftFrom:3500,sqftTo:4500,priceFrom:5100000},{type:"4BR Villa",sqftFrom:4500,sqftTo:6000,priceFrom:6557000},{type:"5BR Villa",sqftFrom:6000,sqftTo:7000,priceFrom:8743000},{type:"6BR Villa",sqftFrom:7000,sqftTo:8000,priceFrom:10200000}] },
  { id:"aldar-6",  developerId:"aldar", name:"Luma Park Views",           officialUrl:"https://www.aldar.com/en/properties/luma-park-views",         links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/luma-park-views",bayut:"https://www.bayut.com/buildings/luma-park-views/"}, community:"Motor City", district:"DMC", type:"Apartments",  beds:"1–3BR", status:"Off Plan", handover:"Q4 2026", price:1700000, sizeFrom:700,  sizeTo:2000, ppsf:2429, payment:"60/40", construction:40, branded:false, brand:"—", tier:"Premium",      source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1700000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2914000},{type:"3BR",sqftFrom:1700,sqftTo:2000,priceFrom:4128000}] },
  { id:"aldar-7",  developerId:"aldar", name:"Nudra Villas Saadiyat",     officialUrl:"https://www.aldar.com/en/properties/nudra",                   links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/nudra",bayut:"https://www.bayut.com/buildings/nudra-saadiyat-island/"}, community:"Saadiyat Island", district:"Saadiyat", type:"Villas",      beds:"4–5BR Villas", status:"Off Plan", handover:"Q2 2026", price:12000000,sizeFrom:5500, sizeTo:9000, ppsf:2182, payment:"60/40", construction:85, branded:false, brand:"—", tier:"Ultra-Luxury", source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"4BR Villa",sqftFrom:5500,sqftTo:6500,priceFrom:12000000},{type:"5BR Villa",sqftFrom:7000,sqftTo:9000,priceFrom:15273000}] },
  { id:"aldar-8",  developerId:"aldar", name:"Fahid Beach Residences",    officialUrl:"https://www.aldar.com/en/communities/fahid-island",           links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/fahid-beach-residences",bayut:"https://www.bayut.com/new-projects/abu-dhabi/fahid-island/"}, community:"Fahid Island", district:"AD", type:"Apartments",  beds:"1–4BR", status:"Off Plan", handover:"Q1 2029", price:3500000, sizeFrom:900,  sizeTo:4000, ppsf:3889, payment:"65/35", construction:10, branded:false, brand:"—", tier:"Luxury",       source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:900,sqftTo:1100,priceFrom:3500000},{type:"2BR",sqftFrom:1500,sqftTo:1800,priceFrom:5833000},{type:"3BR",sqftFrom:2200,sqftTo:2800,priceFrom:8556000},{type:"4BR TH",sqftFrom:3000,sqftTo:4000,priceFrom:11667000}] },
  { id:"aldar-9",  developerId:"aldar", name:"Saadiyat Lagoons",          officialUrl:"https://www.aldar.com/en/communities/saadiyat-lagoons",       links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/saadiyat-lagoons",bayut:"https://www.bayut.com/area-guides/saadiyat-lagoons/"}, community:"Saadiyat Island", district:"Saadiyat", type:"Villas",      beds:"4–6BR Villas", status:"Off Plan", handover:"Q4 2026", price:8000000, sizeFrom:5000, sizeTo:12000,ppsf:1600, payment:"60/40", construction:80, branded:false, brand:"—", tier:"Ultra-Luxury", source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"4BR Villa",sqftFrom:5000,sqftTo:6500,priceFrom:8000000},{type:"5BR Villa",sqftFrom:6500,sqftTo:8500,priceFrom:10400000},{type:"6BR Villa",sqftFrom:9000,sqftTo:12000,priceFrom:14400000}] },
  { id:"aldar-10", developerId:"aldar", name:"Reem Hills",                officialUrl:"https://www.aldar.com/en/communities/reem-hills",             links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/reem-hills",bayut:"https://www.bayut.com/buildings/reem-hills/"}, community:"Al Reem Island", district:"AD-Reem", type:"Apartments",  beds:"1–4BR", status:"Off Plan", handover:"Q2 2026", price:1200000, sizeFrom:650,  sizeTo:2500, ppsf:1846, payment:"60/40", construction:90, branded:false, brand:"—", tier:"Mid-Premium",  source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:650,sqftTo:850,priceFrom:1200000},{type:"2BR",sqftFrom:1100,sqftTo:1400,priceFrom:2031000},{type:"3BR",sqftFrom:1600,sqftTo:2000,priceFrom:2954000},{type:"4BR",sqftFrom:2000,sqftTo:2500,priceFrom:3692000}] },
  { id:"aldar-11", developerId:"aldar", name:"Yas Acres",                 officialUrl:"https://www.aldar.com/en/communities/yas-acres",              links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/yas-acres",bayut:"https://www.bayut.com/area-guides/yas-acres/"}, community:"Yas Island", district:"AD-Yas", type:"Villas",      beds:"3–5BR Villas", status:"Ready",    handover:"Delivered",price:2800000, sizeFrom:2500, sizeTo:6000, ppsf:1120, payment:"Ready",  construction:100,branded:false, brand:"—", tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"3BR TH",sqftFrom:2500,sqftTo:3000,priceFrom:2800000},{type:"4BR Villa",sqftFrom:3500,sqftTo:4500,priceFrom:3920000},{type:"5BR Villa",sqftFrom:5000,sqftTo:6000,priceFrom:5600000}] },
  { id:"aldar-12", developerId:"aldar", name:"Al Ghadeer",                officialUrl:"https://www.aldar.com/en/communities/al-ghadeer",             links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/al-ghadeer",bayut:"https://www.bayut.com/area-guides/al-ghadeer/"}, community:"Al Ghadeer", district:"AD-Suburban", type:"Apartments",  beds:"1–3BR", status:"Ready",    handover:"Delivered",price:1100000, sizeFrom:600,  sizeTo:1800, ppsf:1833, payment:"Ready",  construction:100,branded:false, brand:"—", tier:"Mid-Premium",  source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:600,sqftTo:800,priceFrom:1100000},{type:"2BR",sqftFrom:1000,sqftTo:1300,priceFrom:1833000},{type:"3BR",sqftFrom:1500,sqftTo:1800,priceFrom:2750000}] },
  { id:"aldar-13", developerId:"aldar", name:"Verdes by Haven",           officialUrl:"https://www.aldar.com/en/communities/haven/verdes",           links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/verdes-by-haven",bayut:"https://www.bayut.com/buildings/verdes-by-haven/"}, community:"Haven by Aldar", district:"Dubailand", type:"Apartments",  beds:"1–3BR", status:"Off Plan", handover:"Q2 2028", price:990000,  sizeFrom:550,  sizeTo:1800, ppsf:1800, payment:"60/40", construction:15, branded:false, brand:"—", tier:"Mid-Premium",  source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:550,sqftTo:750,priceFrom:990000},{type:"2BR",sqftFrom:1000,sqftTo:1300,priceFrom:1800000},{type:"3BR",sqftFrom:1500,sqftTo:1800,priceFrom:2700000}] },
  { id:"aldar-14", developerId:"aldar", name:"The Source Terraces",       officialUrl:"https://www.aldar.com/en/communities/saadiyat-island/the-source-terraces", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/source-terraces",bayut:"https://www.bayut.com/buildings/the-source-terraces/"}, community:"Saadiyat Island", district:"Saadiyat", type:"Apartments",  beds:"1–4BR", status:"Off Plan", handover:"Q3 2027", price:3000000, sizeFrom:900,  sizeTo:3500, ppsf:3333, payment:"60/40", construction:40, branded:false, brand:"—", tier:"Luxury",       source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:900,sqftTo:1100,priceFrom:3000000},{type:"2BR",sqftFrom:1500,sqftTo:1800,priceFrom:5000000},{type:"3BR",sqftFrom:2200,sqftTo:2800,priceFrom:7333000},{type:"4BR",sqftFrom:3000,sqftTo:3500,priceFrom:10000000}] },
  { id:"aldar-15", developerId:"aldar", name:"The Sustainable City Yas",  officialUrl:"https://www.aldar.com/en/communities/yas-island/sustainable-city", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/sustainable-city-yas",bayut:"https://www.bayut.com/buildings/sustainable-city-yas/"}, community:"Yas Island", district:"AD-Yas", type:"Mixed",       beds:"1–4BR", status:"Off Plan", handover:"Q1 2026", price:892000,  sizeFrom:500,  sizeTo:2500, ppsf:1784, payment:"35/65", construction:90, branded:false, brand:"—", tier:"Mid-Premium",  source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:500,sqftTo:700,priceFrom:892000},{type:"2BR",sqftFrom:900,sqftTo:1200,priceFrom:1606000},{type:"3BR",sqftFrom:1500,sqftTo:2000,priceFrom:2676000},{type:"4BR",sqftFrom:2000,sqftTo:2500,priceFrom:3568000}] },
  { id:"aldar-16", developerId:"aldar", name:"Yas Park Gate",             officialUrl:"https://www.aldar.com/en/communities/yas-island/yas-park-gate", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/yas-park-gate",bayut:"https://www.bayut.com/buildings/yas-park-gate/"}, community:"Yas Island", district:"AD-Yas", type:"Townhouses",  beds:"3–4BR TH", status:"Off Plan", handover:"Q1 2026", price:1740000, sizeFrom:1800, sizeTo:2800, ppsf:967, payment:"40/60", construction:90, branded:false, brand:"—", tier:"Premium",      source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"3BR TH",sqftFrom:1800,sqftTo:2200,priceFrom:1740000},{type:"4BR TH",sqftFrom:2400,sqftTo:2800,priceFrom:2320000}] },
  { id:"aldar-17", developerId:"aldar", name:"Manarat Living",            officialUrl:"https://www.aldar.com/en/communities/saadiyat-island/manarat-living", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/manarat-living",bayut:"https://www.bayut.com/buildings/manarat-living/"}, community:"Saadiyat Island", district:"Saadiyat", type:"Apartments",  beds:"Studio–3BR", status:"Off Plan", handover:"Q1 2026", price:635000,  sizeFrom:350,  sizeTo:1500, ppsf:1814, payment:"40/60", construction:95, branded:false, brand:"—", tier:"Mid-Market",   source:"Bayut",         confidence:"VERIFIED", unitBreakdown:[{type:"Studio",sqftFrom:350,sqftTo:500,priceFrom:635000},{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1270000},{type:"2BR",sqftFrom:1100,sqftTo:1400,priceFrom:1995000},{type:"3BR",sqftFrom:1300,sqftTo:1500,priceFrom:2358000}] },
  { id:"aldar-18", developerId:"aldar", name:"Park View Saadiyat",        officialUrl:"https://www.aldar.com/en/communities/saadiyat-island",        links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/park-view",bayut:"https://www.bayut.com/buildings/park-view-saadiyat/"}, community:"Saadiyat Island", district:"Saadiyat", type:"Apartments",  beds:"1–3BR", status:"Ready",    handover:"Delivered",price:1900000, sizeFrom:750,  sizeTo:2000, ppsf:2533, payment:"Ready",  construction:100,branded:false, brand:"—", tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED", unitBreakdown:[{type:"1BR",sqftFrom:750,sqftTo:950,priceFrom:1900000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:3040000},{type:"3BR",sqftFrom:1700,sqftTo:2000,priceFrom:4307000}] },
];

export const aldarRisks = [
  { factor:"Abu Dhabi Concentration (87% revenue)",   level:3, likelihood:2, impact:4, score:24, mitigation:"Dubai expansion via Dubai Holding JV. International Egypt + UK businesses. Diversifying rapidly.", assessment:"MODERATE", color:"#D4A843" },
  { factor:"Government Dependency",                   level:2, likelihood:1, impact:3, score:6,  mitigation:"Government backing actually reduces risk. AED 167B total backlog incl. govt projects. Stable.", assessment:"LOW",      color:"#10B981" },
  { factor:"Backlog Execution (AED 71.7B)",           level:3, likelihood:2, impact:4, score:24, mitigation:"30-month average backlog duration. 58% EBITDA growth validates delivery execution.", assessment:"MODERATE", color:"#D4A843" },
  { factor:"International Expansion Risk",            level:3, likelihood:2, impact:3, score:18, mitigation:"Egypt + UK operations early stage. UAE core market self-funding expansion.", assessment:"MODERATE", color:"#D4A843" },
  { factor:"Currency Risk (AED Peg)",                 level:1, likelihood:1, impact:2, score:2,  mitigation:"USD peg. International ops in USD/GBP/EGP.", assessment:"VERY LOW", color:"#10B981" },
  { factor:"Interest Rate Sensitivity",               level:2, likelihood:2, impact:2, score:8,  mitigation:"77% international/expat buyers — largely cash-driven. EIBOR sensitivity manageable.", assessment:"LOW",      color:"#10B981" },
];

export const aldarSegments = [
  { name:"UAE Development",    revenue:24.8, growth:"+58%", color:"#06B6D4" },
  { name:"Investment Platform",revenue:6.4,  growth:"+20%", color:"#3B82F6" },
  { name:"Project Management", revenue:1.8,  growth:"+35%", color:"#8B5CF6" },
  { name:"International",      revenue:0.8,  growth:"+40%", color:"#10B981" },
];

export const aldarRadar = [
  { metric:"Financial Strength",  aldar:95, emaar:95, binghatti:72, market:70 },
  { metric:"Sales Volume",        aldar:88, emaar:100,binghatti:95, market:70 },
  { metric:"Backlog Visibility",  aldar:98, emaar:90, binghatti:75, market:65 },
  { metric:"Government Backing",  aldar:90, emaar:80, binghatti:0,  market:50 },
  { metric:"Delivery Record",     aldar:88, emaar:92, binghatti:80, market:72 },
  { metric:"Price Appreciation",  aldar:82, emaar:86, binghatti:80, market:72 },
  { metric:"International Reach", aldar:70, emaar:72, binghatti:30, market:55 },
  { metric:"Community Quality",   aldar:88, emaar:90, binghatti:72, market:70 },
];

export const aldarYields = [
  { community:"Yas Island",      unit:"Apartments",  gross:6.2, net:4.7, avgRent:90200,  avgPrice:1455000, demand:"High" },
  { community:"Saadiyat Island", unit:"Villas",      gross:4.8, net:3.6, avgRent:576000, avgPrice:12000000,demand:"High" },
  { community:"Reem Island",     unit:"Apartments",  gross:7.0, net:5.3, avgRent:84000,  avgPrice:1200000, demand:"Very High" },
  { community:"Al Maryah",       unit:"Apartments",  gross:5.5, net:4.2, avgRent:176000, avgPrice:3200000, demand:"High" },
  { community:"Athlon Dubai",    unit:"Townhouses",  gross:6.8, net:5.1, avgRent:170000, avgPrice:2500000, demand:"High" },
];

export const aldarMegaProjects = [
  { name:"Saadiyat Island (Full)",     scale:"AED 100B+ GDV", units:"50,000+", sqft:"Various",    timeline:"2004–2030+", status:"Phased Development", record:"Louvre Abu Dhabi · Guggenheim (coming) · Cultural District" },
  { name:"Fahid Island",               scale:"AED 15B+ GDV",  units:"TBD",     sqft:"Island",     timeline:"2025 launch · 2027+", status:"Off Plan", record:"Most successful AD off-plan launch 2025" },
  { name:"Yas Island (Full Portfolio)",scale:"AED 80B+ GDV",  units:"30,000+", sqft:"Various",    timeline:"2005–ongoing", status:"Established + Active", record:"F1 Grand Prix · Ferrari World · Largest entertainment island UAE" },
];

export default { identity:aldarIdentity, live:aldarLive, financialHistory:aldarFinancialHistory, communities:aldarCommunities, projects:aldarProjects, risks:aldarRisks, segments:aldarSegments, radar:aldarRadar, megaProjects:aldarMegaProjects, yields:aldarYields };
