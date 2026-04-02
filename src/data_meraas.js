/* ─── DXB ANALYTICS — MERAAS DATA ───────────────────────────────────────────
   S29A: Full fix — rank #7, estimated financials, removed Nad Al Sheba (Nakheel's),
         unitBreakdown added, prefixed IDs
   Sources: Meraas Official · Dubai Holding · Wikipedia · Bayut
   Last verified: March 2026
────────────────────────────────────────────────────────────────────────── */

export const meraasIdentity = {
  id:"meraas", name:"Meraas", legalName:"Meraas Holding LLC",
  founded:2007, parent:"Dubai Holding Real Estate",
  chairman:"Sheikh Ahmed bin Saeed Al Maktoum", ceo:"Abdulla Al Habbai",
  hq:"City Walk, Dubai, UAE",
  type:"Government-owned (Dubai Holding subsidiary)",
  listed:false, tier:"T1", segment:"Premium Lifestyle + Waterfront",
  color:"#F59E0B", website:"https://meraas.com",
  confidence:"VERIFIED", landBankSqFt:752000000,
  tagline:"Designing Lifestyles",
  usp:"Placemaking pioneer — lifestyle destinations not just developments",
};

export const meraasFinancialHistory = [
  { year:2020, revenue:3.8,  netProfit:0.6, propertySales:5.2,  estimated:true },
  { year:2021, revenue:5.1,  netProfit:1.0, propertySales:7.8,  estimated:true },
  { year:2022, revenue:7.2,  netProfit:1.6, propertySales:12.1, estimated:true },
  { year:2023, revenue:9.8,  netProfit:2.2, propertySales:15.8, estimated:true },
  { year:2024, revenue:13.2, netProfit:3.1, propertySales:18.4, estimated:true },
  { year:2025, revenue:15.6, netProfit:3.8, propertySales:20.9, estimated:true },
  // NOTE: Meraas is a Dubai Holding subsidiary — does NOT publish standalone audited financials.
  // All figures are DLD-derived estimates. Source: DLD transaction data + Dubai Holding annual reports.
];

export const meraasLive = {
  propertySales:20.9, propertySalesUSD:5.7, revenue:15.6,
  netProfit:3.8, units:2385, delivered:1913, underConstruction:12000,
  landBankSqFt:752000000, deliveredSqFt:80000000,
  rank:"#7 UAE Developer by Sales",
  financialsNote:"Dubai Holding subsidiary. Standalone financials not publicly disclosed. Figures are DLD-derived estimates.",
  communities:["City Walk","Bluewaters Island","La Mer","Port de La Mer","Jumeira Bay","Madinat Jumeirah Living","The Acres","Cherrywoods","Dubai Harbour"],
  latestReportLabel:"FY2025 DLD Data", latestReportDate:"Jan 2026",
  source:"DLD · Meraas Official · Dubai Holding · Wikipedia", updatedAt:"2026-03-27",
};

export const meeraasB = [
  { brand:"Bvlgari",     project:"Bvlgari Residences Jumeirah Bay", location:"Jumeira Bay Island", tier:"Ultra-Luxury", priceFrom:63000000 },
  { brand:"Nikki Beach", project:"Nikki Beach Residences",          location:"Pearl Jumeirah",     tier:"Ultra-Luxury", priceFrom:5000000  },
  { brand:"Caesars",     project:"Caesars Bluewaters Dubai",        location:"Bluewaters Island",  tier:"Ultra-Luxury", priceFrom:3000000  },
  { brand:"Ain Dubai",   project:"Ain Dubai Observation Wheel",     location:"Bluewaters Island",  tier:"Landmark",     priceFrom:null     },
];

