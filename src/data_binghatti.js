/* ─── DXB ANALYTICS — BINGHATTI DATA ────────────────────────────────────────
   S28: Binghatti Full Intelligence Module
   Sources: Binghatti Official · Gulf News · Arabian Business · Zawya · The National
   Last verified: March 2026 — FY2025 AUDITED RESULTS
────────────────────────────────────────────────────────────────────────── */

export const binghattiIdentity = {
  id: "binghatti", name: "Binghatti", legalName: "Binghatti Holding Ltd",
  founded: 2008,  // Founded 2008 by Dr. Hussain BinGhatti — NOT 2012
  founder: "Dr. Hussain BinGhatti",
  chairman: "Muhammad BinGhatti",  // Chairman and brand face
  ceo: "Katralnada BinGhatti",     // CEO & MD per FY2025 financial results
  hq: "Business Bay, Dubai, UAE",
  type: "Private",   // PRIVATE company — NOT listed on ADX or any exchange
  listed: false,     // Company is NOT listed — only sukuk/bonds are listed
  exchange: null,    // No equity exchange listing
  sukukListed: "Nasdaq Dubai + London Stock Exchange (bonds only — not equity)",
  creditRating: "BB- (Fitch) · Ba3 (Moody's)",
  tier: "T1", segment: "Affordable → Ultra-Luxury",
  color: "#3B82F6", website: "https://www.binghatti.com",
  confidence: "VERIFIED",
  usp: "Dubai's #1 developer by units sold — fastest-growing RE company UAE",
  tagline: "Architecture is Art",
};

export const binghattiFinancialHistory = [
  { year:2021, revenue:1.8,  netProfit:0.4,  propertySales:5.2  },
  { year:2022, revenue:2.8,  netProfit:0.7,  propertySales:9.8  },
  { year:2023, revenue:3.4,  netProfit:1.0,  propertySales:14.5 },
  { year:2024, revenue:6.34, netProfit:1.83, propertySales:18.8 },
  { year:2025, revenue:12.43,netProfit:3.58, propertySales:26.0 },
];

export const binghattiLive = {
  propertySales:    26.0,   // AED Billion FY2025 (DLD rank #3 by value)
  propertySalesUSD: 7.1,
  revenue:          12.43,  // AED Billion FY2025 AUDITED (+96% YoY)
  netProfit:        3.58,   // AED Billion +96% YoY AUDITED
  ebitda:           4.40,   // AED Billion FY2025 AUDITED (+84% YoY) — NOT 5.2
  grossProfit:      5.43,   // AED Billion FY2025 AUDITED (+89% YoY) — NOT 5.0
  grossMargin:      44,     // % FY2025
  netMargin:        29,     // %
  unitsDelivered:   12500,  // since inception
  unitsSold2025:    17000,  // Dubai's #1 by units
  underConstruction:38000,
  revenueBacklog:   14000,  // AED million at Q3 2025
  portfolioGDV:     100000, // AED million — "nearly AED 100B"
  totalAssets:      24370,  // AED million FY2025 AUDITED — NOT 22000 (that was FY2024)
  cash:             8840,   // AED million FY2025 AUDITED — NOT 9000
  projects2025:     90,     // "over 90 projects" per FY2025 press release — NOT 80
  rank:             "#3 Dubai by Sales Value · #1 by Units Sold",
  latestReportLabel:"FY2025 Annual Results",
  latestReportDate: "February 2026",
  source:           "Binghatti Official FY2025 Audited Results · Gulf News · Arabian Business · Zawya",
  updatedAt:        "2026-03-27",
};

export const binghattiCommunities = [
  { id:"business-bay-bb",  name:"Business Bay",    type:"Urban Towers",          avgPpsf:2200, avgGrossYield:7.2, highlights:["Core market","Bugatti Residences","Binghatti Skyrise","Canal views"] },
  { id:"downtown-dubai",   name:"Downtown Dubai",  type:"Luxury Urban",          avgPpsf:3800, avgGrossYield:5.8, highlights:["Mercedes-Benz Places Downtown","Burj Khalifa adjacent","Iconic address"] },
  { id:"jvc-bing",         name:"JVC",             type:"Affordable-Mid",         avgPpsf:1100, avgGrossYield:8.2, highlights:["High ROI","Binghatti Home","Binghatti Crest","Top-selling community"] },
  { id:"meydan-city",      name:"Meydan / Nad Al Sheba", type:"Masterplan",      avgPpsf:2400, avgGrossYield:6.5, highlights:["Mercedes-Benz Places Binghatti City","13,386 units","12 towers","AED 30B GDV"] },
  { id:"dubai-science-park",name:"Dubai Science Park", type:"Innovation District",avgPpsf:1300, avgGrossYield:7.8, highlights:["Tech-hub adjacent","Mid-market","High occupancy"] },
  { id:"al-jaddaf",        name:"Al Jaddaf",       type:"Waterfront",            avgPpsf:1800, avgGrossYield:7.0, highlights:["Creek views","Jacob & Co partnership","Arts district"] },
];

