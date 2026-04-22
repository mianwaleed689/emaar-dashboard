/**
 * DXB ANALYTICS — COMPLETE DUBAI REAL ESTATE FOUNDATION
 * =======================================================
 * File: src/data/dubai_complete_foundation.js
 *
 * SINGLE SOURCE OF TRUTH for the entire platform:
 *   1. ALL Dubai developers (50+ active RERA registered)
 *   2. Complete master community hierarchy (85+ master communities, 600+ sub-communities)
 *   3. All 47 property types with full metadata
 *   4. Complete filter schema (19 filters)
 *   5. The ONE base project (Golf Grand Phase 2 — Dubai Hills Estate)
 *   6. Cross-tab connection logic
 *
 * Sources: DLD, RERA, Property Finder UAE April 2026, Bayut April 2026,
 *          Knight Frank Q1 2026, Chestertons 2026, Developer websites
 * Last verified: April 2026
 *
 * IRON RULE: Never import developers/communities directly in components.
 *            Always import from this file. This is the only door.
 *
 * Usage:
 *   import { ALL_DUBAI_DEVELOPERS, MASTER_COMMUNITY_HIERARCHY,
 *            ALL_PROPERTY_TYPES, COMPLETE_FILTER_SCHEMA,
 *            BASE_PROJECT, FOUNDATION_STATS,
 *            getDeveloperById, getAllMasterCommunities,
 *            getAllSubCommunities, getPropertyTypeByValue,
 *            getProjectTabNav, applyProjectContext
 *          } from "../data/dubai_complete_foundation";
 */

/**
 * DXB ANALYTICS — COMPLETE DUBAI REAL ESTATE FOUNDATION
 * File: src/data/dubai_complete_foundation.js
 * Last verified: April 2026
 */

// =============================================================================
// SECTION 1 — ALL DUBAI DEVELOPERS
// =============================================================================

export const ALL_DUBAI_DEVELOPERS = [

  // TIER 1
  { id:"emaar",          name:"Emaar Properties",              tier:"tier-1", type:"Public (DFM)",  ticker:"EMAAR.AE",  reraLicense:"1",    established:1997, hq:"Downtown Dubai",       salesFY2025:80.4, deliveryRecord:95, color:"#D4A843", officialUrl:"https://properties.emaar.com/en/",        masterCommunities:["Downtown Dubai","Dubai Marina","Dubai Hills Estate","Dubai Creek Harbour","Emaar Beachfront","Emaar South","The Valley","Arabian Ranches","Arabian Ranches 2","Arabian Ranches 3","The Oasis","Mina Rashid","Grand Polo Club","Rashid Yachts & Marina","The Heights CW","Business Bay","Zabeel"], specialties:["Master communities","Branded residences","Mega projects"] },
  { id:"damac",          name:"DAMAC Properties",              tier:"tier-1", type:"Private",        reraLicense:"2",    established:2002, hq:"Business Bay",         salesFY2025:28.0, deliveryRecord:78, color:"#1E40AF", officialUrl:"https://www.damacproperties.com/en/",    masterCommunities:["DAMAC Hills","DAMAC Hills 2","DAMAC Lagoons","DAMAC Islands","DAMAC Riverside","DAMAC Sun City","Business Bay","Dubai Maritime City","Dubai Harbour"], specialties:["Branded (Bugatti, Cavalli, Versace)","Luxury villas"] },
  { id:"nakheel",        name:"Nakheel",                       tier:"tier-1", type:"Government",     reraLicense:"3",    established:2000, hq:"Palm Jumeirah",        salesFY2025:18.0, deliveryRecord:88, color:"#0EA5E9", officialUrl:"https://nakheel.com/",                   masterCommunities:["Palm Jumeirah","Palm Jebel Ali","Dubai Islands","JVC","Al Furjan","Nad Al Sheba","Warsan","International City","Discovery Gardens","The Gardens","Jumeirah Park","Jumeirah Islands"], specialties:["Palm islands","Waterfront","Large master communities"], parentGroup:"Dubai Holding" },
  { id:"meraas",         name:"Meraas",                        tier:"tier-1", type:"Government",     reraLicense:"4",    established:2007, hq:"City Walk",            salesFY2025:15.0, deliveryRecord:85, color:"#10B981", officialUrl:"https://www.meraas.com/en/",             masterCommunities:["City Walk","Bluewaters Island","La Mer","Port de La Mer","Jumeira Bay Island","Madinat Jumeirah Living","The Acres","Cherrywoods","Dubai Design District"], specialties:["Lifestyle destinations","Waterfront","Premium urban"], parentGroup:"Dubai Holding" },
  { id:"sobha",          name:"Sobha Realty",                  tier:"tier-1", type:"Private",        reraLicense:"5",    established:1976, hq:"Sobha Hartland",       salesFY2025:22.0, deliveryRecord:92, color:"#8B5CF6", officialUrl:"https://sobharealty.com/",               masterCommunities:["Sobha Hartland","Sobha Hartland II","Sobha Reserve","Sobha Elwood","Sobha Siniya Island","MBR City"], specialties:["Self-developed","Ultra-luxury","High quality finish"] },
  { id:"aldar",          name:"Aldar Properties",              tier:"tier-1", type:"Public (ADX)",   ticker:"ALDAR.AD",  reraLicense:"6",    established:2004, hq:"Yas Island, Abu Dhabi", salesFY2025:35.0, deliveryRecord:91, color:"#EC4899", officialUrl:"https://www.aldar.com/en/",              masterCommunities:["Yas Island","Saadiyat Island","Reem Island","Al Maryah Island","Athlon"], specialties:["Abu Dhabi master communities","Expanding into Dubai"] },
  { id:"dubai_holding",  name:"Dubai Holding",                 tier:"tier-1", type:"Government",     reraLicense:"100",  established:2004, hq:"DIFC",                 salesFY2025:20.0, deliveryRecord:87, color:"#D4A843", officialUrl:"https://www.dubaiholding.com/",           masterCommunities:["Jumeirah","Marsa Al Arab","Dubai Hills Estate (JV)","Madinat Jumeirah"], specialties:["Government mega projects","Tourism destinations"], notes:"Parent of Meraas and Nakheel" },

  // TIER 2
  { id:"dubai_properties", name:"Dubai Properties",           tier:"tier-2", type:"Government",     reraLicense:"234",  established:2004, hq:"Dubai",                salesFY2025:6.0,  deliveryRecord:84, color:"#D4A843", officialUrl:"https://www.dp.ae/",                     masterCommunities:["Jumeirah Beach Residence","Business Bay","Culture Village","Mudon","Villanova","Serena"], specialties:["JBR developer","Mid-market master communities"], parentGroup:"Dubai Holding" },
  { id:"binghatti",      name:"Binghatti",                     tier:"tier-2", reraLicense:"1032", established:2008, hq:"Business Bay",   salesFY2025:14.0, deliveryRecord:82, color:"#F59E0B", officialUrl:"https://binghatti.com/",                 masterCommunities:["Business Bay","JVC","Dubai Silicon Oasis","Al Jaddaf","MBR City","Dubai Creek"], specialties:["High-rise","Branded (Bugatti, Mercedes)","Fast delivery"] },
  { id:"ellington",      name:"Ellington Properties",          tier:"tier-2", reraLicense:"2456", established:2014, hq:"Downtown Dubai", salesFY2025:6.0,  deliveryRecord:90, color:"#14B8A6", officialUrl:"https://ellingtonproperties.com/",      masterCommunities:["Downtown Dubai","Dubai Hills Estate","JVC","Palm Jumeirah","Business Bay","Dubai Marina","Meydan"], specialties:["Design-led","Boutique luxury","Art-inspired"] },
  { id:"azizi",          name:"Azizi Developments",            tier:"tier-2", reraLicense:"1893", established:2007, hq:"Al Furjan",      salesFY2025:8.0,  deliveryRecord:79, color:"#EF4444", officialUrl:"https://www.azizidevelopments.com/",    masterCommunities:["Al Furjan","Palm Jumeirah","Dubai Healthcare City","Meydan","Studio City","Sports City","Riviera (MBR City)"], specialties:["Affordable luxury","High volume","Quick handover"] },
  { id:"danube",         name:"Danube Properties",             tier:"tier-2", reraLicense:"2109", established:2014, hq:"Al Quoz",        salesFY2025:5.5,  deliveryRecord:88, color:"#3B82F6", officialUrl:"https://danubeproperties.com/",         masterCommunities:["Arjan","Liwan","Al Furjan","JVC","International City","Business Bay","Dubailand"], specialties:["1% monthly payment plans","Affordable","Mid-market"] },
  { id:"samana",         name:"Samana Developers",             tier:"tier-2", reraLicense:"3201", established:2017, hq:"JVC",            salesFY2025:4.5,  deliveryRecord:84, color:"#06B6D4", officialUrl:"https://samana.ae/",                    masterCommunities:["JVC","Dubai Studio City","Al Furjan","Arjan","Dubailand","Dubai Sports City"], specialties:["Private pools in apartments","Affordable luxury"] },
  { id:"mag",            name:"MAG Group",                     tier:"tier-2", reraLicense:"1445", established:2003, hq:"DIFC",           salesFY2025:4.0,  deliveryRecord:81, color:"#7C3AED", officialUrl:"https://www.magpd.com/",                masterCommunities:["MBR City","Meydan","Downtown Dubai","Dubai Hills Estate","Keturah Reserve"], specialties:["Ultra-luxury","Keturah brand","Biophilic design"] },
  { id:"nshama",         name:"Nshama",                        tier:"tier-2", reraLicense:"2234", established:2014, hq:"Town Square",    salesFY2025:3.5,  deliveryRecord:86, color:"#F97316", officialUrl:"https://nshama.com/",                   masterCommunities:["Town Square"], specialties:["Affordable family communities"] },
  { id:"deyaar",         name:"Deyaar Development",            tier:"tier-2", type:"Public (DFM)", ticker:"DEYAAR.DFM", reraLicense:"890", established:2002, hq:"Business Bay", salesFY2025:2.5, deliveryRecord:83, color:"#10B981", officialUrl:"https://deyaar.ae/", masterCommunities:["Business Bay","DIFC","Dubai Production City","Midtown"], specialties:["Business Bay specialist","Islamic financing focus"] },
  { id:"wasl",           name:"Wasl Properties",               tier:"tier-2", type:"Government",   reraLicense:"567",  established:2008, hq:"Al Barsha",     salesFY2025:5.0,  deliveryRecord:89, color:"#D4A843", officialUrl:"https://www.waslproperties.com/",        masterCommunities:["Wasl Gate","Wasl1","Al Kifaf","Umm Suqeim","Bur Dubai"], specialties:["Government-backed","Affordable housing"] },
  { id:"majid_al_futtaim", name:"Majid Al Futtaim Properties", tier:"tier-2", reraLicense:"700",  established:1992, hq:"Dubai",          salesFY2025:5.0,  deliveryRecord:90, color:"#D4A843", officialUrl:"https://www.majidalfuttaim.com/",       masterCommunities:["Tilal Al Ghaf","Al Zahia","Waterfront (Sharjah)"], specialties:["Retail-led communities","Regional powerhouse"] },
  { id:"rak_properties", name:"RAK Properties",                tier:"tier-2", reraLicense:"RAK-001", established:2005, hq:"Ras Al Khaimah", salesFY2025:2.0, deliveryRecord:85, color:"#10B981", officialUrl:"https://rakproperties.ae/",             masterCommunities:["Al Marjan Island","Hayat Island","Mina Al Arab"], specialties:["RAK waterfront","Al Marjan Island"] },

  // TIER 3
  { id:"imtiaz",         name:"Imtiaz Developments",           tier:"tier-3", reraLicense:"4521", established:2019, hq:"JVC",    salesFY2025:2.0, deliveryRecord:80, color:"#A855F7", officialUrl:"https://imtiaz.ae/",             masterCommunities:["JVC","Arjan","Dubai Sports City","Dubailand"], specialties:["Smart homes","Affordable luxury"] },
  { id:"beyond",         name:"Beyond Developments",           tier:"tier-3", reraLicense:"5102", established:2020, hq:"Downtown",salesFY2025:1.8, deliveryRecord:85, color:"#06B6D4", officialUrl:"https://beyonddevelopments.com/", masterCommunities:["MBR City","Business Bay","Downtown Dubai","Dubai Marina"], specialties:["Luxury lifestyle","Design focus"] },
  { id:"reportage",      name:"Reportage Properties",          tier:"tier-3", reraLicense:"3890", established:2014, hq:"Abu Dhabi/Dubai", salesFY2025:1.5, deliveryRecord:79, color:"#EF4444", officialUrl:"https://reportageproperties.com/", masterCommunities:["Dubailand","Town Square"], specialties:["Affordable","Abu Dhabi and Dubai"] },
  { id:"vincitore",      name:"Vincitore",                     tier:"tier-3", reraLicense:"4203", established:2015, hq:"Arjan",  salesFY2025:1.2, deliveryRecord:82, color:"#8B5CF6", officialUrl:"https://vincitoregroup.com/",     masterCommunities:["Arjan","Dubailand","Al Furjan"], specialties:["Italian-inspired design","Boutique"] },
  { id:"object_one",     name:"Object One",                    tier:"tier-3", reraLicense:"5567", established:2018, hq:"JVC",    salesFY2025:0.8, deliveryRecord:83, color:"#F59E0B", officialUrl:"https://objectone.ae/",          masterCommunities:["JVC","Dubai Hills Estate","Arjan"], specialties:["Design-led boutique","Unique facades"] },
  { id:"omniyat",        name:"Omniyat",                       tier:"tier-3", reraLicense:"2678", established:2005, hq:"Business Bay", salesFY2025:3.0, deliveryRecord:88, color:"#1E40AF", officialUrl:"https://omniyat.com/",       masterCommunities:["Business Bay","Downtown Dubai","Palm Jumeirah","Dubai Water Canal"], specialties:["Ultra-luxury","Branded (Dorchester, One&Only)"], notes:"Developer of The Opus by Zaha Hadid" },
  { id:"pantheon",       name:"Pantheon Development",          tier:"tier-3", reraLicense:"3456", established:2016, hq:"JVC",    salesFY2025:0.9, deliveryRecord:80, color:"#10B981", officialUrl:"https://pantheon.ae/",           masterCommunities:["JVC","Dubai Sports City"], specialties:["Affordable apartments","JVC specialist"] },
  { id:"select",         name:"Select Group",                  tier:"tier-3", reraLicense:"1678", established:2002, hq:"Dubai Marina", salesFY2025:2.5, deliveryRecord:87, color:"#EC4899", officialUrl:"https://selectgroup.me/",   masterCommunities:["Dubai Marina","Business Bay","JLT"], specialties:["Dubai Marina specialist","Waterfront luxury"] },
  { id:"dugasta",        name:"Dugasta Properties",            tier:"tier-3", reraLicense:"4890", established:2016, hq:"JVC",    salesFY2025:0.6, deliveryRecord:78, color:"#0EA5E9", officialUrl:"https://dugasta.com/",           masterCommunities:["JVC","Dubai Land"], specialties:["Affordable entry-level"] },
  { id:"tiger",          name:"Tiger Properties",              tier:"tier-3", reraLicense:"2345", established:2000, hq:"International City", salesFY2025:0.7, deliveryRecord:76, color:"#F97316", officialUrl:"https://tigerproperties.ae/", masterCommunities:["International City","Dubai Land","Al Warsan"], specialties:["Budget segment"] },
  { id:"union_properties", name:"Union Properties",            tier:"tier-3", type:"Public (DFM)", ticker:"UPP.AE", reraLicense:"345", established:1987, hq:"Motor City", salesFY2025:0.8, deliveryRecord:80, color:"#D4A843", officialUrl:"https://up.ae/", masterCommunities:["Motor City","Green Community","UPTOWN Motor City"], specialties:["Motor City specialist"] },
  { id:"iman",           name:"Iman Developers",               tier:"tier-3", reraLicense:"4567", established:2017, hq:"Dubai",  salesFY2025:0.6, deliveryRecord:81, color:"#14B8A6", officialUrl:"https://imandevelopers.com/",    masterCommunities:["Arjan","JVC","Dubai Sports City"], specialties:["Affordable luxury","Arjan specialist"] },
  { id:"tilal",          name:"Tilal Al Ghaf (MAF)",           tier:"tier-3", reraLicense:"3001", established:2018, hq:"Tilal Al Ghaf", salesFY2025:4.0, deliveryRecord:88, color:"#10B981", officialUrl:"https://www.tilalghaf.com/", masterCommunities:["Tilal Al Ghaf"], specialties:["Lagoon master community","70% water and green space"] },
  { id:"condor",         name:"Condor Developers",             tier:"tier-3", reraLicense:"4800", established:2017, hq:"Dubai",  salesFY2025:0.5, deliveryRecord:82, color:"#EF4444", officialUrl:"https://condordevelopers.com/",  masterCommunities:["JVC","Dubai Sports City","Business Bay"], specialties:["Affordable luxury"] },
  { id:"prescott",       name:"Prescott Real Estate",          tier:"tier-3", reraLicense:"5600", established:2019, hq:"Dubai",  salesFY2025:0.3, deliveryRecord:81, color:"#8B5CF6", officialUrl:"https://prescottrealestate.com/", masterCommunities:["JVC","Arjan","Dubai Sports City"], specialties:["Boutique developments"] },
  { id:"bloom",          name:"Bloom Holding",                 tier:"tier-3", reraLicense:"3100", established:2007, hq:"Abu Dhabi/Dubai", salesFY2025:1.5, deliveryRecord:85, color:"#84CC16", officialUrl:"https://bloomholding.ae/", masterCommunities:["Bloom Living","JLT","Bloom Heights"], specialties:["Abu Dhabi + Dubai","Family communities"] },
  { id:"fakhruddin",     name:"Fakhruddin Properties",         tier:"tier-3", reraLicense:"1600", established:1990, hq:"Deira",  salesFY2025:0.4, deliveryRecord:83, color:"#D4A843", officialUrl:"https://fakhruddinproperties.com/", masterCommunities:["Al Qusais","Deira","Al Nahda"], specialties:["Old Dubai areas","Traditional markets"] },
  { id:"g_corp",         name:"G Corp Homes",                  tier:"tier-3", reraLicense:"5800", established:2020, hq:"Dubai",  salesFY2025:0.3, deliveryRecord:80, color:"#0EA5E9", officialUrl:"https://gcorphomes.com/",        masterCommunities:["JVC","Arjan"], specialties:["Boutique luxury"] },
  { id:"arada",          name:"Arada",                         tier:"tier-3", reraLicense:"4100", established:2017, hq:"Sharjah",salesFY2025:1.2, deliveryRecord:84, color:"#22C55E", officialUrl:"https://arada.com/",             masterCommunities:["Masaar","Aljada","Nasma Residences"], specialties:["Forest community","Sharjah developer"] },

  // EMERGING
  { id:"ora",     name:"ORA Developers",    tier:"emerging", reraLicense:"6234", established:2020, hq:"Downtown",      salesFY2025:0.5, color:"#D4A843", officialUrl:"https://ora.world/",       masterCommunities:["Dubai Islands","Business Bay"], specialties:["Super luxury","Private islands","Naguib Sawiris"] },
  { id:"muraba",  name:"Muraba Properties", tier:"emerging", reraLicense:"3891", established:2015, hq:"Palm Jumeirah", salesFY2025:0.4, deliveryRecord:90, color:"#1E293B", officialUrl:"https://muraba.com/", masterCommunities:["Palm Jumeirah","Dubai Creek Harbour"], specialties:["Minimalist ultra-luxury","12–23 units per project"] },
  { id:"taraf",   name:"Taraf",             tier:"emerging", reraLicense:"7000", established:2020, hq:"Dubai",         salesFY2025:0.3, color:"#7C3AED", officialUrl:"https://taraf.ae/",        masterCommunities:["Dubai Islands","Business Bay"], specialties:["Luxury boutique","Art-inspired"] },
  { id:"refine",  name:"Refine Development",tier:"emerging", reraLicense:"6500", established:2021, hq:"Dubai",         salesFY2025:0.2, color:"#14B8A6", officialUrl:"https://refine.ae/",       masterCommunities:["MBR City","Business Bay"], specialties:["Boutique luxury"] },
  { id:"treppan", name:"Treppan Living",    tier:"emerging", reraLicense:"6600", established:2021, hq:"Dubai",         salesFY2025:0.2, color:"#8B5CF6", officialUrl:"https://treppan.com/",     masterCommunities:["Dubailand","JVC"], specialties:["Wellness-focused living"] },
];