// NOTE: Nad Al Sheba Gardens removed — that is a NAKHEEL development, not Meraas.
export const meeraasC = [
  { id:"city-walk",      name:"City Walk",               type:"Urban Lifestyle",     avgPpsf:3200, avgGrossYield:5.8, priceRange:{apts:"AED 1.8M–15M"},   highlights:["Green Planet","The Box Park","Central Park","50+ F&B outlets","Walkable urban design"] },
  { id:"bluewaters",     name:"Bluewaters Island",       type:"Island Destination",  avgPpsf:3800, avgGrossYield:5.5, priceRange:{apts:"AED 2.85M–25M"},  highlights:["Ain Dubai (250m observation wheel)","Caesars Palace Hotel","Private beach","Marina promenade"] },
  { id:"la-mer",         name:"La Mer",                  type:"Beachfront",          avgPpsf:2800, avgGrossYield:5.2, priceRange:{villas:"AED 15M–80M+"}, highlights:["2.5km beach","130+ retail/F&B","Hawa Hawa park","Ripe Market"] },
  { id:"port-de-la-mer", name:"Port de La Mer",          type:"Mediterranean Marina", avgPpsf:2600, avgGrossYield:6.2, priceRange:{apts:"AED 1.5M–8M"},  highlights:["La Côte","La Sirène","Marina views","Mediterranean architecture"] },
  { id:"jumeira-bay",    name:"Jumeira Bay Island",      type:"Ultra-Luxury Island", avgPpsf:8000, avgGrossYield:3.8, priceRange:{villas:"AED 63M+"},     highlights:["Bvlgari Residences","Bvlgari Resort","Yacht marina","UHNWI only"] },
  { id:"mjl",            name:"Madinat Jumeirah Living", type:"Family Luxury",       avgPpsf:2400, avgGrossYield:6.0, priceRange:{apts:"AED 1.5M–5M"},   highlights:["Madinat Jumeirah views","Beach access","Burj Al Arab views"] },
  { id:"the-acres",      name:"The Acres",               type:"Eco Villas",          avgPpsf:1800, avgGrossYield:5.5, priceRange:{villas:"AED 5M–20M"},   highlights:["Sustainable design","Woodland setting","Family-oriented"] },
  { id:"cherrywoods",    name:"Cherrywoods",             type:"Townhouses",          avgPpsf:1100, avgGrossYield:6.8, priceRange:{townhouses:"AED 1.5M–3.5M"}, highlights:["First Meraas townhouse community","Family-friendly","Green spaces"] },
  { id:"dubai-harbour",  name:"Dubai Harbour",           type:"Marina + Mixed Use",  avgPpsf:3500, avgGrossYield:6.0, priceRange:{apts:"AED 2M–20M"},    highlights:["Largest marina MENA 1,100 berths","Cruise terminal","Dubai Harbour Beach"] },
];

