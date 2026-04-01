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
  { id:1,  developerId:"aldar", name:"Nudra Villas Saadiyat", officialUrl:"https://www.aldar.com/en/developments/nudra", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/nudra",bayut:"https://www.bayut.com/buildings/nudra/"},       community:"Saadiyat Island",  district:"Saadiyat",  type:"Villas",     beds:"4–6BR", status:"Under Construction", handover:"Q2 2026", price:12000000, sizeFrom:5000,  sizeTo:20000,  ppsf:2400, payment:"60/40", construction:80, branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Aldar Official", confidence:"VERIFIED" },
  { id:2,  developerId:"aldar", name:"Fahid Beach Terraces", officialUrl:"https://www.aldar.com/en/developments/fahid-island", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/fahid-beach-terraces",bayut:"https://www.bayut.com/buildings/fahid-beach-terraces/"},        community:"Fahid Island",     district:"AUH",       type:"Apartments", beds:"1–4BR", status:"Off Plan",           handover:"Q4 2027", price:2200000,  sizeFrom:800,   sizeTo:3500,   ppsf:2750, payment:"60/40", construction:5,  branded:false, brand:"—",           tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED" },
  { id:3,  developerId:"aldar", name:"Rise by Athlon", officialUrl:"https://www.aldar.com/en/developments/athlon", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/rise-by-athlon",bayut:"https://www.bayut.com/buildings/rise-by-athlon/"},              community:"Athlon Dubai",     district:"Dubailand", type:"Townhouses", beds:"3–4BR", status:"Under Construction", handover:"Q4 2026", price:2500000,  sizeFrom:2200,  sizeTo:4000,   ppsf:1136, payment:"60/40", construction:40, branded:false, brand:"—",           tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED" },
  { id:4,  developerId:"aldar", name:"The Wilds Dubai", officialUrl:"https://www.aldar.com/en/developments/the-wilds", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/the-wilds",bayut:"https://www.bayut.com/buildings/the-wilds/"},             community:"Dubailand",        district:"DL",        type:"Villas",     beds:"4–6BR", status:"Under Construction", handover:"Q1 2027", price:4500000,  sizeFrom:4000,  sizeTo:12000,  ppsf:1125, payment:"60/40", construction:25, branded:false, brand:"—",           tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED" },
  { id:5,  developerId:"aldar", name:"Yas Acres", officialUrl:"https://www.aldar.com/en/developments/yas-acres", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/yas-acres",bayut:"https://www.bayut.com/buildings/yas-acres/"},                   community:"Yas Island",       district:"Yas",       type:"Villas+TH",  beds:"3–5BR", status:"Established",        handover:"Delivered",price:2800000, sizeFrom:2500,  sizeTo:6000,   ppsf:1120, payment:"N/A",   construction:100,branded:false, brand:"—",           tier:"Mid-Premium",  source:"Aldar Official", confidence:"VERIFIED" },
  { id:6,  developerId:"aldar", name:"Saadiyat Lagoons", officialUrl:"https://www.aldar.com/en/developments/saadiyat-lagoons", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/saadiyat-lagoons",bayut:"https://www.bayut.com/buildings/saadiyat-lagoons/"},            community:"Saadiyat Island",  district:"Saadiyat",  type:"Villas",     beds:"4–5BR", status:"Under Construction", handover:"Q4 2026", price:8000000,  sizeFrom:4500,  sizeTo:12000,  ppsf:1778, payment:"60/40", construction:55, branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Aldar Official", confidence:"VERIFIED" },
  { id:7,  developerId:"aldar", name:"Reem Hills", officialUrl:"https://www.aldar.com/en/developments/reem-hills", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/reem-hills",bayut:"https://www.bayut.com/buildings/reem-hills/"},                  community:"Reem Island",      district:"Reem",      type:"Apartments", beds:"1–4BR", status:"Under Construction", handover:"Q2 2026", price:1200000,  sizeFrom:650,   sizeTo:3000,   ppsf:1846, payment:"60/40", construction:85, branded:false, brand:"—",           tier:"Mid-Premium",  source:"Aldar Official", confidence:"VERIFIED" },
  { id:8,  developerId:"aldar", name:"Al Ghadeer", officialUrl:"https://www.aldar.com/en/developments/al-ghadeer", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/al-ghadeer",bayut:"https://www.bayut.com/buildings/al-ghadeer/"},                  community:"Abu Dhabi/Dubai Border",district:"AGB",  type:"Villas+TH",  beds:"2–5BR", status:"Established",        handover:"Delivered",price:1100000, sizeFrom:1500,  sizeTo:5000,   ppsf:733,  payment:"N/A",   construction:100,branded:false, brand:"—",           tier:"Mid-Market",   source:"Aldar Official", confidence:"VERIFIED" },
  { id:9,  developerId:"aldar", name:"Al Deem Townhomes", officialUrl:"https://www.aldar.com/en/developments/al-deem", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/al-deem-townhomes",bayut:"https://www.bayut.com/buildings/al-deem/"},           community:"Abu Dhabi",        district:"AUH",       type:"Townhouses", beds:"3–4BR", status:"Off Plan",           handover:"Q1 2028", price:1800000,  sizeFrom:2000,  sizeTo:4000,   ppsf:900,  payment:"60/40", construction:5,  branded:false, brand:"—",           tier:"Mid-Premium",  source:"Aldar Official", confidence:"VERIFIED" },
  { id:10, developerId:"aldar", name:"Park View Saadiyat", officialUrl:"https://www.aldar.com/en/developments/park-views-residences", links:{pf:"https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/park-views-residences",bayut:"https://www.bayut.com/buildings/park-views-residences/"},          community:"Saadiyat Island",  district:"Saadiyat",  type:"Apartments", beds:"1–4BR", status:"Established",        handover:"Delivered",price:1900000, sizeFrom:700,   sizeTo:3500,   ppsf:2714, payment:"N/A",   construction:100,branded:false, brand:"—",           tier:"Premium",      source:"Aldar Official", confidence:"VERIFIED" },
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
