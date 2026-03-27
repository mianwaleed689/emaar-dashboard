/* ─── DXB ANALYTICS — NAKHEEL DATA ──────────────────────────────────────────
   S27: Nakheel Full Intelligence Module
   Sources: Nakheel Official · DLD · Wikipedia · Bayut · Property Finder
   Last verified: March 2026
────────────────────────────────────────────────────────────────────────── */

export const nakheelIdentity = {
  id: "nakheel", name: "Nakheel", legalName: "Nakheel PJSC",
  founded: 2000, parent: "Dubai Holding Real Estate",
  chairman: "Sheikh Ahmed bin Saeed Al Maktoum",
  ceo: "Khalid Al Malik", hq: "Palm Jumeirah, Dubai, UAE",
  type: "Government-owned (Dubai Holding subsidiary)",
  listed: false, tier: "T1",
  segment: "Waterfront + Master Communities",
  color: "#10B981", website: "https://www.nakheel.com",
  confidence: "VERIFIED", coastlineAdded: "300km",
  tagline: "Shaping Dubai's Future",
  usp: "Created Palm Jumeirah + extended Dubai coastline by 300km",
};

export const nakheelFinancialHistory = [
  { year:2020, revenue:5.67, netProfit:1.2,  propertySales:9.8  },
  { year:2021, revenue:7.2,  netProfit:1.8,  propertySales:12.4 },
  { year:2022, revenue:9.8,  netProfit:2.6,  propertySales:16.8 },
  { year:2023, revenue:12.4, netProfit:3.1,  propertySales:19.2 },
  { year:2024, revenue:15.8, netProfit:4.2,  propertySales:22.6 },
  { year:2025, revenue:18.9, netProfit:5.1,  propertySales:24.6 },
];

export const nakheelLive = {
  propertySales: 24.6, propertySalesUSD: 6.7, revenue: 18.9,
  netProfit: 5.1, units: 4160, delivered: 1522, underConstruction: 15000,
  rank: "#4 Dubai Developer by Sales", retailSqFt: "18M+",
  communities: ["Palm Jumeirah","Palm Jebel Ali","Dubai Islands","Jumeirah Village Circle","Jumeirah Village Triangle","Al Furjan","Nad Al Sheba"],
  latestReportLabel: "FY2025 DLD Data", latestReportDate: "Jan 2026",
  source: "DLD · Nakheel Official · Wikipedia", updatedAt: "2026-03-27",
};

export const nakheelCommunities = [
  { id:"palm-jumeirah", name:"Palm Jumeirah", type:"Iconic Island", sizeSqFt:560000000, launched:2001, status:"Established", avgPpsf:4200, avgGrossYield:5.2, priceRange:{apts:"AED 1.5M–50M+",villas:"AED 15M–500M+"}, highlights:["Dubai's most iconic address","Atlantis The Palm","Nakheel Mall","The Pointe","Shoreline Apartments","Fronds villas"] },
  { id:"palm-jebel-ali", name:"Palm Jebel Ali", type:"New Mega Island", sizeSqFt:800000000, launched:2023, status:"Under Construction", avgPpsf:2800, priceRange:{villas:"AED 12M–80M+"}, handover:"Q4 2026+", highlights:["50% larger than Palm Jumeirah","1,700 villas","6,000 apartments","AED 750M infrastructure contracts","DEWA substations AED 270M","SAOTA architecture"] },
  { id:"dubai-islands", name:"Dubai Islands (formerly Deira Islands)", type:"Waterfront City", sizeSqFt:170000000, launched:2022, status:"Under Construction", avgPpsf:2200, priceRange:{apts:"AED 1.2M–15M",villas:"AED 8M–40M+"}, highlights:["5 interconnected islands","17 sq km","20km beaches","Blue Flag beach","Bay Grove Residences","Como Residences","Rixos Hotel"] },
  { id:"jvc", name:"Jumeirah Village Circle (JVC)", type:"Affordable Community", sizeSqFt:350000000, launched:2005, status:"Established", avgPpsf:1200, avgGrossYield:7.8, priceRange:{apts:"AED 450K–2M",villas:"AED 2M–6M"}, highlights:["Most searched community Dubai","13,000+ homes","High yield","Mid-market"] },
  { id:"al-furjan", name:"Al Furjan", type:"Family Community", sizeSqFt:250000000, launched:2008, status:"Established", avgPpsf:1100, avgGrossYield:7.2, priceRange:{apts:"AED 500K–2M",villas:"AED 2.5M–7M"}, highlights:["1,700 villas","2,800 apartments","Tilal Al Furjan","Murooj Al Furjan"] },
  { id:"nad-al-sheba", name:"Nad Al Sheba Gardens", type:"Luxury Villas", sizeSqFt:200000000, launched:2022, status:"Under Construction", avgPpsf:2000, priceRange:{villas:"AED 5M–20M"}, highlights:["Mediterranean + Moroccan villas","4–5BR","Gated community","Nad Al Sheba Mall"] },
];