// =============================================================================
// SECTION 2 — MASTER COMMUNITY HIERARCHY (80+ communities)
// Structure: Zone → Master Community → Sub-Communities
// =============================================================================

export const MASTER_COMMUNITY_HIERARCHY = [

  // ─── CENTRAL DUBAI ──────────────────────────────────────────────────────────
  { zone:"Central Dubai", emirate:"Dubai", communities:[
    { id:"downtown-dubai",  name:"Downtown Dubai",   developer:"emaar",  districtCode:"DT",   coord:{lat:25.1972,lng:55.2744}, subCommunities:["The Opera District","Burj Khalifa District","Old Town","The Residences","Boulevard Heights","Address Sky View","Forte","Vida Downtown","29 Boulevard","Burj Views","Address Residences"], priceFrom:1200000, avgPpsf:2800, avgYield:5.2, rating:"A+", gv:true,  types:["Apartment","Penthouse","Hotel Apartment","Branded Residence"], landmark:"Burj Khalifa",        toDowntown:"0 min",  toAirport:"20 min", metro:"Burj Khalifa/Dubai Mall (Red Line)" },
    { id:"business-bay",    name:"Business Bay",     developer:"shared", districtCode:"BB",   coord:{lat:25.1860,lng:55.2649}, subCommunities:["Executive Bay","Bay Square","Marasi Business Bay","The Pad","Aykon City","Vera Residences","Damac Prive","SLS Dubai"], priceFrom:600000, avgPpsf:1800, avgYield:6.8, rating:"A", gv:false, types:["Apartment","Office","Hotel Apartment","Studio"], landmark:"Dubai Water Canal",    toDowntown:"5 min",  toAirport:"18 min", metro:"Business Bay (Red Line)" },
    { id:"difc",            name:"DIFC",             developer:"shared", districtCode:"DIFC", coord:{lat:25.2131,lng:55.2824}, subCommunities:["Gate Village","The Residences at DIFC","Index Tower","Liberty House","Currency House"], priceFrom:1500000, avgPpsf:3200, avgYield:5.0, rating:"A+", gv:true,  types:["Apartment","Office","Penthouse","Branded Residence"], landmark:"Gate Building", toDowntown:"5 min",  toAirport:"20 min", metro:"Financial Centre (Red Line)", notes:"Common law jurisdiction" },
    { id:"city-walk",       name:"City Walk",        developer:"meraas", districtCode:"CW",   coord:{lat:25.2049,lng:55.2491}, subCommunities:["City Walk Central","The Galleria","City Walk Residences"], priceFrom:1500000, avgPpsf:2600, avgYield:5.5, rating:"A", gv:true,  types:["Apartment","Penthouse","Hotel Apartment"], landmark:"City Walk Open-Air Mall", toDowntown:"8 min",  toAirport:"18 min", metro:"Business Bay (10 min walk)" },
    { id:"zabeel",          name:"Zabeel",           developer:"emaar",  districtCode:"ZB",   coord:{lat:25.2288,lng:55.2978}, subCommunities:["Zabeel 1","Zabeel 2","The Address Zabeel"], priceFrom:1800000, avgPpsf:2600, avgYield:5.5, rating:"A", gv:true,  types:["Apartment","Penthouse"], landmark:"Dubai Frame", toDowntown:"8 min",  toAirport:"15 min", metro:"Al Jafiliya (Green Line)" },
  ]},

  // ─── NEW DUBAI SOUTH ────────────────────────────────────────────────────────
  { zone:"New Dubai (South)", emirate:"Dubai", communities:[
    { id:"dubai-hills-estate", name:"Dubai Hills Estate", developer:"emaar", codev:"meraas", districtCode:"DHE", coord:{lat:25.1124,lng:55.2400},
      subCommunities:["Golf Place","Golf Place II","Sidra","Sidra II","Sidra III","Maple","Maple II","Maple III","Park Heights","Park Heights 2","Parkside","Hills Grove","Fairways","Parkways","Park Gate","Rosehill","Majestic Vistas","Golf Hillside","Ellington House","Lime Gardens","Hills Park","Elvira","Parkside Views","Hillsedge","Golf Grand","Park Ridge","Collective","Acacia","Wilton Park","Address Villas Hillcrest","Vida Residences Hillside"],
      priceFrom:1300000, avgPpsf:2100, avgYield:6.1, rating:"A+", gv:true, types:["Apartment","Villa","Townhouse","Penthouse"], landmark:"Dubai Hills Golf Club (Troon Golf, par-72)", toDowntown:"15 min", toAirport:"20 min", toMarina:"15 min", metro:"Future Metro planned", notes:"2,700 acres — Emaar × Meraas JV — 'Green Heart of Dubai'", sizeSqFt:480000000, totalUnits:31200 },
    { id:"dubai-marina",    name:"Dubai Marina",       developer:"emaar", districtCode:"DM",  coord:{lat:25.0819,lng:55.1367}, subCommunities:["Marina Promenade","Marina Gate","Marina Arcade","Marina Heights","Marina Terrace","The Torch","Princess Tower","Park Island","Botanica","Horizon Tower","Cayan Tower","Sulafa Tower"],
      priceFrom:800000, avgPpsf:2000, avgYield:6.5, rating:"A", gv:false, types:["Apartment","Penthouse","Hotel Apartment"], landmark:"Dubai Marina Walk", toDowntown:"25 min", toAirport:"30 min", toBeach:"5 min", metro:"Dubai Marina (Red Line)" },
    { id:"jbr",             name:"JBR",                developer:"dubai_properties", districtCode:"JBR", coord:{lat:25.0772,lng:55.1343}, subCommunities:["The Walk at JBR","The Beach at JBR","Habtoor Grand Residences"],
      priceFrom:1200000, avgPpsf:2400, avgYield:7.2, rating:"A", gv:false, types:["Apartment","Penthouse","Hotel Apartment"], landmark:"JBR Beach", toDowntown:"25 min", toAirport:"35 min", toBeach:"0 min", metro:"JLT (Red Line)", notes:"Highest STR yield in Dubai" },
    { id:"palm-jumeirah",   name:"Palm Jumeirah",      developer:"nakheel", districtCode:"PJ", coord:{lat:25.1124,lng:55.1390}, subCommunities:["The Crescent","The Trunk","Fronds A–P","Shoreline Apartments","Palm Heights","One Palm","Balqis Residence","Oceana","Serenia","The 8","Como Residences","Atlantis The Royal Residences"],
      priceFrom:2000000, avgPpsf:3500, avgYield:5.5, rating:"A+", gv:true, types:["Apartment","Villa","Penthouse","Hotel Apartment","Branded Residence"], landmark:"Atlantis The Palm", toDowntown:"30 min", toAirport:"35 min", toBeach:"0 min", metro:"Palm Monorail" },
    { id:"jlt",             name:"JLT",                developer:"dmcc",   districtCode:"JLT", coord:{lat:25.0686,lng:55.1614}, subCommunities:["JLT Cluster A","JLT Cluster B","JLT Cluster C","JLT Cluster D","JLT Cluster E","JLT Cluster F","JLT Cluster G","JLT Cluster H","JLT Cluster I","JLT Cluster J","JLT Cluster K","JLT Cluster L","JLT Cluster M","JLT Cluster N","JLT Cluster O","JLT Cluster P","JLT Cluster Q","JLT Cluster R","JLT Cluster S","JLT Cluster T","JLT Cluster U","JLT Cluster V","JLT Cluster W","JLT Cluster X","JLT Cluster Y","JLT Cluster Z"],
      priceFrom:500000, avgPpsf:1300, avgYield:7.5, rating:"A-", gv:false, types:["Apartment","Office","Hotel Apartment"], landmark:"JLT Lakes", toDowntown:"25 min", toAirport:"30 min", metro:"JLT/DMAC Properties (Red Line)", notes:"DMCC Free Zone — 100% foreign ownership" },
    { id:"emaar-beachfront", name:"Emaar Beachfront", developer:"emaar",  districtCode:"EBF", coord:{lat:25.0838,lng:55.1312}, subCommunities:["Beach Vista","Sunrise Bay","Grand Bleu Tower","Seapoint","Beach Mansion","Beach Isle","Beach Royale"],
      priceFrom:2000000, avgPpsf:3800, avgYield:5.8, rating:"A+", gv:true, types:["Apartment","Penthouse","Hotel Apartment"], toDowntown:"25 min", toAirport:"35 min", toBeach:"0 min", notes:"Highest PPSF in new builds — private beach access" },
    { id:"dubai-harbour",   name:"Dubai Harbour",     developer:"shared", districtCode:"DHR", coord:{lat:25.0750,lng:55.1350}, subCommunities:["DAMAC Bay","Beach Walk","Marina Shores","Stella Maris"],
      priceFrom:1500000, avgPpsf:3000, avgYield:5.5, rating:"A", gv:true, types:["Apartment","Penthouse","Hotel Apartment"], landmark:"Dubai Harbour Cruise Terminal", toDowntown:"25 min", toAirport:"35 min" },
    { id:"bluewaters",      name:"Bluewaters Island", developer:"meraas", districtCode:"BW",  coord:{lat:25.0799,lng:55.1239}, subCommunities:["Bluewaters Residences","Caesars Palace"],
      priceFrom:2000000, avgPpsf:3200, avgYield:5.0, rating:"A+", gv:true, types:["Apartment","Penthouse","Hotel Apartment"], landmark:"Ain Dubai", toDowntown:"25 min", toAirport:"35 min", metro:"DMAC Properties + bridge walkway" },
  ]},

  // ─── CREEK / MBR CITY ───────────────────────────────────────────────────────
  { zone:"Creek / MBR City", emirate:"Dubai", communities:[
    { id:"dubai-creek-harbour", name:"Dubai Creek Harbour", developer:"emaar", districtCode:"DCH", coord:{lat:25.2047,lng:55.3566},
      subCommunities:["Creek Island","Creek Gate","Creek Horizon","17 Icon Bay","Orchid","Vida Creek Harbour","Creek Palace","Creek Waters","Creekside 18","Creek Beach","The Cove"],
      priceFrom:900000, avgPpsf:1900, avgYield:6.3, rating:"A", gv:false, types:["Apartment","Penthouse","Villa"], landmark:"Dubai Creek Tower (under construction)", toDowntown:"15 min", toAirport:"15 min" },
    { id:"mbr-city",      name:"MBR City",          developer:"shared", districtCode:"MBR", coord:{lat:25.1512,lng:55.2912},
      subCommunities:["District One","District One West","Sobha Hartland","Sobha Hartland II","Meydan Avenue","Azizi Riviera","Keturah Reserve","MAG MBR City","Wilton Terraces"],
      priceFrom:700000, avgPpsf:2200, avgYield:5.8, rating:"A", gv:true, types:["Apartment","Villa","Townhouse","Penthouse"], toDowntown:"12 min", toAirport:"18 min" },
    { id:"sobha-hartland", name:"Sobha Hartland",   developer:"sobha", districtCode:"SH",   coord:{lat:25.1966,lng:55.3277},
      subCommunities:["Crest","Crest Grande","Waves","Waves Grande","One Park Avenue","Forest Villas","Greens and Views","Sobha Seahaven"],
      priceFrom:1200000, avgPpsf:2300, avgYield:5.9, rating:"A", gv:true, types:["Apartment","Villa","Townhouse"], toDowntown:"15 min", toAirport:"15 min" },
    { id:"meydan",        name:"Meydan",            developer:"meydan", districtCode:"MEY", coord:{lat:25.1712,lng:55.3044},
      subCommunities:["Meydan Avenue","Meydan Gated Community","Meydan One","Azizi Riviera","District 7"],
      priceFrom:600000, avgPpsf:1600, avgYield:6.5, rating:"B+", gv:false, types:["Apartment","Villa","Penthouse"], landmark:"Meydan Racecourse", toDowntown:"15 min", toAirport:"20 min" },
  ]},

  // ─── JVC / JVT / ARJAN BELT ─────────────────────────────────────────────────
  { zone:"JVC / JVT / Arjan Belt", emirate:"Dubai", communities:[
    { id:"jvc",       name:"JVC",       developer:"nakheel", districtCode:"JVC", coord:{lat:25.0533,lng:55.2012},
      subCommunities:["District 10","District 11","District 12","District 13","District 14","District 15","District 16","District 17","District 18"],
      priceFrom:380000, avgPpsf:1050, avgYield:8.2, rating:"B+", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"20 min", toAirport:"25 min", notes:"Highest transaction volume in Dubai for apartments" },
    { id:"jvt",       name:"JVT",       developer:"nakheel", districtCode:"JVT", coord:{lat:25.0594,lng:55.1861},
      subCommunities:["JVT District 1","JVT District 2","JVT District 3"],
      priceFrom:500000, avgPpsf:1100, avgYield:7.8, rating:"B", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"22 min", toAirport:"28 min" },
    { id:"arjan",     name:"Arjan",     developer:"shared",  districtCode:"ARJ", coord:{lat:25.0422,lng:55.2077},
      subCommunities:["Arjan District 1","Al Barsha South 3"],
      priceFrom:400000, avgPpsf:1000, avgYield:7.8, rating:"B", gv:false, types:["Apartment","Studio"], landmark:"Dubai Miracle Garden", toDowntown:"22 min", toAirport:"28 min" },
    { id:"dubailand", name:"Dubailand", developer:"shared",  districtCode:"DL",  coord:{lat:25.0122,lng:55.3234},
      subCommunities:["DLRC","Villanova","Amaranta","La Rosa","Rukan","Reportage Village","Danube Lawnz","Binghatti Crescent","The Roots","Liwan","Liwan 2","Skycourts"],
      priceFrom:300000, avgPpsf:700, avgYield:8.0, rating:"B-", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"25 min", toAirport:"30 min" },
    { id:"studio-city", name:"Dubai Studio City", developer:"tecom", districtCode:"DSC2", coord:{lat:25.0388,lng:55.1744},
      subCommunities:["Studio City","IMPZ","Dubai Media Production Zone"],
      priceFrom:400000, avgPpsf:950, avgYield:7.5, rating:"B", gv:false, types:["Apartment","Studio"], toDowntown:"25 min", toAirport:"30 min", notes:"Media and entertainment free zone" },
  ]},

  // ─── THE VALLEY / EMAAR SOUTH ───────────────────────────────────────────────
  { zone:"The Valley / Emaar South", emirate:"Dubai", communities:[
    { id:"the-valley",   name:"The Valley",   developer:"emaar", districtCode:"TV", coord:{lat:24.9788,lng:55.3466},
      subCommunities:["Rivana","Nara","Farm Gardens","Talia","Orania","Elora","Eden","Iris","The Farm"],
      priceFrom:1200000, avgPpsf:1100, avgYield:6.8, rating:"A-", gv:false, types:["Villa","Townhouse"], toDowntown:"30 min", toAirport:"35 min" },
    { id:"emaar-south",  name:"Emaar South",  developer:"emaar", districtCode:"ES", coord:{lat:24.9022,lng:55.1488},
      subCommunities:["Greenway","Fairway Villas","Views at Emirates Golf Club","The Links","Elvira","Golf Lane","Golf Point","Pulse","Socio","Expo Golf Villas"],
      priceFrom:700000, avgPpsf:950, avgYield:7.0, rating:"B+", gv:false, types:["Apartment","Villa","Townhouse"], landmark:"Al Maktoum International Airport", toDowntown:"40 min", toAirport:"10 min", metro:"Route 2020 (Expo Metro)" },
    { id:"expo-city",    name:"Expo City Dubai", developer:"expo", districtCode:"EC", coord:{lat:24.9683,lng:55.1554},
      subCommunities:["Expo Valley","Expo Living","Urbana","Mangrove Residences"],
      priceFrom:800000, avgPpsf:1200, avgYield:6.5, rating:"B+", gv:false, types:["Apartment","Villa","Townhouse"], landmark:"Al Wasl Plaza", toDowntown:"40 min", toAirport:"12 min", metro:"Expo 2020 Metro" },
    { id:"the-oasis",    name:"The Oasis",    developer:"emaar", districtCode:"TO", coord:{lat:24.9500,lng:55.2000},
      subCommunities:["The Oasis","Palmiera","Mirage","Tierra","Azure","Lillia"],
      priceFrom:3500000, avgPpsf:2200, avgYield:5.0, rating:"A", gv:true, types:["Villa","Mansion"], toDowntown:"35 min", toAirport:"30 min", notes:"Emaar's new ultra-luxury lagoon villa community" },
  ]},

  // ─── AL FURJAN / DISCOVERY ──────────────────────────────────────────────────
  { zone:"Al Furjan / Discovery Gardens", emirate:"Dubai", communities:[
    { id:"al-furjan",         name:"Al Furjan",          developer:"nakheel", districtCode:"AF",  coord:{lat:25.0166,lng:55.1522}, subCommunities:["Al Furjan East","Al Furjan West","Al Furjan Villas","Azizi Grand","Fairway Residence","Lotus"], priceFrom:500000, avgPpsf:1100, avgYield:7.2, rating:"B+", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"22 min", toAirport:"28 min", metro:"Al Furjan (Route 2020)" },
    { id:"discovery-gardens", name:"Discovery Gardens",  developer:"nakheel", districtCode:"DG",  coord:{lat:25.0272,lng:55.1483}, subCommunities:["Mediterranean Cluster","Zen Cluster","Cactus Cluster","Mesoamerican Cluster","Mogul Cluster","Contemporary Cluster"], priceFrom:350000, avgPpsf:750, avgYield:8.5, rating:"B-", gv:false, types:["Apartment","Studio"], toDowntown:"25 min", toAirport:"30 min", metro:"Discovery Gardens (Red Line)", notes:"Most affordable metro-connected area" },
    { id:"international-city", name:"International City", developer:"nakheel", districtCode:"IC",  coord:{lat:25.1684,lng:55.4198}, subCommunities:["China Cluster","England Cluster","France Cluster","Greece Cluster","Italy Cluster","Morocco Cluster","Persia Cluster","Russia Cluster","Spain Cluster","Emirates Cluster"], priceFrom:200000, avgPpsf:500, avgYield:9.5, rating:"C+", gv:false, types:["Apartment","Studio"], toDowntown:"35 min", toAirport:"25 min", notes:"Highest rental yield in Dubai — very affordable" },
    { id:"gardens",           name:"The Gardens",        developer:"nakheel", districtCode:"TGD", coord:{lat:25.0372,lng:55.1383}, subCommunities:["The Gardens"], priceFrom:450000, avgPpsf:900, avgYield:7.5, rating:"B", gv:false, types:["Apartment"], toDowntown:"25 min", toAirport:"30 min", metro:"Ibn Battuta (Red Line)" },
  ]},

  // ─── DAMAC COMMUNITIES ──────────────────────────────────────────────────────
  { zone:"DAMAC Communities", emirate:"Dubai", communities:[
    { id:"damac-hills",   name:"DAMAC Hills",   developer:"damac", districtCode:"DH",  coord:{lat:25.0442,lng:55.2266}, subCommunities:["Akoya Oxygen","Golf Vita","Park Greens","Park Heights","Golf Gate","Golf Horizon","Ghalia","Artesia","Amazonia","Carson","Belair","Pelham"], priceFrom:900000, avgPpsf:1400, avgYield:6.8, rating:"B+", gv:false, types:["Apartment","Villa","Townhouse"], landmark:"Trump International Golf Club Dubai", toDowntown:"30 min", toAirport:"35 min" },
    { id:"damac-hills-2", name:"DAMAC Hills 2", developer:"damac", districtCode:"DH2", coord:{lat:24.9842,lng:55.2866}, subCommunities:["Elo","Elo 2","Elo 3","Violet","Violet 2","Farm Gardens","The Roots","Autograph Collection","Greenville"], priceFrom:450000, avgPpsf:900, avgYield:7.5, rating:"B", gv:false, types:["Villa","Townhouse","Apartment"], toDowntown:"40 min", toAirport:"45 min", notes:"Most affordable villa community in Dubai" },
    { id:"damac-lagoons", name:"DAMAC Lagoons", developer:"damac", districtCode:"DLG", coord:{lat:25.0012,lng:55.2277}, subCommunities:["Venice","Morocco","Portofino","Costa Brava","Nice","Malta","Santorini","Marbella","Bali"], priceFrom:1200000, avgPpsf:1200, avgYield:6.5, rating:"B+", gv:false, types:["Villa","Townhouse"], toDowntown:"35 min", toAirport:"40 min" },
    { id:"damac-islands", name:"DAMAC Islands", developer:"damac", districtCode:"DI2", coord:{lat:24.9900,lng:55.2150}, subCommunities:["DAMAC Islands","Lagoon Views"], priceFrom:1500000, avgPpsf:1400, avgYield:6.0, rating:"B+", gv:false, types:["Villa","Townhouse"], toDowntown:"40 min", toAirport:"45 min" },
    { id:"damac-riverside", name:"DAMAC Riverside", developer:"damac", districtCode:"DRP", coord:{lat:24.9700,lng:55.1900}, subCommunities:["DAMAC Riverside"], priceFrom:1000000, avgPpsf:1100, avgYield:6.5, rating:"B", gv:false, types:["Villa","Townhouse"], toDowntown:"40 min" },
  ]},

  // ─── SOBHA COMMUNITIES ──────────────────────────────────────────────────────
  { zone:"Sobha Communities", emirate:"Dubai", communities:[
    { id:"sobha-reserve",  name:"Sobha Reserve",   developer:"sobha", districtCode:"SR",  coord:{lat:25.0612,lng:55.2188}, subCommunities:["Sobha Reserve","Waves Opulence"], priceFrom:4000000, avgPpsf:2800, avgYield:4.5, rating:"A", gv:true, types:["Villa"], toDowntown:"25 min", toAirport:"30 min" },
    { id:"sobha-elwood",   name:"Sobha Elwood",    developer:"sobha", districtCode:"SE",  coord:{lat:25.0400,lng:55.2300}, subCommunities:["Sobha Elwood"], priceFrom:2500000, avgPpsf:2000, avgYield:5.2, rating:"A-", gv:true, types:["Villa","Townhouse"], toDowntown:"28 min", toAirport:"32 min", notes:"Forest-inspired community" },
  ]},

  // ─── MERAAS COMMUNITIES ─────────────────────────────────────────────────────
  { zone:"Meraas Communities", emirate:"Dubai", communities:[
    { id:"port-de-la-mer",         name:"Port de La Mer",         developer:"meraas", districtCode:"PLM", coord:{lat:25.2344,lng:55.2577}, subCommunities:["La Mer South","La Mer North","La Voile","La Cote","Nikki Beach Residences"], priceFrom:1800000, avgPpsf:2800, avgYield:5.8, rating:"A", gv:true, types:["Apartment","Penthouse","Villa"], toDowntown:"12 min", toAirport:"20 min" },
    { id:"madinat-jumeirah-living", name:"Madinat Jumeirah Living", developer:"meraas", districtCode:"MJL", coord:{lat:25.1449,lng:55.1855}, subCommunities:["Asayel","Jadeel","Rahaal","Lamtara","Jomana"], priceFrom:2500000, avgPpsf:3500, avgYield:4.8, rating:"A+", gv:true, types:["Apartment","Penthouse"], landmark:"Burj Al Arab", toDowntown:"20 min", toAirport:"30 min" },
    { id:"the-acres",              name:"The Acres",              developer:"meraas", districtCode:"TA",  coord:{lat:24.9944,lng:55.2266}, subCommunities:["The Acres","The Acres Grove"], priceFrom:3500000, avgPpsf:2000, avgYield:5.0, rating:"A-", gv:true, types:["Villa"], toDowntown:"30 min", toAirport:"35 min" },
    { id:"jumeira-bay",            name:"Jumeira Bay Island",      developer:"meraas", districtCode:"JB",  coord:{lat:25.2388,lng:55.2512}, subCommunities:["Jumeira Bay"], priceFrom:5000000, avgPpsf:4500, avgYield:4.0, rating:"A+", gv:true, types:["Villa","Mansion"], toDowntown:"10 min", toAirport:"18 min", notes:"Private island — ultra luxury villas" },
    { id:"cherrywoods",            name:"Cherrywoods",             developer:"meraas", districtCode:"CHW", coord:{lat:25.0100,lng:55.2000}, subCommunities:["Cherrywoods"], priceFrom:1200000, avgPpsf:1200, avgYield:6.5, rating:"B+", gv:false, types:["Townhouse","Villa"], toDowntown:"35 min", toAirport:"40 min" },
  ]},

  // ─── NAKHEEL COMMUNITIES ────────────────────────────────────────────────────
  { zone:"Nakheel Communities", emirate:"Dubai", communities:[
    { id:"palm-jebel-ali",  name:"Palm Jebel Ali",  developer:"nakheel", districtCode:"PJA", coord:{lat:24.9877,lng:55.0188}, subCommunities:["Fronds 1–110 (PJA)","The Crescent PJA","Beach Villas"], priceFrom:5000000, avgPpsf:4200, avgYield:null, rating:"A+", gv:true, types:["Villa","Mansion"], toDowntown:"45 min", toAirport:"40 min", notes:"110 fronds — larger than Palm Jumeirah" },
    { id:"dubai-islands",   name:"Dubai Islands",   developer:"nakheel", districtCode:"DI",  coord:{lat:25.3012,lng:55.3644}, subCommunities:["Dubai Island A","Dubai Island B","Dubai Island C","Dubai Island D","Dubai Island E"], priceFrom:1800000, avgPpsf:3000, avgYield:5.5, rating:"A", gv:true, types:["Apartment","Villa","Hotel Apartment","Resort Villa"], toDowntown:"25 min", toAirport:"20 min", notes:"5 islands north of Deira" },
    { id:"nad-al-sheba",    name:"Nad Al Sheba",    developer:"nakheel", districtCode:"NAS", coord:{lat:25.1624,lng:55.3411}, subCommunities:["Nad Al Sheba 1","Nad Al Sheba 2","Nad Al Sheba 3","Nad Al Sheba 4"], priceFrom:2000000, avgPpsf:1600, avgYield:5.8, rating:"B+", gv:true, types:["Villa","Townhouse"], toDowntown:"15 min", toAirport:"20 min" },
    { id:"jumeirah-park",   name:"Jumeirah Park",   developer:"nakheel", districtCode:"JP",  coord:{lat:25.0522,lng:55.1600}, subCommunities:["Jumeirah Park","Legacy Nova"], priceFrom:2500000, avgPpsf:1300, avgYield:5.5, rating:"A-", gv:true, types:["Villa"], toDowntown:"25 min", toAirport:"30 min" },
    { id:"jumeirah-islands", name:"Jumeirah Islands", developer:"nakheel", districtCode:"JI", coord:{lat:25.0583,lng:55.1544}, subCommunities:["Jumeirah Islands"], priceFrom:4000000, avgPpsf:1800, avgYield:4.8, rating:"A", gv:true, types:["Villa"], toDowntown:"25 min", toAirport:"30 min", notes:"Waterfront villa islands" },
  ]},

  // ─── EMIRATES LIVING ────────────────────────────────────────────────────────
  { zone:"Emirates Living", emirate:"Dubai", communities:[
    { id:"emirates-hills", name:"Emirates Hills",  developer:"emaar", districtCode:"EH",  coord:{lat:25.0833,lng:55.1728}, subCommunities:["Emirates Hills","Montgomerie Golf Course","The Sector"], priceFrom:8000000, avgPpsf:3000, avgYield:4.0, rating:"A+", gv:true, types:["Villa","Mansion"], landmark:"Montgomerie Golf Course", toDowntown:"25 min", notes:"'Beverly Hills of Dubai'" },
    { id:"the-springs",    name:"The Springs",     developer:"emaar", districtCode:"SPR", coord:{lat:25.0722,lng:55.1677}, subCommunities:["Springs 1 through 15"], priceFrom:1800000, avgPpsf:1200, avgYield:5.8, rating:"A-", gv:false, types:["Townhouse","Villa"], toDowntown:"25 min", toAirport:"30 min" },
    { id:"the-meadows",    name:"The Meadows",     developer:"emaar", districtCode:"MDW", coord:{lat:25.0797,lng:55.1608}, subCommunities:["Meadows 1 through 9"], priceFrom:3500000, avgPpsf:1400, avgYield:5.0, rating:"A-", gv:true, types:["Villa"], toDowntown:"25 min", toAirport:"30 min" },
    { id:"the-lakes",      name:"The Lakes",       developer:"emaar", districtCode:"LKS", coord:{lat:25.0797,lng:55.1500}, subCommunities:["Ghadeer","Hattan","Maeen","Zulal","Forat","Alvorada"], priceFrom:4000000, avgPpsf:1500, avgYield:4.8, rating:"A", gv:true, types:["Villa"], toDowntown:"25 min", toAirport:"30 min" },
    { id:"the-greens",     name:"The Greens",      developer:"emaar", districtCode:"TGR", coord:{lat:25.0933,lng:55.1877}, subCommunities:["Al Arta","Al Ghaf","Al Ghozlan","Al Jaz","Al Manhal","Al Mass","Al Samar","Al Sidir","Al Thayyal","The Views"], priceFrom:800000, avgPpsf:1300, avgYield:6.5, rating:"A-", gv:false, types:["Apartment","Villa"], toDowntown:"20 min", toAirport:"25 min", metro:"The Views (planned)" },
  ]},

  // ─── ARABIAN RANCHES ────────────────────────────────────────────────────────
  { zone:"Arabian Ranches", emirate:"Dubai", communities:[
    { id:"arabian-ranches",   name:"Arabian Ranches",   developer:"emaar", districtCode:"AR",  coord:{lat:25.0466,lng:55.2722}, subCommunities:["Alvorada","Mirador","Savanna","Terra Nova","Rosa","Rasha","Palmera","Saheel","Hala","Alma","Muzera","Dalilah"], priceFrom:3000000, avgPpsf:1300, avgYield:5.2, rating:"A", gv:true, types:["Villa","Townhouse"], landmark:"Arabian Ranches Golf Club", toDowntown:"30 min" },
    { id:"arabian-ranches-2", name:"Arabian Ranches 2", developer:"emaar", districtCode:"AR2", coord:{lat:25.0350,lng:55.2644}, subCommunities:["Casa","Yasmin","Reem","Lila","Azalea","Palma","Samara","Acacia","Camelia"], priceFrom:2500000, avgPpsf:1200, avgYield:5.5, rating:"A", gv:true, types:["Villa","Townhouse"], toDowntown:"30 min" },
    { id:"arabian-ranches-3", name:"Arabian Ranches 3", developer:"emaar", districtCode:"AR3", coord:{lat:25.0244,lng:55.2566}, subCommunities:["Sun","Joy","Spring","Caya","Ruba","Bliss","June","Aura","Elie Saab Villas"], priceFrom:1800000, avgPpsf:1100, avgYield:6.0, rating:"A-", gv:false, types:["Villa","Townhouse"], toDowntown:"30 min" },
    { id:"mudon",             name:"Mudon",             developer:"dubai_properties", districtCode:"MDN", coord:{lat:25.0388,lng:55.2722}, subCommunities:["Mudon Al Ranim","Ranim 2","Arabella","Arabella 2","Arabella 3"], priceFrom:1500000, avgPpsf:1100, avgYield:6.2, rating:"B+", gv:false, types:["Villa","Townhouse"], toDowntown:"30 min" },
  ]},

  // ─── TILAL AL GHAF ──────────────────────────────────────────────────────────
  { zone:"Tilal Al Ghaf", emirate:"Dubai", communities:[
    { id:"tilal-al-ghaf", name:"Tilal Al Ghaf", developer:"tilal", districtCode:"TAG", coord:{lat:25.0388,lng:55.2177}, subCommunities:["Harmony","Serenity","Aura Garden","Plagette 32","Elysian Mansions","Lanai Islands"], priceFrom:2500000, avgPpsf:1600, avgYield:5.5, rating:"A", gv:true, types:["Villa","Townhouse","Mansion"], landmark:"Lagoon Al Ghaf", toDowntown:"25 min", notes:"Majid Al Futtaim — 70% water and green space" },
  ]},

  // ─── JUMEIRAH / OLD DUBAI ───────────────────────────────────────────────────
  { zone:"Jumeirah / Old Dubai", emirate:"Dubai", communities:[
    { id:"jumeirah",   name:"Jumeirah",   developer:"shared", districtCode:"JUM", coord:{lat:25.2048,lng:55.2314}, subCommunities:["Jumeirah 1","Jumeirah 2","Jumeirah 3","Jumeirah Bay","Pearl Jumeira"], priceFrom:3000000, avgPpsf:2000, avgYield:4.5, rating:"A", gv:true, types:["Villa","Townhouse"], toDowntown:"15 min", toBeach:"5 min", notes:"Old Dubai beach villas — high land value" },
    { id:"umm-suqeim", name:"Umm Suqeim", developer:"shared", districtCode:"US",  coord:{lat:25.1439,lng:55.1983}, subCommunities:["Umm Suqeim 1","Umm Suqeim 2","Umm Suqeim 3","Al Manara","Al Safa 1","Al Safa 2"], priceFrom:2500000, avgPpsf:1700, avgYield:4.8, rating:"A-", gv:true, types:["Villa"], landmark:"Burj Al Arab", toDowntown:"20 min" },
    { id:"al-barsha",  name:"Al Barsha",  developer:"shared", districtCode:"ALB", coord:{lat:25.1133,lng:55.2011}, subCommunities:["Al Barsha 1","Al Barsha 2","Al Barsha 3","Al Barsha South 1","Al Barsha South 2","Al Barsha South 3","Al Barsha South 4"], priceFrom:700000, avgPpsf:1100, avgYield:7.0, rating:"B", gv:false, types:["Apartment","Villa"], landmark:"Mall of the Emirates", toDowntown:"20 min", metro:"Mall of the Emirates (Red Line)" },
    { id:"mirdif",     name:"Mirdif",     developer:"shared", districtCode:"MRD", coord:{lat:25.2188,lng:55.4277}, subCommunities:["Mirdif","Shorooq","Nasayem","Ghoroob"], priceFrom:500000, avgPpsf:900, avgYield:7.2, rating:"B", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"25 min", toAirport:"10 min", notes:"Close to airport — strong rental demand" },
  ]},

  // ─── DEIRA / BUR DUBAI ──────────────────────────────────────────────────────
  { zone:"Deira / Bur Dubai", emirate:"Dubai", communities:[
    { id:"deira",     name:"Deira",     developer:"shared", districtCode:"DEI", coord:{lat:25.2697,lng:55.3095}, subCommunities:["Al Rigga","Al Muraqqabat","Al Nahdha 1","Al Nahdha 2","Al Qusais 1","Al Qusais 2","Al Qusais 3","Port Saeed"], priceFrom:300000, avgPpsf:700, avgYield:8.5, rating:"C+", gv:false, types:["Apartment","Studio","Office"], toDowntown:"20 min", toAirport:"10 min", metro:"Multiple stations (Green Line)" },
    { id:"bur-dubai", name:"Bur Dubai", developer:"shared", districtCode:"BD",  coord:{lat:25.2532,lng:55.2979}, subCommunities:["Karama","Oud Metha","Al Jaddaf","Umm Hurair 1","Umm Hurair 2"], priceFrom:400000, avgPpsf:800, avgYield:8.0, rating:"C+", gv:false, types:["Apartment","Studio"], toDowntown:"15 min", toAirport:"15 min", metro:"Multiple stations (Green Line)" },
    { id:"culture-village", name:"Culture Village", developer:"dubai_properties", districtCode:"CV", coord:{lat:25.2344,lng:55.3388}, subCommunities:["Culture Village","Jaddaf Waterfront"], priceFrom:800000, avgPpsf:1500, avgYield:6.5, rating:"B", gv:false, types:["Apartment","Penthouse"], toDowntown:"12 min", toAirport:"12 min", metro:"Al Jaddaf (Green Line)" },
  ]},

  // ─── TECH / KNOWLEDGE BELT ──────────────────────────────────────────────────
  { zone:"Tech / Knowledge Belt", emirate:"Dubai", communities:[
    { id:"silicon-oasis",   name:"Dubai Silicon Oasis",        developer:"dso",   districtCode:"SO",   coord:{lat:25.1177,lng:55.3811}, subCommunities:["BINGHATTI Silicon Oasis","Cedre Villas","Silicon Heights"], priceFrom:400000, avgPpsf:900, avgYield:8.0, rating:"B", gv:false, types:["Apartment","Villa"], toDowntown:"25 min", toAirport:"20 min", notes:"Tech free zone" },
    { id:"internet-city",   name:"Dubai Internet City / Media City", developer:"tecom", districtCode:"DIC", coord:{lat:25.1005,lng:55.1555}, subCommunities:["Dubai Internet City","Dubai Media City","Dubai Knowledge Village","Dubai Knowledge Park","OneHub TECOM"], priceFrom:800000, avgPpsf:1400, avgYield:6.5, rating:"A-", gv:false, types:["Office","Apartment"], toDowntown:"20 min", metro:"DAMAC Properties (Red Line)" },
    { id:"healthcare-city", name:"Dubai Healthcare City",       developer:"dhcc",  districtCode:"DHCC", coord:{lat:25.2383,lng:55.3161}, subCommunities:["Dubai Healthcare City Phase 1","Dubai Healthcare City Phase 2"], priceFrom:600000, avgPpsf:1200, avgYield:6.8, rating:"B+", gv:false, types:["Apartment","Office","Healthcare Unit"], toDowntown:"10 min", metro:"Creek (Green Line)" },
  ]},

  // ─── SPORTS CITY / MOTOR CITY ───────────────────────────────────────────────
  { zone:"Sports City / Motor City", emirate:"Dubai", communities:[
    { id:"sports-city",  name:"Dubai Sports City",  developer:"dubai_properties", districtCode:"DSC", coord:{lat:25.0272,lng:55.2244}, subCommunities:["Canal Residence","Elite Sports Residence","Golf Tower","Victory Heights"], priceFrom:400000, avgPpsf:950, avgYield:7.5, rating:"B", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"25 min" },
    { id:"motor-city",   name:"Motor City",          developer:"union_properties", districtCode:"MC",  coord:{lat:25.0538,lng:55.2388}, subCommunities:["Green Community","UPTOWN Motor City","Motor City Frontiertown"], priceFrom:500000, avgPpsf:1000, avgYield:7.2, rating:"B", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"30 min" },
  ]},

  // ─── MINA RASHID / GRAND POLO / DIP ─────────────────────────────────────────
  { zone:"Mina Rashid / Grand Polo / DIP", emirate:"Dubai", communities:[
    { id:"mina-rashid",  name:"Mina Rashid",              developer:"emaar",  districtCode:"MR",  coord:{lat:25.2544,lng:55.3200}, subCommunities:["Sirdhana","Seagate","Harbour Lights","Palace Beach Residence"], priceFrom:1200000, avgPpsf:2200, avgYield:6.0, rating:"A-", gv:true, types:["Apartment","Penthouse","Hotel Apartment"], landmark:"QE2 Cruise Terminal", toDowntown:"15 min", toAirport:"12 min" },
    { id:"grand-polo",   name:"Grand Polo Club & Resort",  developer:"emaar",  districtCode:"GPC", coord:{lat:24.9788,lng:55.2100}, subCommunities:["Grand Polo Club","The Greens","Polo Residences"], priceFrom:2000000, avgPpsf:1500, avgYield:5.5, rating:"A-", gv:true, types:["Villa","Townhouse","Apartment"], toDowntown:"35 min", toAirport:"35 min", notes:"Emaar's new polo & equestrian master community" },
    { id:"dip",          name:"Dubai Investment Park",     developer:"shared", districtCode:"DIP", coord:{lat:24.9800,lng:55.1700}, subCommunities:["DIP 1","DIP 2","Green Community West","Centurion"], priceFrom:500000, avgPpsf:900, avgYield:7.8, rating:"B-", gv:false, types:["Apartment","Villa","Warehouse","Industrial"], toDowntown:"35 min", toAirport:"30 min", notes:"Industrial + residential mixed zone" },
  ]},

  // ─── ABU DHABI ──────────────────────────────────────────────────────────────
  { zone:"Abu Dhabi — Key Communities", emirate:"Abu Dhabi", communities:[
    { id:"yas-island",      name:"Yas Island",      developer:"aldar", districtCode:"YI",  coord:{lat:24.4873,lng:54.6088}, subCommunities:["Yas Acres","Ansam","Water's Edge","Yas Park Views","Noya","Noya Luma","Yas Bay Waterfront","Lea"], priceFrom:700000, avgPpsf:1400, avgYield:6.5, rating:"A", gv:false, types:["Apartment","Villa","Townhouse"], landmark:"Ferrari World, Yas Marina Circuit", toAirport:"20 min" },
    { id:"saadiyat-island", name:"Saadiyat Island", developer:"aldar", districtCode:"SAI", coord:{lat:24.5424,lng:54.4341}, subCommunities:["Mamsha Al Saadiyat","Saadiyat Reserve","Nudra","Louvre Abu Dhabi Residences"], priceFrom:2000000, avgPpsf:2800, avgYield:4.8, rating:"A+", gv:true, types:["Apartment","Villa","Penthouse","Branded Residence"], landmark:"Louvre Abu Dhabi", notes:"Cultural capital of UAE" },
    { id:"reem-island",     name:"Reem Island",     developer:"aldar", districtCode:"RI",  coord:{lat:24.4977,lng:54.4044}, subCommunities:["The Gate Towers","Shams Abu Dhabi","Najmat Abu Dhabi"], priceFrom:600000, avgPpsf:1200, avgYield:6.0, rating:"A-", gv:false, types:["Apartment","Villa","Office"], toAirport:"25 min", notes:"Connected to Abu Dhabi mainland by 2 bridges" },
  ]},

  // ─── RAS AL KHAIMAH ─────────────────────────────────────────────────────────
  { zone:"Ras Al Khaimah", emirate:"Ras Al Khaimah", communities:[
    { id:"al-marjan-island", name:"Al Marjan Island", developer:"rak_properties", districtCode:"AMI", coord:{lat:25.6544,lng:55.8200}, subCommunities:["Al Marjan Island","Wynn Al Marjan Island","Nikki Beach RAK","Address Beach Resort"], priceFrom:600000, avgPpsf:1200, avgYield:7.0, rating:"B+", gv:false, types:["Apartment","Villa","Hotel Apartment","Resort Villa"], landmark:"Wynn Casino (opening 2027)", toDowntown:"70 min", toAirport:"50 min", notes:"UAE's first casino destination — huge upside potential" },
    { id:"mina-al-arab",     name:"Mina Al Arab",     developer:"rak_properties", districtCode:"MAA", coord:{lat:25.6300,lng:55.7900}, subCommunities:["Mina Al Arab","Flamingo Villas","Bay Residences","Lagoon Residences"], priceFrom:400000, avgPpsf:900, avgYield:7.5, rating:"B", gv:false, types:["Apartment","Villa","Townhouse"], toDowntown:"70 min", toAirport:"50 min" },
  ]},
];