export const binghattiProjects = [
  { id:"binghatti-1",  developerId:"binghatti", name:"Bugatti Residences", officialUrl:"https://www.binghatti.com/en/projects/bugatti-residences/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/bugatti-residences",bayut:"https://www.bayut.com/buildings/bugatti-residences/"},              community:"Business Bay",     district:"BB",  type:"Apartments+PH", beds:"1–4BR+PH", status:"Under Construction", handover:"Q4 2026", price:9800000, sizeFrom:3200, sizeTo:35000, ppsf:3063, payment:"60/40", construction:75, branded:true,  brand:"Bugatti",       tier:"Ultra-Luxury",  source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:3200,sqftTo:5000,priceFrom:9800000},{type:"2BR",sqftFrom:6000,sqftTo:9000,priceFrom:18375000},{type:"3BR",sqftFrom:10000,sqftTo:15000,priceFrom:30625000},{type:"PH",sqftFrom:20000,sqftTo:35000,priceFrom:85312000}] },
  { id:"binghatti-2",  developerId:"binghatti", name:"Mercedes-Benz Places Downtown", officialUrl:"https://www.binghatti.com/en/projects/mercedes-benz-places/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/mercedes-benz-places",bayut:"https://www.bayut.com/buildings/mercedes-benz-places/"},   community:"Downtown Dubai",   district:"DT",  type:"Apartments+PH", beds:"2–4BR+PH", status:"Under Construction", handover:"Q4 2026", price:4500000, sizeFrom:1500, sizeTo:12000, ppsf:3000, payment:"60/40", construction:50, branded:true,  brand:"Mercedes-Benz", tier:"Ultra-Luxury",  source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"2BR",sqftFrom:1500,sqftTo:2000,priceFrom:4500000},{type:"3BR",sqftFrom:2500,sqftTo:3500,priceFrom:7500000},{type:"4BR PH",sqftFrom:7000,sqftTo:12000,priceFrom:21000000}] },
  { id:"binghatti-3",  developerId:"binghatti", name:"Mercedes-Benz Places Binghatti City", officialUrl:"https://www.binghatti.com/en/projects/mercedes-benz-places/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/mercedes-benz-places",bayut:"https://www.bayut.com/buildings/mercedes-benz-places/"},community:"Meydan",         district:"NAS", type:"Master Plan",   beds:"Studio–4BR",status:"Off Plan",           handover:"2029",   price:1500000, sizeFrom:400,  sizeTo:8000,  ppsf:3750, payment:"60/40", construction:0,  branded:true,  brand:"Mercedes-Benz", tier:"Mixed",         source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:400,sqftTo:550,priceFrom:1500000},{type:"1BR",sqftFrom:650,sqftTo:850,priceFrom:2437500},{type:"2BR",sqftFrom:1100,sqftTo:1400,priceFrom:4125000},{type:"3BR",sqftFrom:1700,sqftTo:2200,priceFrom:6375000}] },
  { id:"binghatti-4",  developerId:"binghatti", name:"Burj Binghatti Jacob & Co", officialUrl:"https://www.binghatti.com/en/projects/burj-binghatti-jacob-co/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/burj-binghatti-jacob-co",bayut:"https://www.bayut.com/buildings/burj-binghatti/"},       community:"Business Bay",     district:"BB",  type:"Apartments+PH", beds:"1–3BR+PH", status:"Under Construction", handover:"Q2 2026", price:8500000, sizeFrom:2000, sizeTo:15000, ppsf:4250, payment:"60/40", construction:85, branded:true,  brand:"Jacob & Co",    tier:"Ultra-Luxury",  source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:2000,sqftTo:2500,priceFrom:8500000},{type:"2BR",sqftFrom:3000,sqftTo:4000,priceFrom:12750000},{type:"3BR PH",sqftFrom:7000,sqftTo:15000,priceFrom:42500000}] },
  { id:"binghatti-5",  developerId:"binghatti", name:"Binghatti Skyrise", officialUrl:"https://www.binghatti.com/en/projects/binghatti-skyrise", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/binghatti-skyrise",bayut:"https://www.bayut.com/buildings/binghatti-skyrise/"},               community:"Business Bay",     district:"BB",  type:"Apartments",    beds:"Studio–3BR",status:"Under Construction", handover:"Q4 2026", price:850000,  sizeFrom:400,  sizeTo:2000,  ppsf:2125, payment:"60/40", construction:45, branded:false, brand:"—",             tier:"Mid-Premium",   source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:400,sqftTo:550,priceFrom:850000},{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1487500},{type:"2BR",sqftFrom:1100,sqftTo:1400,priceFrom:2337500},{type:"3BR",sqftFrom:1600,sqftTo:2000,priceFrom:3400000}] },
  { id:"binghatti-6",  developerId:"binghatti", name:"Binghatti Hills", officialUrl:"https://www.binghatti.com/en/projects/binghatti-hills", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/binghatti-hills",bayut:"https://www.bayut.com/buildings/binghatti-hills/"},                 community:"Dubai Science Park",district:"DSP", type:"Apartments",   beds:"Studio–3BR",status:"Under Construction", handover:"Q2 2027", price:700000,  sizeFrom:350,  sizeTo:1800,  ppsf:2000, payment:"60/40", construction:35, branded:false, brand:"—",             tier:"Mid-Market",    source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:350,sqftTo:500,priceFrom:700000},{type:"1BR",sqftFrom:650,sqftTo:850,priceFrom:1312500},{type:"2BR",sqftFrom:1100,sqftTo:1400,priceFrom:2200000},{type:"3BR",sqftFrom:1500,sqftTo:1800,priceFrom:3000000}] },
  { id:"binghatti-7",  developerId:"binghatti", name:"Binghatti Onyx", officialUrl:"https://www.binghatti.com/en/projects/binghatti-onyx", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/binghatti-onyx",bayut:"https://www.bayut.com/buildings/binghatti-onyx/"},                  community:"JVC",              district:"JVC", type:"Apartments",    beds:"Studio–2BR",status:"Under Construction", handover:"Q3 2026", price:500000,  sizeFrom:280,  sizeTo:1200,  ppsf:1786, payment:"60/40", construction:60, branded:false, brand:"—",             tier:"Mid-Market",    source:"Bayut",              confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:280,sqftTo:420,priceFrom:500000},{type:"1BR",sqftFrom:600,sqftTo:800,priceFrom:1071000},{type:"2BR",sqftFrom:950,sqftTo:1200,priceFrom:1700000}] },
  { id:"binghatti-8",  developerId:"binghatti", name:"Binghatti Aquarise", officialUrl:"https://www.binghatti.com/en/projects/binghatti-aquarise", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/binghatti-aquarise",bayut:"https://www.bayut.com/buildings/binghatti-aquarise/"},              community:"Business Bay",     district:"BB",  type:"Apartments",    beds:"Studio–2BR",status:"Under Construction", handover:"Q4 2026", price:900000,  sizeFrom:400,  sizeTo:1500,  ppsf:2250, payment:"60/40", construction:30, branded:false, brand:"—",             tier:"Mid-Premium",   source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:400,sqftTo:550,priceFrom:900000},{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1575000},{type:"2BR",sqftFrom:1100,sqftTo:1500,priceFrom:2475000}] },
  { id:"binghatti-9",  developerId:"binghatti", name:"Binghatti Amber", officialUrl:"https://www.binghatti.com/en/projects/binghatti-amberhall", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/binghatti-amberhall",bayut:"https://www.bayut.com/buildings/binghatti-amberhall/"},                 community:"JVC",              district:"JVC", type:"Apartments",    beds:"Studio–2BR",status:"Delivered",          handover:"Delivered",price:550000, sizeFrom:300,  sizeTo:1400,  ppsf:1833, payment:"N/A",   construction:100,branded:false, brand:"—",             tier:"Mid-Market",    source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:300,sqftTo:450,priceFrom:550000},{type:"1BR",sqftFrom:650,sqftTo:850,priceFrom:1009000},{type:"2BR",sqftFrom:1000,sqftTo:1400,priceFrom:1558000}] },
  { id:"binghatti-10", developerId:"binghatti", name:"Binghatti Azure", officialUrl:"https://www.binghatti.com/en/projects/binghatti-azure", links:{pf:"https://www.propertyfinder.ae/en/new-projects/binghatti-developers-fze/binghatti-azure",bayut:"https://www.bayut.com/buildings/binghatti-azure/"},                 community:"JVC",              district:"JVC", type:"Apartments",    beds:"Studio–2BR",status:"Delivered",          handover:"Delivered",price:480000, sizeFrom:280,  sizeTo:1200,  ppsf:1714, payment:"N/A",   construction:100,branded:false, brand:"—",             tier:"Mid-Market",    source:"Binghatti Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:280,sqftTo:400,priceFrom:480000},{type:"1BR",sqftFrom:600,sqftTo:800,priceFrom:823000},{type:"2BR",sqftFrom:900,sqftTo:1200,priceFrom:1234000}] },
];

export const binghattiRisks = [
  { factor:"Rapid Scale — 17,000 Units/Year Pace",     level:4, likelihood:3, impact:4, score:48, mitigation:"Vertically integrated. Strong cash AED 8.84B. Credit ratings BB- (Fitch) · Ba3 (Moody's) · RERA compliant.", assessment:"MODERATE", color:"#F59E0B" },
  { factor:"Affordable Segment Margin Pressure",        level:3, likelihood:3, impact:3, score:27, mitigation:"Portfolio diversification — ultra-luxury (Bugatti, Mercedes) offsets affordable margin compression.", assessment:"MODERATE", color:"#D4A843" },
  { factor:"Construction Delivery Risk (38K units)",    level:4, likelihood:3, impact:4, score:48, mitigation:"Track record 12,500+ delivered. 13 new projects FY2025 all on schedule. In-country contractor network.", assessment:"MODERATE", color:"#F59E0B" },
  { factor:"Branded Partnership Risk",                  level:2, likelihood:2, impact:4, score:16, mitigation:"Bugatti, Mercedes-Benz contracts signed. AED 550M penthouse sale validates ultra-luxury demand.", assessment:"LOW",      color:"#10B981" },
  { factor:"Market Concentration — Dubai Only",         level:3, likelihood:2, impact:3, score:18, mitigation:"80+ projects diversify across JVC, Business Bay, Downtown, Meydan, Science Park.", assessment:"LOW",      color:"#10B981" },
  { factor:"Currency Risk (AED Peg)",                   level:1, likelihood:1, impact:2, score:2,  mitigation:"USD peg stable.", assessment:"VERY LOW", color:"#10B981" },
  { factor:"Regulatory Risk",                           level:1, likelihood:1, impact:2, score:2,  mitigation:"Privately held. Fully RERA compliant. DIFC-registered LLC.", assessment:"VERY LOW", color:"#10B981" },
];

export const binghattiSegments = [
  { name:"Ultra-Luxury (Bugatti/MB)", revenue:4.8, growth:"+145%", color:"#3B82F6" },
  { name:"Premium (Business Bay)",    revenue:4.2, growth:"+82%",  color:"#8B5CF6" },
  { name:"Mid-Market (JVC/DSP)",      revenue:3.4, growth:"+65%",  color:"#00BFA5" },
];

export const binghattiRadar = [
  { metric:"Unit Volume",       binghatti:100,emaar:72, damac:85, market:70 },
  { metric:"Revenue Growth",    binghatti:98, emaar:65, damac:78, market:60 },
  { metric:"Brand Innovation",  binghatti:92, emaar:75, damac:88, market:65 },
  { metric:"Sales Speed",       binghatti:95, emaar:80, damac:90, market:70 },
  { metric:"Margin Quality",    binghatti:75, emaar:92, damac:78, market:70 },
  { metric:"Delivery Record",   binghatti:80, emaar:92, damac:82, market:72 },
  { metric:"Financial Strength",binghatti:72, emaar:95, damac:75, market:65 },
  { metric:"Community Scale",   binghatti:55, emaar:88, damac:90, market:68 },
];

export const binghattiYields = [
  { community:"JVC",          unit:"Apartments",  gross:8.2, net:6.2, avgRent:49200,  avgPrice:600000,  demand:"Very High" },
  { community:"Business Bay", unit:"Apartments",  gross:7.2, net:5.4, avgRent:64800,  avgPrice:900000,  demand:"Very High" },
  { community:"Downtown",     unit:"Apartments",  gross:5.8, net:4.4, avgRent:261000, avgPrice:4500000, demand:"High" },
  { community:"Dubai Sci Pk", unit:"Apartments",  gross:7.8, net:5.9, avgRent:54600,  avgPrice:700000,  demand:"High" },
];

export const binghattiMegaProjects = [
  { name:"Mercedes-Benz Places Binghatti City", scale:"AED 30B GDV", units:"13,386", sqft:"10M sqft", timeline:"Launched Jan 2026 · 2029 delivery", status:"Off Plan", record:"World's first Mercedes-Benz branded city" },
  { name:"Bugatti Residences",                  scale:"AED 2B+ GDV", units:"182",    sqft:"Business Bay", timeline:"2023–Q4 2026", status:"Under Construction", record:"AED 550M penthouse — most expensive Middle East" },
  { name:"Binghatti Skyrise",                   scale:"AED 8B GDV",  units:"3,333",  sqft:"Business Bay", timeline:"2024–Q4 2026", status:"Under Construction", record:"3,333 units single project" },
];

export default { identity:binghattiIdentity, live:binghattiLive, financialHistory:binghattiFinancialHistory, communities:binghattiCommunities, projects:binghattiProjects, risks:binghattiRisks, segments:binghattiSegments, radar:binghattiRadar, megaProjects:binghattiMegaProjects, yields:binghattiYields };