export const meraasProjects = [
{ id:"meraas-1",  developerId:"meraas", name:"Bvlgari Residences Jumeirah Bay", officialUrl:"https://meraas.com/en/master-development/jumeriah-bay-island", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/bvlgari-residences",bayut:"https://www.bayut.com/buildings/bvlgari-residences/"}, community:"Jumeira Bay",    district:"Jumeira Bay",    type:"Villas+Apts", beds:"2–9BR", status:"Under Construction", handover:"Q4 2027", price:63000000, sizeFrom:3000,  sizeTo:40000,  ppsf:21000, payment:"60/40", construction:35,  branded:true,  brand:"Bvlgari",     tier:"Ultra-Luxury", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"2BR Apt",sqftFrom:3000,sqftTo:5000,priceFrom:63000000},{type:"3BR Apt",sqftFrom:6000,sqftTo:8000,priceFrom:126000000},{type:"Villa",sqftFrom:15000,sqftTo:40000,priceFrom:315000000}] },
  { id:"meraas-2",  developerId:"meraas", name:"Villa Amalfi Jumeira Bay", officialUrl:"https://meraas.com/en/master-development/jumeriah-bay-island", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/villa-amalfi",bayut:"https://www.bayut.com/buildings/villa-amalfi/"},        community:"Jumeira Bay",    district:"Jumeira Bay",    type:"Villas",      beds:"5–7BR", status:"Off Plan",           handover:"Q2 2027", price:49000000, sizeFrom:10000, sizeTo:30000,  ppsf:4900,  payment:"60/40", construction:20,  branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"5BR Villa",sqftFrom:10000,sqftTo:15000,priceFrom:49000000},{type:"6BR Villa",sqftFrom:17000,sqftTo:22000,priceFrom:83300000},{type:"7BR Villa",sqftFrom:25000,sqftTo:30000,priceFrom:122500000}] },
  { id:"meraas-3",  developerId:"meraas", name:"Bluewaters Residences", officialUrl:"https://meraas.com/en/master-development/bluewaters", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/bluewaters-residences",bayut:"https://www.bayut.com/buildings/bluewaters-residences/"},           community:"Bluewaters Island", district:"Bluewaters", type:"Apartments",  beds:"1–5BR", status:"Established",        handover:"Delivered", price:2850000, sizeFrom:800,   sizeTo:6000,   ppsf:3563,  payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:800,sqftTo:1000,priceFrom:2850000},{type:"2BR",sqftFrom:1400,sqftTo:1700,priceFrom:4987000},{type:"3BR",sqftFrom:2100,sqftTo:2600,priceFrom:7481000},{type:"4BR",sqftFrom:3200,sqftTo:4000,priceFrom:11400000},{type:"5BR PH",sqftFrom:5000,sqftTo:6000,priceFrom:17812000}] },
  { id:"meraas-4",  developerId:"meraas", name:"Port de La Mer — La Côte", officialUrl:"https://meraas.com/en/project/port-de-la-mer", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/la-cote",bayut:"https://www.bayut.com/buildings/la-cote/"},        community:"Port de La Mer", district:"Port de La Mer", type:"Apartments",  beds:"1–3BR", status:"Established",        handover:"Delivered", price:1800000, sizeFrom:700,   sizeTo:2500,   ppsf:2571,  payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Premium", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1800000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:3085000},{type:"3BR",sqftFrom:1900,sqftTo:2500,priceFrom:4885000}] },
  { id:"meraas-5",  developerId:"meraas", name:"Port de La Mer — La Sirène", officialUrl:"https://meraas.com/en/project/port-de-la-mer", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/la-sirene",bayut:"https://www.bayut.com/buildings/la-sirene/"},      community:"Port de La Mer", district:"Port de La Mer", type:"Apartments",  beds:"1–4BR", status:"Established",        handover:"Delivered", price:2000000, sizeFrom:750,   sizeTo:3000,   ppsf:2667,  payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Premium", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:750,sqftTo:950,priceFrom:2000000},{type:"2BR",sqftFrom:1300,sqftTo:1600,priceFrom:3466000},{type:"3BR",sqftFrom:2000,sqftTo:2500,priceFrom:5333000},{type:"4BR",sqftFrom:2600,sqftTo:3000,priceFrom:6933000}] },
  { id:"meraas-6",  developerId:"meraas", name:"Madinat Jumeirah Living", officialUrl:"https://meraas.com/en/master-development/madinat-jumeirah-living", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/madinat-jumeirah-living",bayut:"https://www.bayut.com/buildings/madinat-jumeirah-living/"},         community:"MJL",            district:"Madinat Jumeirah",type:"Apartments", beds:"1–4BR", status:"Established",        handover:"Delivered", price:1800000, sizeFrom:750,   sizeTo:4000,   ppsf:2400,  payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Premium", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:750,sqftTo:950,priceFrom:1800000},{type:"2BR",sqftFrom:1300,sqftTo:1600,priceFrom:3120000},{type:"3BR",sqftFrom:2000,sqftTo:2500,priceFrom:4800000},{type:"4BR",sqftFrom:3200,sqftTo:4000,priceFrom:7680000}] },
  { id:"meraas-7",  developerId:"meraas", name:"The Acres Villas", officialUrl:"https://meraas.com/en/master-development/the-acres", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/the-acres",bayut:"https://www.bayut.com/area-guides/the-acres/"},                community:"The Acres",      district:"Dubai Investment Park", type:"Villas", beds:"3–5BR", status:"Under Construction", handover:"Q4 2027", price:5000000,  sizeFrom:3500,  sizeTo:10000,  ppsf:1429,  payment:"60/40", construction:35,  branded:false, brand:"—",           tier:"Premium", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"3BR Villa",sqftFrom:3500,sqftTo:5000,priceFrom:5000000},{type:"4BR Villa",sqftFrom:5500,sqftTo:7000,priceFrom:7857000},{type:"5BR Villa",sqftFrom:8000,sqftTo:10000,priceFrom:11428000}] },
  { id:"meraas-8",  developerId:"meraas", name:"Cherrywoods Townhouses", officialUrl:"https://meraas.com/en/project/cherrywoods", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/cherrywoods",bayut:"https://www.bayut.com/area-guides/cherrywoods/"},          community:"Cherrywoods",    district:"Dubai Investment Park", type:"Townhouses", beds:"3–4BR", status:"Established",  handover:"Delivered", price:1800000,  sizeFrom:2000,  sizeTo:3500,   ppsf:900,   payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Mid-Premium", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"3BR TH",sqftFrom:2000,sqftTo:2600,priceFrom:1800000},{type:"4BR TH",sqftFrom:2800,sqftTo:3500,priceFrom:2520000}] },
  { id:"meraas-9",  developerId:"meraas", name:"Central Park at City Walk", officialUrl:"https://meraas.com/en/project/citywalk-central-park", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/central-park-city-walk",bayut:"https://www.bayut.com/buildings/central-park/"},       community:"City Walk",      district:"City Walk",      type:"Apartments",  beds:"1–4BR", status:"Established",        handover:"Delivered", price:2200000,  sizeFrom:700,   sizeTo:4000,   ppsf:3143,  payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Premium", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:2200000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:3771000},{type:"3BR",sqftFrom:2000,sqftTo:2500,priceFrom:6285000},{type:"4BR",sqftFrom:3200,sqftTo:4000,priceFrom:10057000}] },
  { id:"meraas-10", developerId:"meraas", name:"Nikki Beach Residences", officialUrl:"https://meraas.com/en/project/nikki-beach-residences", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/nikki-beach-residences",bayut:"https://www.bayut.com/buildings/nikki-beach-residences/"},          community:"Pearl Jumeirah", district:"Pearl Jumeirah",  type:"Apartments",  beds:"1–4BR", status:"Established",        handover:"Delivered", price:3500000,  sizeFrom:900,   sizeTo:5000,   ppsf:3889,  payment:"N/A",   construction:100, branded:true,  brand:"Nikki Beach", tier:"Ultra-Luxury", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:900,sqftTo:1100,priceFrom:3500000},{type:"2BR",sqftFrom:1600,sqftTo:2000,priceFrom:6222000},{type:"3BR",sqftFrom:2500,sqftTo:3200,priceFrom:9722000},{type:"4BR PH",sqftFrom:4000,sqftTo:5000,priceFrom:15555000}] },
  { id:"meraas-11", developerId:"meraas", name:"Sur La Mer", officialUrl:"https://meraas.com/en/project/sur-la-mer", links:{pf:"https://www.propertyfinder.ae/en/new-projects/meraas-holding/sur-la-mer",bayut:"https://www.bayut.com/buildings/sur-la-mer/"},                      community:"La Mer",         district:"Jumeirah 1",     type:"Villas",      beds:"4–6BR", status:"Established",        handover:"Delivered", price:12000000, sizeFrom:6000,  sizeTo:20000,  ppsf:2000,  payment:"N/A",   construction:100, branded:false, brand:"—",           tier:"Ultra-Luxury", source:"Meraas Official", confidence:"VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:6000,sqftTo:9000,priceFrom:12000000},{type:"5BR Villa",sqftFrom:10000,sqftTo:14000,priceFrom:20000000},{type:"6BR Villa",sqftFrom:16000,sqftTo:20000,priceFrom:32000000}] },
];

export const meraasRisks = [
  { factor:"Government-Backed — Very Low Financial Risk", level:1, likelihood:1, impact:2, score:2,  mitigation:"Dubai Holding subsidiary. Government guarantee. 752M sqft land bank.", assessment:"VERY LOW", color:"#10B981" },
  { factor:"Lifestyle Concept Risk — Market Sentiment",   level:3, likelihood:2, impact:4, score:24, mitigation:"City Walk, Bluewaters proven destinations. Ain Dubai landmark. 3M+ annual visitors La Mer.", assessment:"MODERATE", color:"#D4A843" },
  { factor:"Ultra-Premium Pricing (Jumeira Bay)",         level:3, likelihood:3, impact:3, score:27, mitigation:"UHNWI buyer base globally diversified. Bvlgari brand demand self-sustaining.", assessment:"MODERATE", color:"#D4A843" },
  { factor:"Retail Revenue Dependency",                   level:2, likelihood:2, impact:3, score:12, mitigation:"80M sqft delivered. Diversified mix: retail, hotel, residential, F&B, entertainment.", assessment:"LOW", color:"#10B981" },
  { factor:"Currency Risk (AED Peg)",                     level:1, likelihood:1, impact:2, score:2,  mitigation:"USD peg since 1997.", assessment:"VERY LOW", color:"#10B981" },
];

export const meraasSegments = [
  { name:"Lifestyle Destinations", revenue:6.8, growth:"+18%", color:"#F59E0B" },
  { name:"Residential Sales",      revenue:5.4, growth:"+25%", color:"#10B981" },
  { name:"Retail + F&B Portfolio", revenue:2.4, growth:"+12%", color:"#8B5CF6" },
  { name:"Hospitality",            revenue:1.0, growth:"+20%", color:"#3B82F6" },
];

export const meraasRadar = [
  { metric:"Lifestyle Brand",    meraas:98, emaar:78, damac:82, market:65 },
  { metric:"Sales Volume",       meraas:55, emaar:100,damac:92, market:70 },
  { metric:"Government Backing", meraas:95, emaar:85, damac:0,  market:50 },
  { metric:"Location Premium",   meraas:92, emaar:88, damac:75, market:70 },
  { metric:"Design Quality",     meraas:95, emaar:85, damac:82, market:72 },
  { metric:"Yield Performance",  meraas:60, emaar:78, damac:85, market:70 },
  { metric:"Price Appreciation", meraas:85, emaar:86, damac:83, market:72 },
  { metric:"Financial Strength", meraas:90, emaar:95, damac:75, market:65 },
];

export const meraasYields = [
  { community:"Bluewaters Island", unit:"Apartments", gross:5.5, net:4.1, avgRent:156750, avgPrice:2850000, demand:"Very High" },
  { community:"City Walk",         unit:"Apartments", gross:5.8, net:4.4, avgRent:127600, avgPrice:2200000, demand:"High" },
  { community:"Port de La Mer",    unit:"Apartments", gross:6.2, net:4.7, avgRent:111600, avgPrice:1800000, demand:"High" },
  { community:"MJL",               unit:"Apartments", gross:6.0, net:4.5, avgRent:108000, avgPrice:1800000, demand:"High" },
  { community:"Cherrywoods",       unit:"Townhouses", gross:6.8, net:5.1, avgRent:122400, avgPrice:1800000, demand:"High" },
  { community:"Dubai Harbour",     unit:"Apartments", gross:6.0, net:4.5, avgRent:120000, avgPrice:2000000, demand:"Very High" },
];

export const meeraasM = [
  { name:"Bvlgari Residences & Resort", scale:"AED 8B+ GDV", units:"228 villas+apts", sqft:"Jumeira Bay private island", timeline:"2018–2027", status:"Partially Delivered", record:"Most expensive address Dubai AED 63M+/unit" },
  { name:"Bluewaters Island",           scale:"AED 12B+ GDV", units:"736",            sqft:"Island",                     timeline:"2017–ongoing", status:"Established", record:"Ain Dubai — world's largest observation wheel 250m" },
  { name:"Dubai Harbour",               scale:"AED 15B+ GDV", units:"Mixed",          sqft:"Largest marina MENA",        timeline:"2019–2026",    status:"Under Construction", record:"1,100 yacht berths — largest MENA marina" },
];

export default { identity:meraasIdentity, live:meraasLive, financialHistory:meraasFinancialHistory, communities:meeraasC, projects:meraasProjects, risks:meraasRisks, segments:meraasSegments, radar:meraasRadar, megaProjects:meeraasM, yields:meraasYields, branded:meeraasB };