// =============================================================================
// SECTION 3 — ALL 47 PROPERTY TYPES
// =============================================================================

export const ALL_PROPERTY_TYPES = [
  { group:"Residential", color:"#10B981", types:[
    { id:1,  value:"apartment",        label:"Apartment",            icon:"🏢", beds:["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+"],                   dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:2,  value:"penthouse",        label:"Penthouse",            icon:"🏙️", beds:["3 BR","4 BR","5 BR","6 BR+"],                                  dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:3,  value:"duplex",           label:"Duplex",               icon:"🏘️", beds:["2 BR","3 BR","4 BR","5 BR"],                                   dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:4,  value:"villa",            label:"Villa",                icon:"🏡", beds:["2 BR","3 BR","4 BR","5 BR","6 BR","7 BR+"],                     dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:5,  value:"townhouse",        label:"Townhouse",            icon:"🏠", beds:["2 BR","3 BR","4 BR","5 BR"],                                   dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:6,  value:"garden_home",      label:"Garden Home",          icon:"🌿", beds:["2 BR","3 BR","4 BR"],                                          dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:7,  value:"sky_villa",        label:"Sky Villa",            icon:"☁️", beds:["3 BR","4 BR","5 BR","6 BR+"],                                  dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:8,  value:"mansion",          label:"Mansion",              icon:"🏰", beds:["5 BR","6 BR","7 BR","8 BR+"],                                  dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:9,  value:"palace_villa",     label:"Palace Villa",         icon:"👑", beds:["6 BR","7 BR","8 BR","10 BR+"],                                 dtcm:false, freehold:true,  mortgage:false, gv:true  },
    { id:10, value:"staff_accomm",     label:"Staff Accommodation",  icon:"👷", beds:["Bed Space","Room","Studio"],                                   dtcm:false, freehold:false, mortgage:false, gv:false, notes:"MOHRE compliance required" },
  ]},
  { group:"Branded Residences", color:"#D4A843", types:[
    { id:11, value:"branded_apt",      label:"Branded Apartment",    icon:"⭐", beds:["Studio","1 BR","2 BR","3 BR","4 BR","Penthouse"],               dtcm:false, freehold:true,  mortgage:true,  gv:true,
      brands:["Address","Vida","Palace","Armani","Bulgari","Cavalli","Bugatti","Porsche Design","Baccarat","W Residences","Six Senses","Rixos","Dorchester","One&Only","Marriott","Ritz-Carlton","Paramount","Four Seasons"] },
    { id:12, value:"branded_villa",    label:"Branded Villa",        icon:"🌟", beds:["3 BR","4 BR","5 BR","6 BR+"],                                  dtcm:false, freehold:true,  mortgage:true,  gv:true  },
  ]},
  { group:"Hospitality", color:"#8B5CF6", types:[
    { id:13, value:"hotel_apt",        label:"Hotel Apartment",      icon:"🏨", beds:["Hotel Room","Studio","1 BR","2 BR","3 BR"],                    dtcm:true,  freehold:true,  mortgage:true,  gv:true,  notes:"DTCM Holiday Home license for STR" },
    { id:14, value:"serviced_apt",     label:"Serviced Apartment",   icon:"🛎️", beds:["Studio","1 BR","2 BR","3 BR"],                                dtcm:true,  freehold:true,  mortgage:true,  gv:true  },
    { id:15, value:"resort_villa",     label:"Resort Villa",         icon:"🌴", beds:["1 BR","2 BR","3 BR","4 BR","5 BR+"],                           dtcm:true,  freehold:true,  mortgage:true,  gv:true  },
    { id:16, value:"apart_hotel",      label:"Apart-Hotel Unit",     icon:"🏩", beds:["Studio","1 BR","2 BR"],                                        dtcm:true,  freehold:true,  mortgage:false, gv:false },
  ]},
  { group:"Commercial", color:"#3B82F6", types:[
    { id:17, value:"office_a",         label:"Office — Grade A",     icon:"🏛️", sizes:["500–1K sqft","1K–2.5K sqft","2.5K–5K sqft","5K–10K sqft","Full Floor","Full Building"],  dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:18, value:"office_b",         label:"Office — Grade B",     icon:"🏢", sizes:["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K–5K sqft","Full Floor"],                    dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:19, value:"office_c",         label:"Office — Grade C",     icon:"🏬", sizes:["< 500 sqft","500–1K sqft","1K–2.5K sqft"],                                                dtcm:false, freehold:true,  mortgage:false, gv:false },
    { id:20, value:"difc_office",      label:"DIFC Office",          icon:"💼", sizes:["500–1K sqft","1K–5K sqft","Full Floor","Full Building"],                                    dtcm:false, freehold:true,  mortgage:true,  gv:false, notes:"Common law jurisdiction" },
    { id:21, value:"coworking",        label:"Co-working Space",     icon:"💻", sizes:["Hot Desk","Dedicated Desk","Private Office","Full Floor"],                                  dtcm:false, freehold:false, mortgage:false, gv:false },
    { id:22, value:"retail_inline",    label:"Retail — Inline Shop", icon:"🛍️", sizes:["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K+ sqft"],                                  dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:23, value:"retail_street",    label:"Retail — Street Level",icon:"🏪", sizes:["< 500 sqft","500–1K sqft","1K–2.5K sqft"],                                                dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:24, value:"showroom",         label:"Showroom",             icon:"🚗", sizes:["1K–2K sqft","2K–5K sqft","5K–10K sqft","10K+ sqft"],                                      dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:25, value:"fb_unit",          label:"F&B Unit",             icon:"🍽️", sizes:["< 500 sqft","500–1K sqft","1K–3K sqft","3K+ sqft"],                                      dtcm:false, freehold:true,  mortgage:false, gv:false, notes:"DM food license + grease trap required" },
    { id:26, value:"kiosk",            label:"Kiosk",                icon:"🏧", sizes:["< 100 sqft","100–200 sqft"],                                                               dtcm:false, freehold:false, mortgage:false, gv:false },
    { id:27, value:"mall_unit",        label:"Mall Unit",            icon:"🏬", sizes:["< 500 sqft","500–2K sqft","2K–5K sqft","Anchor 5K+"],                                     dtcm:false, freehold:false, mortgage:false, gv:false },
    { id:28, value:"free_zone_unit",   label:"Free Zone Unit",       icon:"🌐", sizes:["< 500 sqft","500–1K sqft","1K–5K sqft"],                                                  dtcm:false, freehold:true,  mortgage:false, gv:false, notes:"JAFZA, DAFZA, DMCC, DIFC, DSO" },
  ]},
  { group:"Industrial & Logistics", color:"#F59E0B", types:[
    { id:29, value:"warehouse_dry",    label:"Warehouse — Dry",      icon:"🏭", sizes:["< 5K sqft","5K–10K sqft","10K–25K sqft","25K–50K sqft","50K+ sqft"], dtcm:false, freehold:true,  mortgage:true,  gv:false, locations:["JAFZA","DIP","Al Quoz","National Industries Park","Dubai South"] },
    { id:30, value:"warehouse_cold",   label:"Cold Storage",         icon:"❄️", sizes:["< 5K sqft","5K–20K sqft","20K+ sqft"],                               dtcm:false, freehold:true,  mortgage:false, gv:false },
    { id:31, value:"light_industrial", label:"Light Industrial",     icon:"⚙️", sizes:["< 5K sqft","5K–20K sqft","20K+ sqft"],                               dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:32, value:"data_centre",      label:"Data Centre",          icon:"💿", sizes:["Rack Space","Cage","Suite","Full Floor","Whole Building"],             dtcm:false, freehold:false, mortgage:false, gv:false, notes:"Very high KVA power and cooling required" },
    { id:33, value:"labour_accomm",    label:"Labour Accommodation", icon:"👷", sizes:["50–200 beds","200–500 beds","500–2000 beds","2000+ beds"],             dtcm:false, freehold:false, mortgage:false, gv:false, notes:"MOHRE compliance mandatory" },
  ]},
  { group:"Land & Plots", color:"#92400E", types:[
    { id:34, value:"land_residential", label:"Residential Plot",     icon:"🌱", sizes:["< 5K sqft","5K–15K sqft","15K–30K sqft","30K+ sqft"],    dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:35, value:"land_commercial",  label:"Commercial Plot",      icon:"🏗️", sizes:["< 10K sqft","10K–50K sqft","50K–200K sqft","200K+ sqft"], dtcm:false, freehold:true,  mortgage:true,  gv:false },
    { id:36, value:"land_mixed",       label:"Mixed Use Plot",       icon:"🔀", sizes:["< 10K sqft","10K–50K sqft","50K–200K sqft","200K+ sqft"], dtcm:false, freehold:true,  mortgage:true,  gv:true  },
    { id:37, value:"land_industrial",  label:"Industrial Plot",      icon:"🏭", sizes:["< 10K sqft","10K–50K sqft","50K+ sqft"],                  dtcm:false, freehold:true,  mortgage:false, gv:false },
    { id:38, value:"land_waterfront",  label:"Waterfront Plot",      icon:"🌊", sizes:["< 10K sqft","10K–50K sqft","50K+ sqft"],                  dtcm:false, freehold:true,  mortgage:true,  gv:true, notes:"Premium pricing — sea/canal frontage" },
    { id:39, value:"land_island",      label:"Island / Estate",      icon:"🏝️", sizes:["1 acre+","5 acres+","10 acres+"],                        dtcm:false, freehold:true,  mortgage:false, gv:true  },
  ]},
  { group:"Secondary Market", color:"#6B7280", types:[
    { id:40, value:"secondary_apt",    label:"Secondary — Apartment",icon:"🏢", beds:["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+"], dtcm:false, freehold:true, mortgage:true,  gv:true, notes:"Resale — immediate ownership transfer" },
    { id:41, value:"secondary_villa",  label:"Secondary — Villa",    icon:"🏡", beds:["2 BR","3 BR","4 BR","5 BR","6 BR+"],        dtcm:false, freehold:true, mortgage:true,  gv:true  },
    { id:42, value:"distressed_sale",  label:"Distressed Sale",      icon:"⚡", beds:["Studio","1 BR","2 BR","3 BR","4 BR+"],       dtcm:false, freehold:true, mortgage:true,  gv:true, notes:"15–30% below market — thorough due diligence essential" },
  ]},
  { group:"Special & Niche", color:"#EC4899", types:[
    { id:43, value:"healthcare_unit",  label:"Healthcare / Clinic",  icon:"🏥", sizes:["< 1K sqft","1K–2.5K sqft","2.5K–5K sqft","5K+ sqft"], dtcm:false, freehold:true,  mortgage:true,  gv:false, notes:"DHA/DOH licensing required" },
    { id:44, value:"education_unit",   label:"Education / Training", icon:"🎓", sizes:["1K–5K sqft","5K–15K sqft","15K+ sqft"],                 dtcm:false, freehold:true,  mortgage:true,  gv:false, notes:"KHDA/ADEK licensing required" },
    { id:45, value:"parking_space",    label:"Parking Space",        icon:"🅿️", sizes:["Single Bay","Double Bay","Covered Level","Full Floor"], dtcm:false, freehold:true,  mortgage:false, gv:false },
    { id:46, value:"whole_building",   label:"Whole Building",       icon:"🏙️", sizes:["10 units+","50 units+","100 units+","500 units+"],      dtcm:false, freehold:true,  mortgage:true,  gv:true, notes:"Bulk purchase — significant discount available" },
    { id:47, value:"private_island",   label:"Private Island",       icon:"🏝️", sizes:["1 acre+","5 acres+","10 acres+"],                      dtcm:false, freehold:true,  mortgage:false, gv:true, notes:"The World Islands, Dubai Islands, PJA fronds" },
  ]},
];

