/* ������ DXB ANALYTICS  MASTER DATA FILE ������ */
/* Source: Emaar THE BEAST Excel + DLD + DXBinteract + Yahoo Finance */

// S16: T theme lives in src/theme.js  single source of truth
// Re-exported here for files that still import T from data.js (LandingPage, ProjectManager etc)
// IRON RULE: NEVER remove this export
// S30: import T for internal use (topDevelopers, emaarRisks use T.color)
import { T } from "../theme";
export { T } from "../theme";

/* ������ 48 EMAAR PROJECTS (from Excel) ������ */
export const emaarProjects = [
  // ���� STRUCTURE REFERENCE  3 projects ����������������������������������������������������
  // Add real projects via Admin � Data Manager
  // Fields: id, name, community, district, type, beds, status,
  //         handover, price, sizeFrom, sizeTo, ppsf, payment,
  //         construction, branded, brand, tier, emaarUrl
  { id:1, name:"The Golf Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1750000, sizeFrom:750, sizeTo:2200, ppsf:2333, payment:"20/30/50", construction:90, branded:false, brand:"", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/the-golf-residence" },
  { id:2, name:"Hills Park",         community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1210000, sizeFrom:650, sizeTo:1800, ppsf:1862, payment:"80/20",      construction:85, branded:false, brand:"", tier:"Mid-Market",  emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/hills-park" },
  { id:3, name:"Golf Grand",         community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2027", price:1529388, sizeFrom:700, sizeTo:2100, ppsf:2185, payment:"10/80/10",  construction:96, branded:false, brand:"", tier:"Mid-Premium", emaarUrl:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/golf-grand" },
];

/* ������ ENHANCED FINANCIALS (from Excel PBI_Financials) ������ */
export const emaarFinancials = [
  { year:"2020", revenue:14.9, grossProfit:4.8, ebitda:6.2, netProfit:2.7, netProfitAttr:2.1, propertySales:14, backlog:28, recurringRev:5.3, intlSales:0.6, mallRev:3.2, hotelRev:2.1, mallOccupancy:93, dubaiMallFootfall:65, dividend:0.15, eps:0.24, unitsDelivered:59000, newLaunches:15, revenueUSD:4.1, netProfitUSD:0.6, gm:32.2, em:41.6, nm:14.1 },
  { year:"2021", revenue:27.9, grossProfit:11.6, ebitda:8.5, netProfit:6.6, netProfitAttr:5.3, propertySales:23.9, backlog:32, recurringRev:5.8, intlSales:0.8, mallRev:3.5, hotelRev:2.3, mallOccupancy:95, dubaiMallFootfall:80, dividend:0.25, eps:0.60, unitsDelivered:62000, newLaunches:20, revenueUSD:7.6, netProfitUSD:1.4, gm:41.6, em:30.5, nm:19.0 },
  { year:"2022", revenue:24.9, grossProfit:12.6, ebitda:9.8, netProfit:8.1, netProfitAttr:6.8, propertySales:30.7, backlog:41.5, recurringRev:7.5, intlSales:1.2, mallRev:4.2, hotelRev:3.3, mallOccupancy:96, dubaiMallFootfall:88, dividend:0.35, eps:0.77, unitsDelivered:65000, newLaunches:22, revenueUSD:6.8, netProfitUSD:1.9, gm:50.6, em:39.4, nm:27.3 },
  { year:"2023", revenue:26.7, grossProfit:16.9, ebitda:16.0, netProfit:15.1, netProfitAttr:11.6, propertySales:40.3, backlog:71.8, recurringRev:8.6, intlSales:2.9, mallRev:5.8, hotelRev:2.8, mallOccupancy:97, dubaiMallFootfall:105, dividend:0.50, eps:1.32, unitsDelivered:70000, newLaunches:27, revenueUSD:7.3, netProfitUSD:3.2, gm:63.3, em:59.9, nm:43.4 },
  { year:"2024", revenue:35.5, grossProfit:20.4, ebitda:19.3, netProfit:18.9, netProfitAttr:13.5, propertySales:69.5, backlog:111.5, recurringRev:9.3, intlSales:4.1, mallRev:5.6, hotelRev:3.7, mallOccupancy:98.5, dubaiMallFootfall:111, dividend:1.00, eps:1.53, unitsDelivered:75000, newLaunches:62, revenueUSD:9.7, netProfitUSD:3.7, gm:57.5, em:54.4, nm:38.0 },
  { year:"2025", revenue:49.6, grossProfit:28.5, ebitda:25.6, netProfit:25.7, netProfitAttr:17.6, propertySales:80.4, backlog:155, recurringRev:10.5, intlSales:9.3, mallRev:6.3, hotelRev:4.2, mallOccupancy:98, dubaiMallFootfall:118, dividend:1.00, eps:2.00, unitsDelivered:125600, newLaunches:48, revenueUSD:13.5, netProfitUSD:4.8, gm:57.5, em:51.6, nm:35.5, landBank:618 },
];

/* ������ COMMUNITIES (from Excel PBI_Communities) ������ */
export const emaarCommunities = [
  { district:"DHE", name:"Dubai Hills Estate", acres:2700, avgPpsf:0, avgYield:0, projects:0, buyer:"Families, professionals", strengths:"Golf, schools, mall, parks" },
  { district:"DCH", name:"Dubai Creek Harbour", acres:2500, avgPpsf:0, avgYield:0, projects:0, buyer:"Investors, expats", strengths:"Dubai Square; Creek Tower; waterfront" },
  { district:"EBF", name:"Emaar Beachfront", acres:250, avgPpsf:0, avgYield:0, projects:0, buyer:"Luxury expats, UHNW", strengths:"Beach access; Address/Bristol brands" },
  { district:"ES", name:"Emaar South", acres:7000, avgPpsf:0, avgYield:0, projects:0, buyer:"Value investors", strengths:"Expo legacy; golf; affordable entry" },
  { district:"EL", name:"Expo Living", acres:3000, avgPpsf:null, avgYield:null, projects:0, buyer:"Value seekers", strengths:"Emerging area" },
  { district:"TV", name:"The Valley", acres:4000, avgPpsf:0, avgYield:0, projects:0, buyer:"End-user families", strengths:"Townhouses & villas; community" },
  { district:"GPC", name:"Grand Polo Club", acres:3500, avgPpsf:0, avgYield:0, projects:0, buyer:"UHNW, polo", strengths:"First polo-themed community" },
  { district:"RYM", name:"Rashid Yachts & Marina", acres:1000, avgPpsf:0, avgYield:0, projects:0, buyer:"Maritime lifestyle", strengths:"Yacht marina; Vida" },
  { district:"TO", name:"The Oasis", acres:2500, avgPpsf:0, avgYield:0, projects:0, buyer:"UHNW families", strengths:"Ultra-luxury villas" },
  { district:"BB", name:"Business Bay", acres:null, avgPpsf:0, avgYield:0, projects:0, buyer:"Executives", strengths:"Central; Palace branded" },
  { district:"TH", name:"The Heights CW", acres:null, avgPpsf:0, avgYield:0, projects:0, buyer:"Mid-market families", strengths:"Townhouse community" },
];

/* ������ ENHANCED YIELDS (from Excel PBI_RentalYields) ������ */
export const emaarYields = [
  { community:"Dubai Hills Estate", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"Very High", tenant:"Professionals, couples", visa:"Yes (�0�2M)" },
  { community:"Dubai Hills Estate", unit:"2BR Apt", rent:0, price:0, gross:0, net:0, demand:"Very High", tenant:"Families, professionals", visa:"Yes (�0�2M)" },
  { community:"Dubai Hills Estate", unit:"3BR Apt", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"HNW families", visa:"Yes (�0�2M)" },
  { community:"Dubai Creek Harbour", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"Young professionals", visa:"Yes (�0�2M)" },
  { community:"Dubai Creek Harbour", unit:"2BR Apt", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"Expat families", visa:"Yes (�0�2M)" },
  { community:"Dubai Creek Harbour", unit:"3BR Apt", rent:0, price:0, gross:0, net:0, demand:"Moderate-High", tenant:"HNW tenants", visa:"Yes (�0�2M)" },
  { community:"Emaar Beachfront", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"Very High", tenant:"Luxury expats", visa:"Yes (�0�2M)" },
  { community:"Emaar Beachfront", unit:"2BR Apt", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"UHNW tenants", visa:"Yes (�0�2M)" },
  { community:"Emaar South", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"Growing", tenant:"Airport staff, young prof.", visa:"Below 2M" },
  { community:"Emaar South", unit:"2BR Apt", rent:0, price:0, gross:0, net:0, demand:"Growing", tenant:"Families, value seekers", visa:"Yes (�0�2M)" },
  { community:"The Valley", unit:"3BR TH", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"Family end-users", visa:"Yes (�0�2M)" },
  { community:"The Valley", unit:"4BR Villa", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"Large families", visa:"Yes (�0�2M)" },
  { community:"Rashid Marina", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"Moderate-High", tenant:"Maritime lifestyle", visa:"Yes (�0�2M)" },
  { community:"Downtown Dubai", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"Very High", tenant:"Tourists, executives", visa:"Yes (�0�2M)" },
  { community:"Downtown Dubai", unit:"2BR Apt", rent:0, price:0, gross:0, net:0, demand:"Very High", tenant:"UHNW, corp. housing", visa:"Yes (�0�2M)" },
  { community:"Business Bay", unit:"1BR Apt", rent:0, price:0, gross:0, net:0, demand:"Very High", tenant:"Professionals, executives", visa:"Yes (�0�2M)" },
  { community:"Grand Polo Club", unit:"3BR TH", rent:0, price:0, gross:0, net:0, demand:"High", tenant:"HNW families, expats", visa:"Yes (�0�2M)" },
];

/* ������ PROJECT ROI DATA BY COMMUNITY (Research-backed: DLD, Bayut, REIDIN, Knight Frank, JLL, Engel & Völkers, Chestertons, BetterHomes Q4 2025) ������ */
export const communityROI = {};

/* ������ COMMUNITY MAP COORDINATES (Google Maps verified) ������ */
export const communityCoords = [
  { district: "DHE", name: "Dubai Hills Estate", lat: 25.1267, lng: 55.2367, color: "#10B981", projects: 16, type: "Master Community" },
  { district: "DCH", name: "Dubai Creek Harbour", lat: 25.2048, lng: 55.3480, color: "#3B82F6", projects: 11, type: "Waterfront" },
  { district: "EBF", name: "Emaar Beachfront", lat: 25.0785, lng: 55.1330, color: "#D4A843", projects: 5, type: "Beachfront Island" },
  { district: "ES", name: "Emaar South", lat: 24.9650, lng: 55.1520, color: "#8B5CF6", projects: 2, type: "Golf & Airport" },
  { district: "EL", name: "Expo Living", lat: 24.9700, lng: 55.1380, color: "#EC4899", projects: 1, type: "Expo Legacy" },
  { district: "TV", name: "The Valley", lat: 25.0250, lng: 55.3150, color: "#F59E0B", projects: 2, type: "Suburban Villas" },
  { district: "GPC", name: "Grand Polo Club", lat: 24.9800, lng: 55.1750, color: "#EF4444", projects: 6, type: "Polo Lifestyle" },
  { district: "RYM", name: "Rashid Yachts & Marina", lat: 25.2650, lng: 55.2850, color: "#06B6D4", projects: 2, type: "Marina Heritage" },
  { district: "TO", name: "The Oasis", lat: 25.0800, lng: 55.2800, color: "#14B8A6", projects: 1, type: "Ultra-Luxury Villas" },
  { district: "BB", name: "Business Bay", lat: 25.1850, lng: 55.2650, color: "#F97316", projects: 1, type: "CBD" },
  { district: "TH", name: "The Heights CW", lat: 25.0600, lng: 55.2000, color: "#A78BFA", projects: 1, type: "Wellness Community" },
];
export const dubaiLandmarks = [
  { name: "Burj Khalifa", lat: 25.1972, lng: 55.2744, icon: "��" },
  { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390, icon: "�xR�" },
  { name: "DXB Airport", lat: 25.2532, lng: 55.3657, icon: "�S�" },
  { name: "Al Maktoum Airport", lat: 24.8967, lng: 55.1614, icon: "�S�" },
  { name: "Dubai Marina", lat: 25.0800, lng: 55.1400, icon: "�a" },
  { name: "Dubai Mall", lat: 25.1985, lng: 55.2796, icon: "�x��" },
];

/* ������ TOP 10 DEVELOPERS (from Excel PBI_Developers) ������ */
export const topDevelopers = [
  { rank:1, name:"Emaar Properties", sales:65.8, salesUSD:17.9, units:13149, delivered:7318, underConst:51032, segment:"Full Spectrum", confidence:"VERIFIED", share:9.64, color:T.gold },
  { rank:2, name:"DAMAC Properties", sales:35.9, salesUSD:9.8, units:15393, delivered:2113, underConst:46554, segment:"Mid-Premium � Ultra-Lux", confidence:"VERIFIED", share:5.26, color:T.teal },
  { rank:3, name:"Binghatti", sales:26.0, salesUSD:7.1, units:17061, delivered:4093, underConst:38000, segment:"Affordable � Mid-Premium", confidence:"VERIFIED", share:3.81, color:T.blue },
  { rank:4, name:"Nakheel", sales:24.6, salesUSD:6.7, units:4160, delivered:1522, underConst:15000, segment:"Waterfront", confidence:"VERIFIED", share:3.60, color:T.green },
  { rank:5, name:"Sobha Realty", sales:22.4, salesUSD:6.1, units:9698, delivered:2260, underConst:26933, segment:"Premium � Ultra-Lux", confidence:"VERIFIED", share:3.28, color:T.purple },
  { rank:6, name:"Meraas", sales:20.9, salesUSD:5.7, units:2385, delivered:1913, underConst:12000, segment:"Premium Lifestyle", confidence:"VERIFIED", share:3.06, color:T.orange },
  { rank:7, name:"Omniyat", sales:11.0, salesUSD:3.0, units:1656, delivered:800, underConst:4500, segment:"Ultra-Luxury", confidence:"VERIFIED", share:1.61, color:"#FF7043" },
  { rank:8, name:"Aldar", sales:9.9, salesUSD:2.7, units:1732, delivered:1200, underConst:18000, segment:"Abu Dhabi + Dubai", confidence:"VERIFIED", share:1.45, color:"#42A5F5" },
  { rank:9, name:"H&H Development", sales:8.1, salesUSD:2.2, units:1200, delivered:600, underConst:8000, segment:"Mid-Premium", confidence:"VERIFIED", share:1.19, color:"#AB47BC" },
  { rank:10, name:"Danube Properties", sales:7.0, salesUSD:1.9, units:4089, delivered:1757, underConst:22000, segment:"Affordable", confidence:"VERIFIED", share:1.03, color:T.textMuted },
];

/* ������ RISK MATRIX (from Excel PBI_Risks) ������ */
export const emaarRisks = [
  { factor:"Premium Pricing Risk", level:5, likelihood:5, impact:5, score:125, mitigation:"Off-plan payment plans (80/20); branded residences justify premium", assessment:"HIGH", color:T.red },
  { factor:"Market Cycle Correction", level:4, likelihood:5, impact:5, score:100, mitigation:"Diversified revenue; 35% recurring from malls/hotels", assessment:"ELEVATED", color:T.orange },
  { factor:"Supply Competition", level:4, likelihood:5, impact:3, score:60, mitigation:"Brand premium 20-40%; 79K track record; master communities", assessment:"ELEVATED", color:T.orange },
  { factor:"Geographic Concentration", level:3, likelihood:3, impact:5, score:45, mitigation:"Expanding to Saudi, Egypt, India; +124% intl sales YoY", assessment:"MODERATE", color:T.gold },
  { factor:"Interest Rate Sensitivity", level:2, likelihood:2, impact:2, score:8, mitigation:"87% cash buyers; no floating debt exposure", assessment:"LOW", color:T.teal },
  { factor:"Execution / Delivery", level:1, likelihood:1, impact:2, score:2, mitigation:"23-year record; 79,000+ units completed on schedule", assessment:"VERY LOW", color:T.green },
  { factor:"Regulatory Changes", level:1, likelihood:1, impact:2, score:2, mitigation:"DLD/RERA framework; transparent governance", assessment:"VERY LOW", color:T.green },
  { factor:"Currency (AED Peg)", level:1, likelihood:1, impact:2, score:2, mitigation:"USD peg since 1997; zero FX risk for USD investors", assessment:"VERY LOW", color:T.green },
  { factor:"Liquidity / Exit Risk", level:1, likelihood:1, impact:1, score:1, mitigation:"DFM-listed; AED 150B+ market cap; deep secondary market", assessment:"VERY LOW", color:T.green },
];

/* ������ DUBAI MARKET 2025 (from Excel PBI_DubaiMarket) ������ */
export const dubaiMarket = [
  { metric:"Total Sales Value", val2024:"AED 522.4B", val2025:"AED 682.5B", yoy:"+30.7%", category:"Sales" },
  { metric:"Sales Transactions", val2024:"180,860", val2025:"214,912", yoy:"+18.8%", category:"Volume" },
  { metric:"Total Txn Value", val2024:"AED 760.7B", val2025:"AED 919B", yoy:"+20.8%", category:"Sales" },
  { metric:"All Transactions", val2024:"226,117", val2025:"275,442", yoy:"+21.8%", category:"Volume" },
  { metric:"Q4 Sales", val2024:"AED 147.8B", val2025:"AED 187.5B", yoy:"+26.9%", category:"Sales" },
  { metric:"Avg Price/sqft", val2024:"AED 1,484", val2025:"AED 1,755", yoy:"+18.3%", category:"Pricing" },
  { metric:"Off-Plan Share", val2024:"55%", val2025:"62.6%", yoy:"Growing", category:"Structure" },
  { metric:"Cash Buyers", val2024:"85%", val2025:"87%", yoy:"Dominant", category:"Structure" },
  { metric:"New Investors H1", val2024:"48,600", val2025:"59,075", yoy:"+22%", category:"Demand" },
];

export const dubaiSalesHistory = [
  { year:"2020", sales:120 }, { year:"2021", sales:230 }, { year:"2022", sales:300 },
  { year:"2023", sales:410 }, { year:"2024", sales:522.4 }, { year:"2025", sales:682.5 },
];

/* ������ ROI PHASES (from Excel PBI_ROIPhases) ������ */
export const roiPhases = [
  { phase:"Pre-Launch", timeline:"At Booking", low:8, high:12, avg:10, risk:"Low" },
  { phase:"Construction", timeline:"2-3 Years", low:12, high:20, avg:16, risk:"Low-Medium" },
  { phase:"Handover", timeline:"Completion", low:15, high:25, avg:20, risk:"Medium" },
  { phase:"Rental Y1+", timeline:"Post-Handover", low:4.5, high:8, avg:6.3, risk:"Low" },
  { phase:"5-Year Hold", timeline:"2026-2031", low:30, high:50, avg:40, risk:"Medium" },
];

/* ������ SEGMENTS ������ */
export const emaarSegments = [
  { name:"UAE Property Dev", revenue:36.4, growth:"44%", color:T.gold },
  { name:"Malls & Retail", revenue:6.3, growth:"13%", color:T.teal },
  { name:"Hospitality", revenue:4.2, growth:"12%", color:T.cyan },
  { name:"International", revenue:2.6, growth:"124%", color:T.green },
];

/* ������ RADAR DATA ������ */
export const radarData = [
  { metric:"Revenue Growth", value:85 },
  { metric:"Profit Margin", value:72 },
  { metric:"Market Share", value:90 },
  { metric:"Brand Strength", value:95 },
  { metric:"Diversification", value:68 },
  { metric:"Delivery Record", value:92 },
];

/* ������ MEGA PROJECTS ������ */
export const megaProjects = [
  { name:"Dubai Square", community:"Dubai Creek Harbour", value:"AED 180B+", scale:"2.6M sqm retail/hospitality", type:"Retail + Mixed-Use", timeline:"Phased 2028+", feature:"World's first drive-through mall", status:"Under Construction", developer:"Emaar Properties", announced:"Dec 2025",
    desc:"Dubai Square is Emaar's AED 180B+ mega retail and mixed-use development in Dubai Creek Harbour, spanning 2.6 million square metres. Announced by Mohamed Alabbar on social media in November 2025 and officially unveiled December 2025, construction is already underway with a 3-year completion target. It will feature the world's first drive-through mall concept, AI-powered navigation, EV charging infrastructure, and a luxury retail district rivalling Dubai Mall.",
    keyFacts:["AED 180B+ total investment (anchor of DCH district)","2.6 million sqm retail, hospitality & commercial","World's first drive-through mall concept","AI-powered navigation & smart shopping","EV charging infrastructure throughout","Connected directly to Dubai Creek Tower","3-year phased construction target","Pedestrian-friendly streets & integrated transport"],
    investorImpact:"Transforms Creek Harbour into a competing retail hub to Downtown Dubai. DCH avg PPSF currently AED 2,470 across 4,280 sales vs Downtown's AED 3,000  a 17% gap that is expected to narrow as Dubai Square opens. Early DCH investors could see 8-12% annual capital appreciation.",
    completion:"Construction started late 2025. Phase 1 targeted for 2028. Full completion expected 2030-2032.",
    benchmark:"Hudson Yards (NYC): $25B over 1.2M sqm  Dubai Square is 2x the scale at 2.6M sqm. Battersea Power Station (London): £9B over 42 acres  Dubai Square spans 10x the area.",
    priceImpact:"DCH prices up 3% YoY with avg AED 2,470/sqft. Downtown Dubai (mature comparator) at AED 3,000/sqft  17% premium gap expected to narrow as Dubai Square delivers.",
    milestones:["Nov 2025  Alabbar announces on Instagram","Dec 2025  Official Emaar press release","Q1 2026  Construction underway","2028  Phase 1 targeted opening","2030-2032  Full completion"],
    sources:"Emaar Press Release (Dec 2025), Arabian Business, Construction Week Online, AGBI"
  },
  { name:"Dubai Mall Expansion", community:"Downtown Dubai", value:"AED 1.5B", scale:"279 new outlets across 12.1M sqft", type:"Retail Expansion", timeline:"2025-2027", feature:"World's most visited (111M/yr)", status:"Partially Open", developer:"Emaar Malls", announced:"Jun 2024",
    desc:"Emaar is investing AED 1.5 billion to expand the Dubai Mall with 279 new outlets including 198 retail stores and 81 F&B concepts. 'The District' section opened in March 2025 with 65 shops and restaurants near the Ice Rink. The mall recorded 111 million visitors in 2024, up 6% year-over-year, with 99% occupancy across 12.1 million square feet. A new exhibition centre began accepting bookings in early 2026.",
    keyFacts:["AED 1.5B expansion investment","279 new outlets (198 retail + 81 F&B)","'The District' opened March 2025 (65 shops)","New exhibition centre accepting bookings early 2026","111 million visitors in 2024 (+6% YoY)","99% occupancy across 12.1M sqft","World's most visited retail destination globally","Competing with Mall of the Emirates' AED 5B makeover"],
    investorImpact:"Reinforces Downtown Dubai as the global retail capital. Drives foot traffic and rental demand for surrounding residential. For context: Mall of the Emirates announced AED 5B makeover with 100 new stores including Primark and Skims  Dubai Mall's expansion is defensive and offensive.",
    completion:"The District section opened March 2025. Exhibition centre operational early 2026. Remaining phases through 2027.",
    benchmark:"Mall of America (USA): 40M visitors/yr  Dubai Mall does 111M (2.8x). Westfield London: 27M sqft  Dubai Mall at 12.1M sqft but higher revenue per sqft due to tourism.",
    priceImpact:"Downtown Dubai avg AED 3,000/sqft with 4,033 sales in past year. 99% mall occupancy = sustained residential demand in the district.",
    milestones:["Jun 2024  Expansion announced","Mar 2025  The District opens (65 outlets)","Early 2026  Exhibition centre operational","2027  Full expansion complete"],
    sources:"Emaar IR Reports, Time Out Dubai, Emaar Press Release (Sep 2025)"
  },
  { name:"Dubai Creek Tower", community:"Dubai Creek Harbour", value:"AED 3.67B+", scale:"Iconic observation tower", type:"Mixed-Use Tower", timeline:"Tender Q1 2026", feature:"Calatrava-designed landmark", status:"Tender Phase", developer:"Emaar Properties", announced:"Jan 2026 Revival",
    desc:"Dubai Creek Tower is Emaar's iconic supertall tower designed by Santiago Calatrava, inspired by traditional minaret architecture. Originally announced in 2016 with foundations completed by 2018, work was halted during COVID. In January 2026, Mohamed Alabbar confirmed the project is back on track at the Dubai International Project Management Forum. The 2026 redesign shifts from height competition to architectural beauty  a 'modern minaret' rather than a record-breaker.",
    keyFacts:["AED 3.67B+ estimated investment","Santiago Calatrava iconic design","Redesigned as 'modern minaret'  beauty over height","Foundation completed 2016-2018 (already built)","Construction tender issued Q1 2026","Observation decks, sky gardens, hospitality","Centrepiece of Dubai Creek Harbour district","Integrated with Dubai Square mega retail"],
    investorImpact:"Revival signals peak confidence in Creek Harbour's future. Historical comparison: Burj Khalifa drove Downtown Dubai prices up 300%+ from launch to maturity. Analysts project 8-12% annual capital appreciation and 6-8% gross rental yields for DCH as infrastructure matures.",
    completion:"Foundations built 2016-2018. Project paused 2020 (COVID). Revived January 2026. Tender Q1 2026. Construction timeline TBD pending contractor selection.",
    benchmark:"Burj Khalifa: AED 5.5B, drove creation of entire Downtown Dubai district. Tokyo Skytree: $800M, 30M visitors/yr. Dubai Creek Tower aims for similar landmark-driven district economics.",
    priceImpact:"DCH currently 15-20% below Downtown Dubai pricing. Tower revival + Dubai Square expected to narrow this gap significantly. 80% of DCH buyers are investors positioning for appreciation.",
    milestones:["2016  Original announcement & groundbreaking","2018  Foundation completed","Apr 2020  Formally suspended (COVID)","Jan 2026  Alabbar confirms revival at DIPMF","Q1 2026  Construction tender issued","TBD  Contractor selection & construction start"],
    sources:"Makana.com (Jan 2026), AGBI (Jan 2026), Time Out Dubai"
  },
  { name:"The Oasis", community:"Dubailand", value:"AED 73B", scale:"100M sqft with 7,000+ villas", type:"Ultra-Luxury Villas", timeline:"2026-2032", feature:"Largest villa project globally", status:"Under Construction", developer:"Emaar Properties", announced:"2023 (expanded 2025)",
    desc:"The Oasis is Emaar's AED 73 billion ultra-luxury villa mega-community spanning 100 million square feet with over 7,000 villas. Originally valued at AED 34B, it was expanded to AED 73B. Five sub-communities are launched: Palmiera (Phase 1-3), Mirage, Lavita, and Address Villas Tierra. Wade Adams Contracting appointed for initial infrastructure. Villas range from 4-7 bedrooms priced AED 8M-36M+. 25% of land dedicated to lakes, parks, and waterways. 1,213 villas transacted in the past 12 months with avg sale price AED 17.6M.",
    keyFacts:["AED 73B total value (expanded from AED 34B)","100 million sqft master-planned community","7,000+ ultra-luxury villas across 5 sub-communities","Palmiera (Q4 2027), Mirage (Q1 2029), Lavita, Address Tierra","Avg PPSF: AED 1,800-2,000 (BUA) | AED 1,942 DLD avg","1,213 villas sold in past 12 months (+21% DLD)","25% of land = lakes, parks, waterways, beaches","Only 3,100 villas in initial phases (scarcity premium)"],
    investorImpact:"Targets UHNW segment with zero comparable competition at this scale. Avg sale price AED 17.6M (+3.84% YoY). Asking prices up 10% in 6 months. Entry at AED 8M+ ensures Golden Visa eligibility. Wade Adams appointed as contractor  construction is real. Near Al Maktoum Airport growth corridor.",
    completion:"Infrastructure underway. Palmiera Phase 1 handover Q4 2027. Mirage Q1 2029. Mareva Q1 2030. Full community delivery 2028-2032.",
    benchmark:"Palm Jumeirah villas: AED 3,000-5,000/sqft (mature). Emirates Hills: AED 2,500-4,000/sqft. The Oasis at AED 1,800-2,000/sqft offers 40-50% discount to mature luxury  massive appreciation runway.",
    priceImpact:"DLD data: 1,213 transactions, avg AED 17.6M, prices +21% YoY. Asking prices up 10% in last 6 months per Bayut. Palmiera 4-bed from AED 8.5M; Mirage 5-bed from AED 15M; Lavita 7-bed from AED 36M+.",
    milestones:["Jun 2023  Gala launch at Armani Hotel, Burj Khalifa","2024  Palmiera Phase 2 & 3 launched","Dec 2025  Lavita & Address Villas Tierra launched","2025  Wade Adams appointed (infrastructure)","Q4 2027  Palmiera Phase 1 handover","2028-2032  Phased delivery continues"],
    sources:"Emaar Official, PropertyFinder, Bayut, Propsearch DLD Data, LYM Real Estate Analysis"
  },
  { name:"Grand Polo Club", community:"Grand Polo Club", value:"AED 41B", scale:"60M sqft with 6,661 residences", type:"Luxury Lifestyle", timeline:"2026-2030", feature:"World's first polo-themed community", status:"Under Construction", developer:"Emaar Properties", announced:"Apr 2025",
    desc:"Grand Polo Club & Resort is Emaar's AED 41 billion luxury lifestyle mega-development spanning 60 million square feet (5.54M sqm) with 22 villa communities and 6,661 residences. It features 3 professional polo fields, a riding school with jumping arenas, stables, and a signature clubhouse. Located 5 minutes from Al Maktoum International Airport and adjacent to The Oasis. Only 35-40% of land is allocated for construction  the rest is parks, polo fields, and amenities.",
    keyFacts:["AED 41B total development value","60 million sqft (5.54M sqm) masterplan","22 villa communities with 6,661 residences","3 professional polo fields + stables + riding school","35-40% construction, 60-65% green/amenity space","5 minutes from Al Maktoum International Airport","Adjacent to The Oasis community","3-bed TH from AED 3.5M | 5-bed villa from AED 9M+"],
    investorImpact:"Unique lifestyle positioning with zero direct competitors globally. ROI projected at 5-7% for 4-bed units. First phases typically see 30%+ appreciation by handover in new Emaar communities. Proximity to expanding Al Maktoum Airport adds long-term infrastructure premium. Affordable luxury entry at AED 3.5M vs The Oasis at AED 8M+.",
    completion:"EOI bookings opened April 30, 2025. Selvara cluster launched first. Infrastructure and villa construction underway. Handover June 2029.",
    benchmark:"Royal County of Berkshire (UK polo): £5M-20M homes but no integrated community. Argentine Polo Club: private but no residential. Grand Polo Club is the world's first fully integrated polo-residential community at scale.",
    priceImpact:"3-bed villas from AED 5.67M | 4-bed from AED 7.3M | 5-bed from AED 9M | 5-bed Equestrian Luxury from AED 19.9M. 80/20 payment plan with 10% booking.",
    milestones:["Apr 2025  EOI bookings open, Selvara Phase 1","Mid 2025  Equestra, Equiterra, Equiterra 2 launched","Late 2025  Selvara 3 & 4, Chevalia Estate 2","2026  Infrastructure construction active","Jun 2029  First handovers targeted"],
    sources:"Emaar Official, PropertyFinder, Grand Polo Club Dubai, Off-Plan Properties AE"
  },
  { name:"Emaar Hills", community:"Emaar Hills", value:"AED 100B", scale:"40,000 residences", type:"Mixed-Use Community", timeline:"2025-2035", feature:"Next-generation master community", status:"Under Construction", developer:"Emaar Properties", announced:"Oct 2025",
    desc:"Emaar Hills is a AED 100 billion next-generation master community adjacent to the sold-out Dubai Hills Estate and Dubai Hills Mall. First launch 'Dubai Mansions' features ultra-luxury residences of 10,000-20,000 sqft. The community includes championship golf course, wellness centres, premium retail, and landscaped parks. With 40,000 planned residences over a decade, it effectively doubles the Dubai Hills corridor. Dubai's prime market recorded 1,500+ transactions above AED 10M in Q3 2025 alone, with villas making up 70% of high-value deals.",
    keyFacts:["AED 100B total development value","40,000 ultra-luxury residences planned","Dubai Mansions: 10,000-20,000 sqft homes","Championship golf course access","Walking distance to Dubai Hills Mall","Adjacent to sold-out Dubai Hills Estate","Decade-long phased development 2025-2035","Wellness centres, retail, landscaped parks"],
    investorImpact:"Dubai Hills Estate is sold out  Emaar Hills is the continuation. DHE has proven demand with AED 2,400 avg PPSF. Savills projects prime Dubai residential prices to rise up to 9.9% in 2025. Villas dominate 70% of deals above AED 10M. Early movers in new Emaar communities historically achieve significant appreciation by handover.",
    completion:"Dubai Mansions launched October 2025. Infrastructure groundwork begun. Phased delivery through 2035.",
    benchmark:"Dubai Hills Estate: AED 2,400/sqft avg, 16 projects, fully absorbed. Emaar Hills targets the same buyer profile at pre-development pricing. Comparable to Bel Air / Beverly Hills extensions in LA market.",
    priceImpact:"DHE avg PPSF AED 2,400. Emaar Hills early phases expected at discount to mature DHE pricing, with appreciation as community builds out. 1,500+ transactions >AED 10M in Q3 2025 shows strong UHNW demand.",
    milestones:["Oct 2025  Emaar Hills & Dubai Mansions announced","Oct 2025  Alabbar unveils at launch event","Late 2025  EOI & first sales phase","2026  Infrastructure construction","2027-2035  Phased residential delivery"],
    sources:"Arabian Business (Oct 2025), Khaleej Times (Oct 2025), Zawya, Savills Dubai Research, Steven Leckie Analysis"
  },
  { name:"Dubai Creek Harbour District", community:"Dubai Creek Harbour", value:"AED 180B", scale:"11M sqm with 17,800+ units", type:"Master Community", timeline:"2020-2029", feature:"Metro Blue Line connected by 2029", status:"Under Construction", developer:"Emaar Properties", announced:"2015 (ongoing)",
    desc:"Dubai Creek Harbour is Emaar's flagship waterfront master community spanning 11 million square metres  three times the size of Downtown Dubai. Over 10,582 units completed with 7,217 more expected by 2029. The community will be served by the Dubai Metro Blue Line with 14 stations, dramatically improving connectivity. Property transactions rose 1% YoY with 4,280 sales at avg AED 2,470/sqft. Combined with Dubai Square (retail) and Creek Tower (landmark), DCH is being positioned as a self-contained rival city to Downtown.",
    keyFacts:["AED 180B total district investment","11 million sqm (3x Downtown Dubai)","10,582 units already completed & occupied","7,217 additional units by 2029","4,280 sales in past year at avg AED 2,470/sqft","Metro Blue Line (14 stations) approved for 2029","Home to Dubai Creek Tower + Dubai Square","80% of buyers are investors (agent survey)"],
    investorImpact:"Most mature mega-project with proven delivery. Metro Blue Line by 2029 is the biggest catalyst  historically, metro connectivity drives 15-25% value uplift in Dubai. At AED 2,470/sqft vs Downtown's AED 3,000, DCH offers 17% discount with convergence potential. Combined Creek Tower + Dubai Square + Metro = triple catalyst for price appreciation.",
    completion:"10,582 units delivered. Multiple towers under construction. Metro Blue Line approved with 2029 target. Dubai Square and Creek Tower in active pipeline.",
    benchmark:"Downtown Dubai: AED 3,000/sqft, 4,033 sales. DCH at AED 2,470/sqft with 4,280 sales  already matching Downtown in transaction volume but at 17% lower prices. Canary Wharf (London) analogy: secondary CBD that eventually rivalled the City.",
    priceImpact:"Avg AED 2,470/sqft (+3% YoY). 4,280 transactions in past year. Downtown Dubai at AED 3,000/sqft = 17% premium gap. Metro + Dubai Square + Creek Tower expected to close this gap over 3-5 years.",
    milestones:["2015  DCH masterplan announced","2020  First residential handovers","Sep 2025  10,582 units completed (Emaar report)","Dec 2025  Dubai Square construction begins","Jan 2026  Creek Tower revival confirmed","2029  Metro Blue Line operational target"],
    sources:"AGBI (Jan 2026), Emaar Sep 2025 Report, DLD Transaction Data, Dubai RTA Metro Plans"
  },
  { name:"Al Maktoum Airport Expansion", community:"Dubai South", value:"AED 128B", scale:"5 runways, 260M passengers", type:"Infrastructure", timeline:"Phase 1: 2032", feature:"World's largest airport", status:"Under Construction", developer:"Dubai Government / DAEP", announced:"Apr 2024",
    desc:"Al Maktoum International Airport (DWC) is undergoing an AED 128 billion ($35 billion) expansion to become the world's largest airport. Approved by Sheikh Mohammed in April 2024, the expansion features 5 parallel runways, 400+ aircraft gates, and capacity for 260 million passengers annually across an area 5x the size of DXB. Phase 1 targets 150 million passengers by 2032. Emirates and flydubai will fully relocate from DXB. Binladin Contracting Group awarded AED 1B contract for second runway. Terminal substructure tenders issued mid-2025.",
    keyFacts:["AED 128B ($35B) total investment","5 parallel runways, 400+ aircraft gates","260 million annual passenger capacity (ultimate)","Phase 1: 150M passengers by 2032","70 sq km footprint (5x DXB)","Binladin Group: AED 1B runway 2 contract awarded","West Terminal: 800,000 sqm, 45M passenger capacity","14-station automated people mover (APM) system"],
    investorImpact:"Game-changer for all Dubai South properties. Emaar South, Grand Polo Club, and The Oasis sit directly in the growth corridor. Historical precedent: Areas near DXB (Deira, Bur Dubai) saw 200%+ appreciation over 20 years. Al Maktoum will support 1 million jobs and housing in Dubai South. Dubai South land values are among the lowest in Dubai  maximum upside potential.",
    completion:"Apr 2024: Sheikh Mohammed approves expansion. May 2025: Binladin Group awarded AED 1B runway 2 contract. Mid 2025: Terminal substructure tenders issued. 2032: Phase 1 operational (150M passengers).",
    benchmark:"King Salman Airport (Riyadh): competing for 'world's largest' title. Changi T5 (Singapore): $10B for 50M passengers. Al Maktoum at $35B for 260M passengers  5x the scale of Changi T5 expansion.",
    priceImpact:"Dubai South avg PPSF among lowest in Dubai. Emaar South apartments from AED 1,200/sqft. Grand Polo Club villas from AED 1,700/sqft. Infrastructure-driven demand expected to multiply land values as airport scales.",
    milestones:["Apr 2024  Sheikh Mohammed approves AED 128B expansion","May 2025  AED 1B runway 2 contract to Binladin Group","May 2025  Tristar E&C enabling works underway","Mid 2025  Terminal substructure tenders issued","2026  APM & baggage system tenders expected","2032  Phase 1 operational (150M passengers)","2035+  Full capacity (260M passengers)"],
    sources:"DAEP Official, Gulf News (Dec 2025), Aviation Business ME, MEED, Newsweek, FTI Consulting"
  },
];

/* ������ COMMUNITY INTELLIGENCE (Location Profiles) ������ */
export const communityIntel = {};