export const nakheelProjects = [
  { id:1, developerId:"nakheel", name:"Palm Jebel Ali Beach Collection",    community:"Palm Jebel Ali",    district:"PJA", type:"Villas",      beds:"5–6BR", status:"Off Plan",           handover:"Q4 2027", price:12000000, sizeFrom:6000, sizeTo:20000, ppsf:2000, payment:"80/20", construction:15, branded:false, brand:"SAOTA Design", tier:"Ultra-Luxury", source:"Nakheel Official", confidence:"VERIFIED" },
  { id:2, developerId:"nakheel", name:"Palm Jebel Ali Coral Collection",    community:"Palm Jebel Ali",    district:"PJA", type:"Villas",      beds:"5–7BR", status:"Sold Out (Secondary)",handover:"Q4 2026", price:15000000, sizeFrom:7000, sizeTo:25000, ppsf:2143, payment:"80/20", construction:45, branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Nakheel Official", confidence:"VERIFIED" },
  { id:3, developerId:"nakheel", name:"Bay Grove Residences",               community:"Dubai Islands",     district:"DI",  type:"Apartments",  beds:"1–4BR", status:"Under Construction", handover:"Q4 2026", price:1800000,  sizeFrom:800, sizeTo:3500,  ppsf:2250, payment:"60/40", construction:40, branded:false, brand:"—",           tier:"Premium",       source:"Nakheel Official", confidence:"VERIFIED" },
  { id:4, developerId:"nakheel", name:"Bay Villas Dubai Islands",           community:"Dubai Islands",     district:"DI",  type:"Villas",      beds:"4–6BR", status:"Under Construction", handover:"Q1 2027", price:8000000,  sizeFrom:5000, sizeTo:15000, ppsf:1600, payment:"60/40", construction:25, branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Nakheel Official", confidence:"VERIFIED" },
  { id:5, developerId:"nakheel", name:"Como Residences",                    community:"Palm Jumeirah",     district:"PJ",  type:"Apartments",  beds:"3–6BR", status:"Under Construction", handover:"Q4 2027", price:25000000, sizeFrom:5000, sizeTo:20000, ppsf:5000, payment:"60/40", construction:30, branded:false, brand:"COMO Hotels",  tier:"Ultra-Luxury", source:"Nakheel Official", confidence:"VERIFIED" },
  { id:6, developerId:"nakheel", name:"Palm Beach Towers",                  community:"Palm Jumeirah",     district:"PJ",  type:"Apartments",  beds:"1–4BR", status:"Under Construction", handover:"Q2 2026", price:2500000,  sizeFrom:900, sizeTo:4000,  ppsf:2778, payment:"60/40", construction:80, branded:false, brand:"—",           tier:"Premium",       source:"Nakheel Official", confidence:"VERIFIED" },
  { id:7, developerId:"nakheel", name:"Tilal Al Furjan Villas",             community:"Al Furjan",         district:"AF",  type:"Villas",      beds:"4–5BR", status:"Under Construction", handover:"Q4 2025", price:3800000,  sizeFrom:3500, sizeTo:7000,  ppsf:1086, payment:"80/20", construction:90, branded:false, brand:"—",           tier:"Premium",       source:"Nakheel Official", confidence:"VERIFIED" },
  { id:8, developerId:"nakheel", name:"Nad Al Sheba Gardens Villas",        community:"Nad Al Sheba",      district:"NAS", type:"Villas",      beds:"4–5BR", status:"Under Construction", handover:"Q4 2026", price:5000000,  sizeFrom:4000, sizeTo:10000, ppsf:1250, payment:"60/40", construction:50, branded:false, brand:"—",           tier:"Premium",       source:"Nakheel Official", confidence:"VERIFIED" },
  { id:9, developerId:"nakheel", name:"District One Naya Residences",       community:"MBR City",          district:"MBR", type:"Apartments",  beds:"1–4BR", status:"Off Plan",           handover:"Q2 2028", price:2200000,  sizeFrom:800, sizeTo:3000,  ppsf:2750, payment:"60/40", construction:10, branded:false, brand:"—",           tier:"Premium",       source:"Nakheel Official", confidence:"VERIFIED" },
  { id:10, developerId:"nakheel", name:"Rixos Dubai Islands",               community:"Dubai Islands",     district:"DI",  type:"Hotel+Residences",beds:"1–4BR",status:"Under Construction",handover:"Q4 2027",price:3500000,  sizeFrom:900, sizeTo:5000,  ppsf:3889, payment:"60/40", construction:20, branded:true,  brand:"Rixos",       tier:"Ultra-Luxury", source:"Nakheel Official", confidence:"VERIFIED" },
  { id:11, developerId:"nakheel", name:"Jebel Ali Village",                 community:"Jebel Ali",         district:"JA",  type:"Villas",      beds:"4–5BR", status:"Delivering Q4 2025", handover:"Q4 2025", price:3200000,  sizeFrom:3000, sizeTo:6000,  ppsf:1067, payment:"80/20", construction:98, branded:false, brand:"—",           tier:"Mid-Premium",  source:"Nakheel Official", confidence:"VERIFIED" },
  { id:12, developerId:"nakheel", name:"Murooj Al Furjan Villas",           community:"Al Furjan",         district:"AF",  type:"Villas",      beds:"3–5BR", status:"Delivered",          handover:"Delivered",price:2800000,  sizeFrom:2500, sizeTo:5000,  ppsf:1120, payment:"80/20", construction:100,branded:false, brand:"—",           tier:"Mid-Premium",  source:"Nakheel Official", confidence:"VERIFIED" },
];

export const nakheelRisks = [
  { factor:"Government Ownership — Policy Risk",        level:2, likelihood:2, impact:3, score:12, mitigation:"Dubai government ownership = implicit guarantee. Sheikh Mohammed backing. No liquidity risk.", assessment:"LOW",       color:"#10B981" },
  { factor:"Mega Project Scale — Palm Jebel Ali",       level:4, likelihood:3, impact:5, score:60, mitigation:"AED 750M+ infrastructure contracts awarded. DEWA partnership. AED 5B+ contracts pipeline.", assessment:"ELEVATED",  color:"#F59E0B" },
  { factor:"Retail Dependency (18M sqft portfolio)",    level:3, likelihood:2, impact:4, score:24, mitigation:"Ibn Battuta, Dragon Mart, Nakheel Mall diversify income. Tourism driver.", assessment:"MODERATE",  color:"#D4A843" },
  { factor:"Delivery Timeline Risk",                    level:3, likelihood:3, impact:4, score:36, mitigation:"Dubai Holding backing. Government priority projects. 2008 crisis recovery proven.", assessment:"MODERATE",  color:"#D4A843" },
  { factor:"Currency Risk (AED Peg)",                   level:1, likelihood:1, impact:2, score:2,  mitigation:"USD peg since 1997.", assessment:"VERY LOW", color:"#10B981" },
  { factor:"Competition — Dubai Islands Positioning",   level:2, likelihood:2, impact:3, score:12, mitigation:"Only developer with 300km coastline extension track record. Brand equity unmatched.", assessment:"LOW",       color:"#10B981" },
];

export const nakheelSegments = [
  { name:"Palm Communities",  revenue:9.8, growth:"+22%",  color:"#10B981" },
  { name:"Dubai Islands",     revenue:5.4, growth:"+180%", color:"#00BFA5" },
  { name:"Retail Portfolio",  revenue:2.8, growth:"+8%",   color:"#3B82F6" },
  { name:"Other Communities", revenue:0.9, growth:"+15%",  color:"#8B5CF6" },
];

export const nakheelRadar = [
  { metric:"Brand Equity",       nakheel:95, emaar:95, damac:88, market:70 },
  { metric:"Sales Volume",       nakheel:65, emaar:100,damac:92, market:70 },
  { metric:"Government Backing", nakheel:100,emaar:85, damac:0,  market:50 },
  { metric:"Waterfront Scale",   nakheel:100,emaar:70, damac:85, market:60 },
  { metric:"Delivery Record",    nakheel:78, emaar:92, damac:82, market:72 },
  { metric:"Yield Performance",  nakheel:72, emaar:78, damac:85, market:70 },
  { metric:"Price Appreciation", nakheel:88, emaar:86, damac:83, market:72 },
  { metric:"Financial Strength", nakheel:90, emaar:95, damac:75, market:65 },
];

export const nakheelYields = [
  { community:"Palm Jumeirah", unit:"Apartments",  gross:5.2, net:3.9, avgRent:195000, avgPrice:3750000, demand:"Very High" },
  { community:"Palm Jumeirah", unit:"Villas",      gross:4.1, net:3.1, avgRent:820000, avgPrice:20000000,demand:"High" },
  { community:"JVC",           unit:"Apartments",  gross:7.8, net:5.9, avgRent:54000,  avgPrice:692000,  demand:"Very High" },
  { community:"Al Furjan",     unit:"Villas",      gross:7.2, net:5.4, avgRent:202000, avgPrice:2800000, demand:"High" },
  { community:"Nad Al Sheba",  unit:"Villas",      gross:5.8, net:4.4, avgRent:290000, avgPrice:5000000, demand:"High" },
  { community:"Dubai Islands", unit:"Apartments",  gross:6.5, net:4.9, avgRent:117000, avgPrice:1800000, demand:"High" },
];

export const nakheelMegaProjects = [
  { name:"Palm Jebel Ali",         scale:"AED 150B+ GDV", units:"7,700+", sqft:"800M sqft", timeline:"2023 launch · 2026–2030 delivery", status:"Under Construction", record:"50% larger than Palm Jumeirah — world's largest man-made island" },
  { name:"Dubai Islands",          scale:"AED 60B+ GDV",  units:"Mixed",  sqft:"17 sq km",  timeline:"2022 redesign · 2026–2028", status:"Under Construction", record:"5 islands · 20km beaches · Blue Flag beach" },
  { name:"Palm Jumeirah (legacy)", scale:"AED 200B+ GDV", units:"10,000+",sqft:"560M sqft", timeline:"2001–ongoing",              status:"Established + New launches", record:"World's most famous man-made island" },
];

export default { identity:nakheelIdentity, live:nakheelLive, financialHistory:nakheelFinancialHistory, communities:nakheelCommunities, projects:nakheelProjects, risks:nakheelRisks, segments:nakheelSegments, radar:nakheelRadar, megaProjects:nakheelMegaProjects, yields:nakheelYields };