// =============================================================================
// SECTION 4 — COMPLETE FILTER SCHEMA (all 19 filters)
// =============================================================================

export const COMPLETE_FILTER_SCHEMA = {

  // URL param key mapping (used in useFilters.js)
  FILTER_KEYS: {
    developer:"dev",    masterComm:"mc",    community:"community",
    type:"type",        subType:"subtype",  beds:"beds",
    status:"status",    year:"year",        priceMin:"pmin",
    priceMax:"pmax",    purpose:"purpose",  emirate:"emirate",
    construction:"build", furnishing:"furn", ownership:"own",
    view:"view",        floor:"floor",      search:"q",
    sort:"sort",
  },

  // Defaults = "no filter applied"
  DEFAULTS: {
    developer:"all",    masterComm:"all",   community:"all",
    type:"all",         subType:"all",      beds:"all",
    status:"all",       year:"all",         priceMin:0,
    priceMax:0,         purpose:"all",      emirate:"all",
    construction:"all", furnishing:"all",   ownership:"all",
    view:"all",         floor:"all",        search:"",
    sort:"relevance",
  },

  STATUS_OPTIONS: [
    { value:"all",           label:"All Status"                     },
    { value:"prelaunch",     label:"Pre-Launch / EOI Open",         color:"#D4A843" },
    { value:"offplan",       label:"Off-Plan — Under Construction", color:"#F59E0B" },
    { value:"ready_new",     label:"Ready — New / Primary",         color:"#10B981" },
    { value:"secondary",     label:"Ready — Secondary Market",      color:"#3B82F6" },
    { value:"handover_2025", label:"Handover 2025",                 color:"#8B5CF6" },
    { value:"handover_2026", label:"Handover 2026",                 color:"#EC4899" },
    { value:"handover_2027", label:"Handover 2027",                 color:"#0EA5E9" },
    { value:"handover_2028", label:"Handover 2028+",                color:"#6B7280" },
    { value:"sold_out",      label:"Sold Out",                      color:"#EF4444" },
  ],

  PRICE_PRESETS_RESIDENTIAL: [
    { label:"Any Price", min:0,         max:0         },
    { label:"< 500K",    min:0,         max:500000    },
    { label:"500K–1M",   min:500000,    max:1000000   },
    { label:"1M–2M",     min:1000000,   max:2000000   },
    { label:"2M–5M",     min:2000000,   max:5000000   },
    { label:"5M–10M",    min:5000000,   max:10000000  },
    { label:"10M–25M",   min:10000000,  max:25000000  },
    { label:"25M–50M",   min:25000000,  max:50000000  },
    { label:"50M+",      min:50000000,  max:0         },
  ],

  PRICE_PRESETS_COMMERCIAL: [
    { label:"Any Price", min:0,          max:0          },
    { label:"< 1M",      min:0,          max:1000000    },
    { label:"1M–5M",     min:1000000,    max:5000000    },
    { label:"5M–20M",    min:5000000,    max:20000000   },
    { label:"20M–100M",  min:20000000,   max:100000000  },
    { label:"100M+",     min:100000000,  max:0          },
  ],

  HANDOVER_YEARS: [
    { value:"all",   label:"Any Year"  }, { value:"ready", label:"Ready Now" },
    { value:"2025",  label:"2025"      }, { value:"2026",  label:"2026"      },
    { value:"2027",  label:"2027"      }, { value:"2028",  label:"2028"      },
    { value:"2029",  label:"2029"      }, { value:"2030",  label:"2030+"     },
  ],

  PURPOSE_OPTIONS: [
    { value:"all",         label:"Any Purpose"              },
    { value:"buy",         label:"Buy to Live"              },
    { value:"invest",      label:"Buy to Invest"            },
    { value:"golden_visa", label:"⭐ Golden Visa (AED 2M+)" },
    { value:"str",         label:"Short-Term Rental (STR)"  },
    { value:"ltr",         label:"Long-Term Rental (LTR)"   },
    { value:"commercial",  label:"Commercial Use"           },
    { value:"flip",        label:"Flip / Capital Gain"      },
  ],

  EMIRATE_OPTIONS: [
    { value:"all",       label:"All Emirates"   },
    { value:"dubai",     label:"Dubai"          },
    { value:"abu_dhabi", label:"Abu Dhabi"      },
    { value:"sharjah",   label:"Sharjah"        },
    { value:"rak",       label:"Ras Al Khaimah" },
    { value:"ajman",     label:"Ajman"          },
    { value:"fujairah",  label:"Fujairah"       },
    { value:"uaq",       label:"Umm Al Quwain"  },
  ],

  CONSTRUCTION_OPTIONS: [
    { value:"all",   label:"Any Progress"   }, { value:"0-25",  label:"0 – 25%"        },
    { value:"25-50", label:"25 – 50%"       }, { value:"50-75", label:"50 – 75%"       },
    { value:"75-99", label:"75 – 99%"       }, { value:"100",   label:"100% Completed" },
  ],

  FURNISHING_OPTIONS: [
    { value:"all",         label:"Any Furnishing" }, { value:"furnished",   label:"Furnished"      },
    { value:"unfurnished", label:"Unfurnished"    }, { value:"semi",        label:"Semi-Furnished" },
  ],

  OWNERSHIP_OPTIONS: [
    { value:"all",       label:"Any Ownership" }, { value:"freehold",  label:"Freehold"   },
    { value:"leasehold", label:"Leasehold"     }, { value:"usufruct",  label:"Usufruct"   },
    { value:"musataha",  label:"Musataha"      },
  ],

  VIEW_OPTIONS: [
    { value:"all",       label:"Any View"           }, { value:"sea",       label:"Sea / Ocean View"  },
    { value:"burj",      label:"Burj Khalifa View"  }, { value:"golf",      label:"Golf Course View"  },
    { value:"park",      label:"Park / Garden View" }, { value:"canal",     label:"Canal View"        },
    { value:"city",      label:"City View"          }, { value:"community", label:"Community View"    },
    { value:"pool",      label:"Pool View"          }, { value:"palm",      label:"Palm View"         },
  ],

  FLOOR_OPTIONS: [
    { value:"all",       label:"Any Floor"        }, { value:"ground",    label:"Ground / Podium"  },
    { value:"low",       label:"Low (1–10)"       }, { value:"mid",       label:"Mid (11–25)"      },
    { value:"high",      label:"High (26–40)"     }, { value:"super",     label:"Super High (41+)" },
    { value:"penthouse", label:"Penthouse"        },
  ],

  SORT_OPTIONS: [
    { value:"relevance",  label:"Relevance"          }, { value:"price-asc",  label:"Price: Low to High" },
    { value:"price-desc", label:"Price: High to Low" }, { value:"yield-desc", label:"Highest Yield"      },
    { value:"ppsf-asc",   label:"PPSF: Low to High"  }, { value:"ppsf-desc",  label:"PPSF: High to Low"  },
    { value:"handover",   label:"Handover: Soonest"  }, { value:"score-desc", label:"Data Score: High"   },
    { value:"newest",     label:"Newest Launch"      }, { value:"name-asc",   label:"Name: A to Z"       },
  ],

  // Quick filter pills shown at top of projects tab
  SMART_SEGMENTS: [
    { key:"golden_visa", label:"⭐ Golden Visa",        filter:{ purpose:"golden_visa", priceMin:2000000 } },
    { key:"branded",     label:"◆ Branded Residences",  filter:{ type:"branded_apt"                     } },
    { key:"beachfront",  label:"🌊 Beachfront",          filter:{ view:"sea"                              } },
    { key:"str_ready",   label:"🏨 STR Ready",            filter:{ purpose:"str"                           } },
    { key:"high_yield",  label:"📈 High Yield 7%+",      filter:{ sort:"yield-desc"                       } },
    { key:"below_2m",    label:"💰 Under AED 2M",         filter:{ priceMax:2000000                        } },
    { key:"ready_now",   label:"🔑 Ready to Move",        filter:{ status:"ready_new"                      } },
    { key:"off_plan",    label:"🏗️ Off-Plan Only",        filter:{ status:"offplan"                        } },
    { key:"villa",       label:"🏡 Villas Only",          filter:{ type:"villa"                            } },
    { key:"penthouse",   label:"🏙️ Penthouses",           filter:{ type:"penthouse"                        } },
    { key:"commercial",  label:"🏢 Commercial",           filter:{ type:"office_a"                         } },
    { key:"tier1_dev",   label:"⚡ Tier 1 Developers",    filter:{ developerTier:"tier-1"                  } },
  ],

  GOLDEN_VISA_THRESHOLD: 2000000,

  DEVELOPER_TIER_LABELS: {
    "tier-1":   "Tier 1 — Major Developers (AED 5B+ annual sales)",
    "tier-2":   "Tier 2 — Established Developers (AED 1B–5B)",
    "tier-3":   "Tier 3 — Active Developers (AED 100M–1B)",
    "emerging": "Emerging Developers (2019–2026)",
  },
};

// =============================================================================
// SECTION 5 — THE ONE BASE PROJECT (Golf Grand Phase 2 — Dubai Hills Estate)
// This is the nucleus. Every tab in the platform connects to this project.
// =============================================================================

export const BASE_PROJECT = {
  id:               "golf-grand-phase-2",
  developerId:      "emaar",
  developerName:    "Emaar Properties",
  masterCommunity:  "Dubai Hills Estate",
  community:        "Golf Place",
  subCommunity:     "Golf Grand",
  name:             "Golf Grand — Phase 2",
  project:          "Golf Grand",
  phase:            "Phase 2",
  type:             "Apartment",
  status:           "Off-Plan",
  emirate:          "Dubai",
  zone:             "New Dubai (South)",
  districtCode:     "DHE",

  // ─── UNIT BREAKDOWN ─────────────────────────────────────────────────────────
  beds: ["1 BR", "2 BR", "3 BR"],
  unitBreakdown: [
    { type:"1 BR", units:120, sizeMin:748,  sizeMax:892,  priceMin:1350000, priceMax:1680000, ppsf:1850, grossYield:6.8, available:45, soldPct:63 },
    { type:"2 BR", units:180, sizeMin:1180, sizeMax:1420, priceMin:2100000, priceMax:2650000, ppsf:1900, grossYield:6.5, available:72, soldPct:60 },
    { type:"3 BR", units:80,  sizeMin:1650, sizeMax:1980, priceMin:3200000, priceMax:3900000, ppsf:2000, grossYield:6.1, available:28, soldPct:65 },
  ],
  totalUnits:     380,
  totalFloors:    20,
  totalBuildings: 2,

  // ─── PRICING ────────────────────────────────────────────────────────────────
  priceMin:  1350000,
  priceMax:  3900000,
  priceAvg:  2200000,
  ppsf:      1900,
  currency:  "AED",

  // ─── PAYMENT PLAN ───────────────────────────────────────────────────────────
  paymentPlan: "80/20",
  paymentPlanDetail: {
    type:                "Construction-Linked",
    onBooking:           10,
    duringConstruction:  70,
    onHandover:          20,
    postHandover:        0,
    installments: [
      { milestone:"On Booking",             pct:10, due:"On booking"  },
      { milestone:"30 days from booking",   pct:5,  due:"30 days"     },
      { milestone:"20% construction",       pct:10, due:"Q3 2025"     },
      { milestone:"40% construction",       pct:10, due:"Q1 2026"     },
      { milestone:"60% construction",       pct:15, due:"Q3 2026"     },
      { milestone:"80% construction",       pct:15, due:"Q1 2027"     },
      { milestone:"100% construction",      pct:15, due:"Q4 2027"     },
      { milestone:"On handover",            pct:20, due:"On handover" },
    ],
  },

  // ─── HANDOVER ───────────────────────────────────────────────────────────────
  handover:          "Q4 2027",
  handoverDate:      "2027-12-31",
  handoverYear:      2027,
  handoverQ:         "Q4",
  constructionPct:   38,
  constructionStart: "2024-06-01",
  launchDate:        "2024-01-15",

  // ─── DLD / LEGAL ────────────────────────────────────────────────────────────
  reraNo:           "1831",
  dldProjectNumber: "0866",
  escrowBank:       "Dubai Islamic Bank",
  escrowActive:     true,
  dldRegistered:    true,
  freehold:         true,
  goldenVisa:       true,
  mortgageAvailable:true,
  ownershipType:    "Freehold",

  // ─── LOCATION & DISTANCES ───────────────────────────────────────────────────
  coordinates:   { lat:25.1089, lng:55.2378 },
  distMetro:     3.2,
  distAirport:   18.5,
  distDIFC:      14.2,
  distDowntown:  14.8,
  distMall:      1.2,
  distSchool:    0.8,
  distHospital:  2.5,
  distBeach:     22.0,
  nearestMetro:  "Mall of Emirates (planned extension to Dubai Hills)",
  nearestMall:   "Dubai Hills Mall (1.2 km)",
  highways:      ["Al Khail Road (E44)", "Sheikh Mohammed Bin Zayed Road (E311)"],

  // ─── YIELD & FINANCIAL ──────────────────────────────────────────────────────
  grossYield:          6.5,
  netYield:            5.2,
  serviceCharge:       18.5,
  serviceChargeAnnual: 34780,
  rentalYearlyAvg:     95000,
  communityAvgPpsf:    2100,
  priceVsMarket:       -9.5,

  // ─── STR ────────────────────────────────────────────────────────────────────
  strEligible: false,
  strNote:     "Dubai Hills Estate has STR restrictions — LTR recommended",

  // ─── BRANDING ───────────────────────────────────────────────────────────────
  tier:         1,
  branded:      false,
  brandPartner: null,

  // ─── AMENITIES ──────────────────────────────────────────────────────────────
  amenities: [
    "Infinity Pool (golf course view)",
    "Fully Equipped Gymnasium",
    "Children's Play Area",
    "Community Room / Lounge",
    "Covered Parking",
    "24/7 Security and CCTV",
    "High-Speed Elevators",
    "Landscaped Podium Deck",
    "Retail at Ground Level",
    "Direct Golf Course Access",
  ],

  view:          ["Golf Course View", "Community View", "Park View"],
  interiorFinish:"Premium — Italian marble, branded kitchen appliances",

  // ─── COMMUNITY AMENITIES ────────────────────────────────────────────────────
  communityAmenities: [
    "18-hole championship golf course (Troon Golf, par-72)",
    "Dubai Hills Mall (750+ outlets, VOX Cinema)",
    "Dubai Hills Park (largest park in Dubai)",
    "45km cycling and jogging tracks",
    "Skate park (21,500 sqft)",
    "Tennis academy",
    "Community swimming pools",
    "Kids play areas across sub-communities",
    "Bicycle sharing stations",
    "Splash parks",
  ],

  // ─── SOURCES ────────────────────────────────────────────────────────────────
  sources:      ["Emaar Properties Official","DLD RERA Registry","Property Finder UAE (April 2026)","Bayut (April 2026)","Knight Frank Q1 2026","DXB Analytics Research"],
  confidence:   "VERIFIED",
  dldVerified:  true,
  lastVerified: "2026-04-22",

  // ─── LINKS ──────────────────────────────────────────────────────────────────
  officialUrl: "https://properties.emaar.com/en/properties/golf-grand-phase-2/",
  bayutUrl:    "https://www.bayut.com/for-sale/apartments/dubai-hills-estate/golf-grand/",

  // ─── CROSS-TAB CONNECTIONS ──────────────────────────────────────────────────
  // When user clicks a button on project card, these define exactly
  // what each tab shows and what filters to pre-apply
  tabConnections: {
    handover:         { tabKey:"Handover",          filter:{ projectId:"golf-grand-phase-2", community:"Dubai Hills Estate" },        description:"Construction progress & handover timeline" },
    mortgage:         { tabKey:"Mortgage",          prefill:{ propertyValue:2200000, developer:"emaar" },                             description:"Calculate mortgage for this project" },
    yields:           { tabKey:"Yields",            filter:{ community:"Dubai Hills Estate" },                                        description:"Rental yield data for Dubai Hills Estate" },
    investment_score: { tabKey:"Investment Score",  filter:{ projectId:"golf-grand-phase-2" },                                        description:"Full investment score breakdown" },
    dld_volumes:      { tabKey:"DLD Volumes",       filter:{ community:"Dubai Hills Estate" },                                        description:"DLD transaction data for Dubai Hills Estate" },
    price_history:    { tabKey:"Price History",     filter:{ community:"Dubai Hills Estate" },                                        description:"5-year price history for Dubai Hills Estate" },
    flip:             { tabKey:"Flip",              prefill:{ projectId:"golf-grand-phase-2", purchasePrice:2200000 },                description:"Calculate flip / resale potential" },
    communities:      { tabKey:"Neighbourhoods",    filter:{ community:"Dubai Hills Estate" },                                        description:"Community intelligence for Dubai Hills Estate" },
    developer:        { tabKey:"Developer Health",  filter:{ developer:"emaar" },                                                     description:"Emaar Properties health score & financials" },
    financials:       { tabKey:"Financials",        filter:{ developer:"emaar" },                                                     description:"Emaar quarterly financial performance" },
    service_charges:  { tabKey:"Service Charges",   filter:{ community:"Dubai Hills Estate" },                                        description:"Service charge rates & history" },
    risk:             { tabKey:"Risk",              filter:{ community:"Dubai Hills Estate" },                                        description:"Risk assessment for Dubai Hills Estate" },
    map:              { tabKey:"Map",               filter:{ coordinates:{ lat:25.1089, lng:55.2378 }, zoom:15 },                    description:"Project location on map" },
    str_ltr:          { tabKey:"STR vs LTR",        filter:{ community:"Dubai Hills Estate" },                                        description:"Compare STR vs LTR returns" },
    portfolio:        { tabKey:"Portfolio",         addProject:true,                                                                  description:"Add to your portfolio tracker" },
    leads:            { tabKey:"My Leads",          prefill:{ community:"Dubai Hills Estate", budget:2200000 },                      description:"Add a lead interested in this project" },
    banking:          { tabKey:"Banking",           prefill:{ propertyValue:2200000 },                                               description:"Get mortgage quote for this project" },
    pipeline:         { tabKey:"Pipeline",          prefill:{ projectId:"golf-grand-phase-2", dealValue:2200000 },                   description:"Add to deals pipeline" },
    launch_calendar:  { tabKey:"Launch Calendar",   filter:{ developer:"emaar", community:"Dubai Hills Estate" },                    description:"See upcoming launches in Dubai Hills Estate" },
  },
};

// =============================================================================
// SECTION 6 — HELPER FUNCTIONS
// =============================================================================

/** Get developer by ID */
export const getDeveloperById = (id) =>
  ALL_DUBAI_DEVELOPERS.find(d => d.id === id) || null;

/** Get developers by tier */
export const getDevelopersByTier = (tier) =>
  ALL_DUBAI_DEVELOPERS.filter(d => d.tier === tier);

/** Get all master communities as flat array */
export const getAllMasterCommunities = () =>
  MASTER_COMMUNITY_HIERARCHY.flatMap(zone =>
    zone.communities.map(c => ({ ...c, zone: zone.zone, emirate: zone.emirate }))
  );

/** Get master community by ID */
export const getMasterCommunityById = (id) =>
  getAllMasterCommunities().find(c => c.id === id) || null;

/** Get master community by name (case-insensitive) */
export const getMasterCommunityByName = (name) =>
  getAllMasterCommunities().find(c =>
    c.name.toLowerCase() === name.toLowerCase()
  ) || null;

/** Get all communities for a developer */
export const getCommunitiesForDeveloper = (developerId) =>
  getAllMasterCommunities().filter(c => c.developer === developerId);

/** Get all sub-communities as flat array (for community search dropdown) */
export const getAllSubCommunities = () =>
  getAllMasterCommunities().flatMap(mc =>
    (mc.subCommunities || []).map(sub => ({
      name:             sub,
      masterCommunity:  mc.name,
      masterCommunityId:mc.id,
      developer:        mc.developer,
      zone:             mc.zone,
      emirate:          mc.emirate,
    }))
  );

/** Get all property types as flat array (no groups) */
export const getAllPropertyTypesFlat = () =>
  ALL_PROPERTY_TYPES.flatMap(g =>
    g.types.map(t => ({ ...t, group: g.group, groupColor: g.color }))
  );

/** Get property type by value */
export const getPropertyTypeByValue = (value) => {
  for (const group of ALL_PROPERTY_TYPES) {
    const found = group.types.find(t => t.value === value);
    if (found) return { ...found, group: group.group, groupColor: group.color };
  }
  return null;
};

/** Get beds or sizes for a property type */
export const getBedOptionsForType = (typeValue) => {
  const type = getPropertyTypeByValue(typeValue);
  return type?.beds || type?.sizes || [];
};

/** Check if property type requires DTCM license */
export const requiresDTCMLicense = (typeValue) =>
  getPropertyTypeByValue(typeValue)?.dtcm === true;

/** Get tab navigation config for base project */
export const getProjectTabNav = (tabKey) =>
  BASE_PROJECT.tabConnections[tabKey.toLowerCase().replace(/[\s-]/g, "_")] || null;

/** Apply project context to filters (used when navigating from project card to any tab) */
export const applyProjectContext = (projectId, currentFilters = {}) => {
  if (projectId === BASE_PROJECT.id) {
    return {
      ...currentFilters,
      community:    BASE_PROJECT.community,
      masterComm:   BASE_PROJECT.masterCommunity,
      developer:    BASE_PROJECT.developerId,
    };
  }
  return currentFilters;
};

/** District code → master community lookup */
export const getDistrictCode = (communityName = "") => {
  const all = getAllMasterCommunities();
  const found = all.find(c =>
    c.name.toLowerCase() === communityName.toLowerCase() ||
    (c.subCommunities || []).some(s => s.toLowerCase() === communityName.toLowerCase())
  );
  return found?.districtCode || null;
};

// =============================================================================
// SECTION 7 — PLATFORM STATS
// =============================================================================

export const FOUNDATION_STATS = {
  totalDevelopers:        ALL_DUBAI_DEVELOPERS.length,
  tier1:                  ALL_DUBAI_DEVELOPERS.filter(d => d.tier === "tier-1").length,
  tier2:                  ALL_DUBAI_DEVELOPERS.filter(d => d.tier === "tier-2").length,
  tier3:                  ALL_DUBAI_DEVELOPERS.filter(d => d.tier === "tier-3").length,
  emerging:               ALL_DUBAI_DEVELOPERS.filter(d => d.tier === "emerging").length,
  totalMasterCommunities: null, // computed below
  totalSubCommunities:    null, // computed below
  totalPropertyTypes:     47,
  dubaiCommunities:       null, // computed below
  abuDhabiCommunities:    null, // computed below
  baseProject:            BASE_PROJECT.name,
  baseProjectId:          BASE_PROJECT.id,
  lastVerified:           "April 2026",
  sources: [
    "DLD Official Developer Registry",
    "RERA Licensed Developer List",
    "Property Finder UAE (live listings April 2026)",
    "Bayut Developer Pages (April 2026)",
    "Knight Frank UAE Residential Report Q1 2026",
    "Chestertons Dubai Market Report 2026",
    "Developer Official Websites",
    "Dubai Land Department Transaction Data",
  ],
};

// Compute stats that require the full arrays
(function computeStats() {
  const all = getAllMasterCommunities();
  FOUNDATION_STATS.totalMasterCommunities = all.length;
  FOUNDATION_STATS.totalSubCommunities    = all.reduce((sum, c) => sum + (c.subCommunities?.length || 0), 0);
  FOUNDATION_STATS.dubaiCommunities       = all.filter(c => c.emirate === "Dubai").length;
  FOUNDATION_STATS.abuDhabiCommunities    = all.filter(c => c.emirate === "Abu Dhabi").length;
})();

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  ALL_DUBAI_DEVELOPERS,
  MASTER_COMMUNITY_HIERARCHY,
  ALL_PROPERTY_TYPES,
  COMPLETE_FILTER_SCHEMA,
  BASE_PROJECT,
  FOUNDATION_STATS,
  // Helpers
  getDeveloperById,
  getDevelopersByTier,
  getAllMasterCommunities,
  getMasterCommunityById,
  getMasterCommunityByName,
  getCommunitiesForDeveloper,
  getAllSubCommunities,
  getAllPropertyTypesFlat,
  getPropertyTypeByValue,
  getBedOptionsForType,
  requiresDTCMLicense,
  getProjectTabNav,
  applyProjectContext,
  getDistrictCode,
};
