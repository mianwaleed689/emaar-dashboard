const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

// ── RESEARCH-BACKED COMMUNITY DATA ───────────────────────────────
// Sources: Bayut Sales Report 2025, DLD Transaction Data, REIDIN Dec 2025,
// Red Horizon Dec 2025, Totality Real Estate 2025, DXB Analytics 2026,
// Knight Frank Q3 2025, Cavendish Maxwell Q3 2025

const NEW_COMMUNITIES = [
  // ── BUR DUBAI SECTOR ──────────────────────────────────────────
  { id: "jumeirah-1", name: "Jumeirah 1", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2100, grossYieldPct: 5.2, coordinates: { lat: 25.2048, lng: 55.2708 }, description: "Established beachside community with villas and low-rise apartments", tenantProfile: "Families & Professionals" },
  { id: "jumeirah-2", name: "Jumeirah 2", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2050, grossYieldPct: 5.0, coordinates: { lat: 25.1972, lng: 55.2543 }, description: "Quiet residential area with beach access and family villas", tenantProfile: "Families" },
  { id: "jumeirah-3", name: "Jumeirah 3", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1980, grossYieldPct: 5.3, coordinates: { lat: 25.1897, lng: 55.2432 }, description: "Family-oriented villa community near Jumeirah Beach", tenantProfile: "Families" },
  { id: "umm-suqeim-1", name: "Umm Suqeim 1", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2150, grossYieldPct: 5.1, coordinates: { lat: 25.1712, lng: 55.2236 }, description: "Established villa community near Burj Al Arab", tenantProfile: "Families" },
  { id: "umm-suqeim-2", name: "Umm Suqeim 2", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2200, grossYieldPct: 5.0, coordinates: { lat: 25.1654, lng: 55.2183 }, description: "Premium villa area, home to Jumeirah Beach Hotel", tenantProfile: "Families & HNW" },
  { id: "umm-suqeim-3", name: "Umm Suqeim 3", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2080, grossYieldPct: 5.2, coordinates: { lat: 25.1601, lng: 55.2121 }, description: "Mid-density residential area near Kite Beach", tenantProfile: "Families" },
  { id: "al-wasl", name: "Al Wasl", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1950, grossYieldPct: 5.4, coordinates: { lat: 25.1933, lng: 55.2589 }, description: "Central residential district with mix of villas and apartments", tenantProfile: "Professionals & Families" },
  { id: "al-safa", name: "Al Safa", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1920, grossYieldPct: 5.5, coordinates: { lat: 25.1851, lng: 55.2467 }, description: "Established community adjacent to Al Safa Park", tenantProfile: "Families" },
  { id: "al-quoz-residential", name: "Al Quoz Residential", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1250, grossYieldPct: 6.8, coordinates: { lat: 25.1524, lng: 55.2226 }, description: "Mixed-use area with affordable villas and apartments", tenantProfile: "Mid-income Families" },
  { id: "jumeirah-garden-city", name: "Jumeirah Garden City", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1850, grossYieldPct: 5.8, coordinates: { lat: 25.2123, lng: 55.2834 }, description: "New mixed-use development on site of redeveloped Al Satwa", tenantProfile: "Young Professionals" },
  { id: "al-satwa", name: "Al Satwa", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1100, grossYieldPct: 7.2, coordinates: { lat: 25.2145, lng: 55.2812 }, description: "Affordable urban community near Sheikh Zayed Road", tenantProfile: "Budget-conscious Residents" },
  { id: "port-de-la-mer", name: "Port de La Mer", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 3200, grossYieldPct: 5.3, coordinates: { lat: 25.2312, lng: 55.2987 }, description: "Waterfront destination by Meraas with Mediterranean-inspired design", tenantProfile: "Luxury Residents" },
  { id: "la-mer", name: "La Mer", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 3100, grossYieldPct: 5.5, coordinates: { lat: 25.2287, lng: 55.2934 }, description: "Beachfront lifestyle destination with apartments and retail", tenantProfile: "Lifestyle Buyers" },

  // ── DEIRA SECTOR ──────────────────────────────────────────────
  { id: "al-nahda-dubai", name: "Al Nahda (Dubai)", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 950, grossYieldPct: 7.8, coordinates: { lat: 25.2982, lng: 55.3754 }, description: "Affordable apartment community on Sharjah border — strong tenant demand", tenantProfile: "Mid-income Workers" },
  { id: "al-qusais", name: "Al Qusais", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 900, grossYieldPct: 8.1, coordinates: { lat: 25.2893, lng: 55.3891 }, description: "Established affordable residential area near Airport", tenantProfile: "Budget Workers" },
  { id: "mirdif", name: "Mirdif", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1050, grossYieldPct: 7.2, coordinates: { lat: 25.2235, lng: 55.4312 }, description: "Popular family villa community near Dubai Airport", tenantProfile: "Families" },
  { id: "al-khawaneej", name: "Al Khawaneej", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 980, grossYieldPct: 6.9, coordinates: { lat: 25.1845, lng: 55.4587 }, description: "Residential villa community in eastern Dubai", tenantProfile: "Local Families" },
  { id: "deira-islands", name: "Deira Islands", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1650, grossYieldPct: 6.4, coordinates: { lat: 25.3012, lng: 55.3265 }, description: "Nakheel waterfront development with apartments and retail near old Deira", tenantProfile: "Mixed" },
  { id: "al-rigga", name: "Al Rigga", area: "Deira", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 850, grossYieldPct: 8.5, coordinates: { lat: 25.2698, lng: 55.3245 }, description: "High-density affordable residential area near Gold Souk Metro", tenantProfile: "Workers & Budget Residents" },
  { id: "bur-dubai-residential", name: "Bur Dubai", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 980, grossYieldPct: 7.9, coordinates: { lat: 25.2634, lng: 55.2982 }, description: "Historic commercial and residential hub — affordable apartments with metro access", tenantProfile: "Mid-income Workers" },

  // ── NEW DUBAI SECTOR ──────────────────────────────────────────
  { id: "al-barsha-1", name: "Al Barsha 1", area: "New Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1450, grossYieldPct: 6.8, coordinates: { lat: 25.1079, lng: 55.1987 }, description: "Mid-range apartments near Mall of the Emirates — excellent connectivity", tenantProfile: "Professionals & Families" },
  { id: "al-barsha-2", name: "Al Barsha 2", area: "New Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1320, grossYieldPct: 7.0, coordinates: { lat: 25.0998, lng: 55.1923 }, description: "Affordable mixed-use area with schools and retail", tenantProfile: "Families" },
  { id: "al-barsha-3", name: "Al Barsha 3", area: "New Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1280, grossYieldPct: 7.2, coordinates: { lat: 25.0934, lng: 55.1876 }, description: "Villa and apartment community near Jumeirah Village", tenantProfile: "Families" },
  { id: "barsha-heights", name: "Barsha Heights (TECOM)", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1380, grossYieldPct: 7.1, coordinates: { lat: 25.1012, lng: 55.1834 }, description: "Mixed residential/commercial hub — IT and media companies nearby", tenantProfile: "Young Professionals" },
  { id: "arjan", name: "Arjan", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1355, grossYieldPct: 7.8, coordinates: { lat: 25.0687, lng: 55.2012 }, description: "Emerging affordable community — Blue Line Metro catalyst driving +28.5% PPSF growth in 2025", tenantProfile: "Young Professionals" },
  { id: "motor-city", name: "Motor City", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1120, grossYieldPct: 7.4, coordinates: { lat: 25.0512, lng: 55.1798 }, description: "Themed motorsport community with apartments and villas", tenantProfile: "Professionals & Families" },
  { id: "dubai-sports-city", name: "Dubai Sports City", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1080, grossYieldPct: 7.6, coordinates: { lat: 25.0445, lng: 55.1723 }, description: "Sports-focused community with affordable entry prices", tenantProfile: "Active Professionals" },
  { id: "production-city", name: "Dubai Production City (IMPZ)", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1050, grossYieldPct: 7.9, coordinates: { lat: 25.0389, lng: 55.1645 }, description: "Media and production hub with affordable apartments", tenantProfile: "Media Workers" },
  { id: "city-walk", name: "City Walk", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2950, grossYieldPct: 5.4, coordinates: { lat: 25.2067, lng: 55.2534 }, description: "Meraas urban lifestyle destination with premium apartments", tenantProfile: "Luxury Lifestyle" },
  { id: "bluewaters-island", name: "Bluewaters Island", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 3450, grossYieldPct: 4.9, coordinates: { lat: 25.0856, lng: 55.1234 }, description: "Iconic island destination — home to Ain Dubai and Caesars Palace", tenantProfile: "Ultra-Luxury" },
  { id: "palm-jebel-ali", name: "Palm Jebel Ali", area: "Jebel Ali", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2200, grossYieldPct: 5.8, coordinates: { lat: 24.9987, lng: 55.0123 }, description: "New Nakheel mega-island twice the size of Palm Jumeirah — off-plan", tenantProfile: "Luxury Buyers" },
  { id: "jbr", name: "Jumeirah Beach Residence (JBR)", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2450, grossYieldPct: 6.2, coordinates: { lat: 25.0789, lng: 55.1356 }, description: "Iconic beach destination by Dubai Properties — 40 towers along 1.7km beachfront", tenantProfile: "Tourists & Expats" },
  { id: "the-greens", name: "The Greens", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1580, grossYieldPct: 6.9, coordinates: { lat: 25.0923, lng: 55.1689 }, description: "Low-rise apartment community with lush landscaping — popular with professionals", tenantProfile: "Young Professionals" },
  { id: "the-views", name: "The Views", area: "New Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1650, grossYieldPct: 6.7, coordinates: { lat: 25.0901, lng: 55.1712 }, description: "Apartment community adjacent to The Greens with golf course views", tenantProfile: "Professionals" },
  { id: "the-lakes", name: "The Lakes", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2250, grossYieldPct: 5.6, coordinates: { lat: 25.0867, lng: 55.1656 }, description: "Premium villa community with lakes — part of Emirates Living", tenantProfile: "Families" },
  { id: "the-meadows", name: "The Meadows", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2180, grossYieldPct: 5.4, coordinates: { lat: 25.0832, lng: 55.1589 }, description: "Family villa community with 9 sub-communities — lakes and greenery", tenantProfile: "Families" },
  { id: "the-springs", name: "The Springs", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1980, grossYieldPct: 5.8, coordinates: { lat: 25.0798, lng: 55.1534 }, description: "Gated villa community with 15 sub-communities — very family-friendly", tenantProfile: "Families" },
  { id: "the-villa", name: "The Villa", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1200, grossYieldPct: 6.2, coordinates: { lat: 25.1023, lng: 55.3498 }, description: "Freehold villa community in Dubailand with desert-edge location", tenantProfile: "Families" },

  // ── MBR CITY SECTOR ───────────────────────────────────────────
  { id: "district-one", name: "District One (MBR City)", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 3100, grossYieldPct: 5.1, coordinates: { lat: 25.1634, lng: 55.3287 }, description: "Luxury gated community near Meydan — crystal lagoon, mansions and villas", tenantProfile: "HNW Families" },
  { id: "meydan-city", name: "Meydan City", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2350, grossYieldPct: 5.7, coordinates: { lat: 25.1589, lng: 55.3198 }, description: "Luxury waterfront development next to Meydan Racecourse", tenantProfile: "Luxury Buyers" },
  { id: "nad-al-sheba", name: "Nad Al Sheba", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1850, grossYieldPct: 5.9, coordinates: { lat: 25.1487, lng: 55.3312 }, description: "Growing residential community with affordable villa options and new Meraas projects", tenantProfile: "Families" },
  { id: "ras-al-khor", name: "Ras Al Khor", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1150, grossYieldPct: 7.3, coordinates: { lat: 25.2012, lng: 55.3589 }, description: "Industrial and residential area — wildlife sanctuary nearby", tenantProfile: "Budget Workers" },
  { id: "al-jaddaf", name: "Al Jaddaf", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1780, grossYieldPct: 6.5, coordinates: { lat: 25.2234, lng: 55.3412 }, description: "Mixed-use waterfront community between Business Bay and Creek — metro access", tenantProfile: "Young Professionals" },
  { id: "dubai-creek-harbour", name: "Dubai Creek Harbour", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2280, grossYieldPct: 5.9, coordinates: { lat: 25.2156, lng: 55.3534 }, description: "Emaar waterfront mega-development — Blue Line Metro catalyst +15-25% price growth", tenantProfile: "Young Professionals & Investors" },
  { id: "the-oasis-emaar", name: "The Oasis by Emaar", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2450, grossYieldPct: 5.2, coordinates: { lat: 25.0312, lng: 55.2123 }, description: "Emaar's AED 9.71B mega off-plan development — largest single Q1 2026 transaction location", tenantProfile: "Luxury Buyers" },

  // ── DUBAILAND SECTOR ──────────────────────────────────────────
  { id: "mudon", name: "Mudon", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1380, grossYieldPct: 6.5, coordinates: { lat: 25.0456, lng: 55.2876 }, description: "Family villa community by Dubai Properties with parks and schools", tenantProfile: "Families" },
  { id: "serena", name: "Serena", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1250, grossYieldPct: 6.8, coordinates: { lat: 25.0398, lng: 55.2834 }, description: "Mediterranean-themed townhouse community by Dubai Properties", tenantProfile: "Families" },
  { id: "villanova", name: "Villanova", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1180, grossYieldPct: 7.0, coordinates: { lat: 25.0345, lng: 55.2765 }, description: "Affordable townhouse community — Italian-inspired design", tenantProfile: "Families" },
  { id: "living-legends", name: "Living Legends", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1050, grossYieldPct: 8.76, coordinates: { lat: 25.0567, lng: 55.3123 }, description: "Golf-focused community — top performer for mid-tier apartment yields at 8.76%", tenantProfile: "Golf Enthusiasts & Investors" },
  { id: "town-square", name: "Town Square Dubai", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1000, grossYieldPct: 7.72, coordinates: { lat: 25.0298, lng: 55.2634 }, description: "Nshama-developed affordable community with modern facilities — 7.72% ROI", tenantProfile: "Young Families & Professionals" },
  { id: "damac-hills-2", name: "DAMAC Hills 2", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 950, grossYieldPct: 7.5, coordinates: { lat: 25.0123, lng: 55.2456 }, description: "Affordable villa/townhouse community — water features + amenities", tenantProfile: "Budget Families" },
  { id: "dubai-land-residence-complex", name: "Dubai Land Residence Complex (DLRC)", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 900, grossYieldPct: 8.2, coordinates: { lat: 25.0234, lng: 55.3012 }, description: "Affordable apartment clusters in Dubailand", tenantProfile: "Budget Workers" },
  { id: "wadi-al-safa-5", name: "Wadi Al Safa 5", area: "Dubailand", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1420, grossYieldPct: 6.3, coordinates: { lat: 25.0678, lng: 55.3234 }, description: "One of H1 2025 top transaction areas — AED 15.3B in value", tenantProfile: "Mixed" },
  { id: "dubai-investment-park", name: "Dubai Investment Park (DIP)", area: "Jebel Ali", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 920, grossYieldPct: 9.9, coordinates: { lat: 24.9934, lng: 55.1456 }, description: "Industrial/residential zone — highest apartment ROI in Dubai at ~10%", tenantProfile: "Industrial Workers & Budget Investors" },
  { id: "tilal-al-ghaf", name: "Tilal Al Ghaf", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1680, grossYieldPct: 6.1, coordinates: { lat: 25.0456, lng: 55.2534 }, description: "Majid Al Futtaim luxury villa community with crystal lagoon", tenantProfile: "Luxury Families" },
  { id: "damac-lagoons", name: "DAMAC Lagoons", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1580, grossYieldPct: 6.4, coordinates: { lat: 25.0367, lng: 55.2345 }, description: "DAMAC Mediterranean-themed waterfront villa community", tenantProfile: "Luxury Families" },
  { id: "the-valley", name: "The Valley by Emaar", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1350, grossYieldPct: 6.6, coordinates: { lat: 25.0189, lng: 55.3456 }, description: "Emaar suburban villa community on Dubai-Al Ain road", tenantProfile: "Families" },

  // ── DUBAI SOUTH SECTOR ─────────────────────────────────────────
  { id: "emaar-south", name: "Emaar South", area: "Dubai South", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1150, grossYieldPct: 7.8, coordinates: { lat: 24.9123, lng: 55.0456 }, description: "Emaar master community adjacent to Al Maktoum Airport — strong 2025 growth", tenantProfile: "Airport Workers & Families" },
  { id: "the-pulse-dubai-south", name: "The Pulse (Dubai South)", area: "Dubai South", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1050, grossYieldPct: 8.2, coordinates: { lat: 24.9234, lng: 55.0534 }, description: "Residential district within Dubai South — affordable apartments and villas", tenantProfile: "Budget Families" },
  { id: "golf-views-dubai-south", name: "Golf Views (Dubai South)", area: "Dubai South", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1180, grossYieldPct: 7.6, coordinates: { lat: 24.9312, lng: 55.0612 }, description: "Golf-oriented residential community within Dubai South", tenantProfile: "Active Professionals" },

  // ── JEBEL ALI SECTOR ───────────────────────────────────────────
  { id: "jebel-ali-village", name: "Jebel Ali Village", area: "Jebel Ali", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1320, grossYieldPct: 7.0, coordinates: { lat: 25.0123, lng: 55.0987 }, description: "Large mixed-use development near Energy Metro station", tenantProfile: "Mixed" },
  { id: "discovery-gardens", name: "Discovery Gardens", area: "Jebel Ali", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 950, grossYieldPct: 9.47, coordinates: { lat: 25.0378, lng: 55.1234 }, description: "Nakheel affordable apartment community — 9.47% ROI top performer (Bayut 2025)", tenantProfile: "Budget Professionals" },
  { id: "al-furjan", name: "Al Furjan", area: "Jebel Ali", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1280, grossYieldPct: 7.72, coordinates: { lat: 25.0289, lng: 55.1123 }, description: "Mid-tier family community — most popular mid-tier villa area H1 2025", tenantProfile: "Families" },

  // ── TRADE CENTER SECTOR ────────────────────────────────────────
  { id: "difc", name: "DIFC", area: "Trade Center", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 3200, grossYieldPct: 5.2, coordinates: { lat: 25.2148, lng: 55.2825 }, description: "Dubai's financial hub — premium apartments, supply-constrained, price support strong", tenantProfile: "Finance Professionals & HNW" },
  { id: "downtown-dubai", name: "Downtown Dubai", area: "Trade Center", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2750, grossYieldPct: 5.5, coordinates: { lat: 25.1972, lng: 55.2744 }, description: "Emaar's flagship district — Burj Khalifa, Dubai Mall — AED 2,400-3,000/sqft", tenantProfile: "Luxury Residents & Investors" },
  { id: "trade-center-1", name: "Trade Center 1", area: "Trade Center", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2100, grossYieldPct: 5.9, coordinates: { lat: 25.2234, lng: 55.2823 }, description: "Commercial and residential district with ADNEC and exhibition centers", tenantProfile: "Business Professionals" },

  // ── SILICON OASIS / NEW DUBAI ──────────────────────────────────
  { id: "dubai-silicon-oasis", name: "Dubai Silicon Oasis (DSO)", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1120, grossYieldPct: 8.5, coordinates: { lat: 25.1187, lng: 55.3812 }, description: "Tech-focused freehold community — Blue Line Metro catalyst, +29% PPSF in 2025", tenantProfile: "Tech Workers & Investors" },
  { id: "muhaisanah", name: "Muhaisanah", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 820, grossYieldPct: 8.9, coordinates: { lat: 25.2934, lng: 55.3945 }, description: "Densely populated affordable residential area near Sharjah border", tenantProfile: "Budget Workers" },
  { id: "al-rashidiya", name: "Al Rashidiya", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 880, grossYieldPct: 8.3, coordinates: { lat: 25.2312, lng: 55.4123 }, description: "Established affordable villa area near Dubai Airport", tenantProfile: "Families & Workers" },

  // ── EMERGING COMMUNITIES ───────────────────────────────────────
  { id: "dubai-islands", name: "Dubai Islands", area: "Deira", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2100, grossYieldPct: 5.8, coordinates: { lat: 25.3123, lng: 55.3012 }, description: "Nakheel 5-island mega-development off Deira coast — 17 sq km total", tenantProfile: "Luxury & Investment" },
  { id: "emaar-beachfront", name: "Emaar Beachfront", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 3350, grossYieldPct: 5.1, coordinates: { lat: 25.0767, lng: 55.1289 }, description: "Emaar-only beachfront development adjacent to Dubai Marina — sold out phases", tenantProfile: "Ultra-Luxury Residents" },
  { id: "jumeirah-golf-estates", name: "Jumeirah Golf Estates", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1850, grossYieldPct: 5.8, coordinates: { lat: 25.0412, lng: 55.1567 }, description: "Golf community hosting Dubai World Championship — villas and apartments", tenantProfile: "Golf Enthusiasts & Families" },
  { id: "arabian-ranches-3", name: "Arabian Ranches 3", area: "Dubailand", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 1580, grossYieldPct: 6.3, coordinates: { lat: 25.0589, lng: 55.2765 }, description: "Emaar's third phase of Arabian Ranches — Caya and Bliss sub-communities", tenantProfile: "Families" },
  { id: "sobha-hartland-2", name: "Sobha Hartland 2", area: "MBR City", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2850, grossYieldPct: 5.4, coordinates: { lat: 25.1712, lng: 55.3345 }, description: "Sobha's second phase — world's largest man-made crystal lagoon, 310 Riverside Crescent", tenantProfile: "Luxury Buyers" },
  { id: "al-sufouh", name: "Al Sufouh", area: "New Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2680, grossYieldPct: 8.73, coordinates: { lat: 25.0987, lng: 55.1534 }, description: "Luxury beachfront area — top luxury apartment yield at 8.73% (Bayut H1 2025)", tenantProfile: "Luxury Professionals" },
  { id: "business-bay-extension", name: "Business Bay Waterfront", area: "Trade Center", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2550, grossYieldPct: 5.8, coordinates: { lat: 25.1865, lng: 55.2623 }, description: "Canal-facing towers within Business Bay — premium waterfront units", tenantProfile: "Young Professionals" },
  { id: "zabeel", name: "Zabeel", area: "Bur Dubai", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1980, grossYieldPct: 5.7, coordinates: { lat: 25.2198, lng: 55.2923 }, description: "Upscale residential district near DIFC with government offices", tenantProfile: "Senior Professionals" },
  { id: "culture-village", name: "Culture Village (Jaddaf Waterfront)", area: "MBR City", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1620, grossYieldPct: 6.3, coordinates: { lat: 25.2234, lng: 55.3512 }, description: "Waterfront arts district in Al Jaddaf — Dubai Frame and culture hub nearby", tenantProfile: "Young Professionals" },
  { id: "madinat-jumeirah-living", name: "Madinat Jumeirah Living", area: "Bur Dubai", type: "Sub-Community", displayCategory: "consumer-community", avgPpsf: 2780, grossYieldPct: 5.2, coordinates: { lat: 25.1534, lng: 55.1856 }, description: "Dubai Holding premium apartment community near Burj Al Arab", tenantProfile: "Luxury Professionals" },
  { id: "al-barari", name: "Al Barari", area: "Dubailand", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 2950, grossYieldPct: 5.82, coordinates: { lat: 25.0876, lng: 55.3189 }, description: "Ultra-luxury villa community with botanical hideaways and freshwater streams", tenantProfile: "Ultra-HNW Families" },
  { id: "green-community", name: "Green Community", area: "Jebel Ali", type: "Master Community", displayCategory: "consumer-community", avgPpsf: 1480, grossYieldPct: 7.86, coordinates: { lat: 24.9978, lng: 55.1345 }, description: "Sustainable residential community near DIP — 7.86% luxury villa ROI", tenantProfile: "Eco-conscious Families" },
];

// ── DEVELOPER ENRICHMENT DATA ─────────────────────────────────────
// Sources: DXB Analytics Q1 2026 rankings, Gulf News Jan 2026, Bayut Off-Plan Report 2025
// Mieyar UAE Q3 2025, BetterHomes 2025, Keyspace Dubai 2025

const DEVELOPER_ENRICHMENTS = [
  { id: "emaar-properties", name: "Emaar Properties", verified: true, tier: 1, reraRegistered: true, healthScore: 97, deliveryRate: 82, salesValue2025AED: 80400000000, transactions2025: 49000, founded: 1997, hq: "Downtown Dubai", keyProjects: ["Burj Khalifa", "Dubai Creek Harbour", "The Oasis", "Emaar Beachfront", "Dubai Hills Estate"], description: "Dubai's largest developer. Behind Burj Khalifa and Dubai Mall. Record AED 80.4B sales in 2025." },
  { id: "damac-properties", name: "DAMAC Properties", verified: true, tier: 1, reraRegistered: true, healthScore: 94, deliveryRate: 71, salesValue2025AED: 36000000000, transactions2025: 16458, founded: 2002, hq: "Business Bay", keyProjects: ["DAMAC Hills", "DAMAC Hills 2", "DAMAC Lagoons", "Cavalli Villas"], description: "Leading luxury developer. Branded residences specialist. AED 36B sales in 2025." },
  { id: "sobha-realty", name: "Sobha Realty", verified: true, tier: 1, reraRegistered: true, healthScore: 92, deliveryRate: 79, salesValue2025AED: 30000000000, transactions2025: 16542, founded: 1976, hq: "Sobha Hartland", keyProjects: ["Sobha Hartland", "Sobha Hartland 2", "Sobha Central", "Sobha Solis"], description: "High-quality construction, vertically integrated. AED 30B sales in 2025." },
  { id: "nakheel", name: "Nakheel", verified: true, tier: 1, reraRegistered: true, healthScore: 90, deliveryRate: 85, salesValue2025AED: 7270000000, transactions2025: 1161, founded: 2003, hq: "Palm Jumeirah", keyProjects: ["Palm Jumeirah", "Dubai Islands", "Jumeirah Village Circle", "Discovery Gardens", "Palm Jebel Ali"], description: "Government-backed master developer. Created Palm Jumeirah. Part of Dubai Holding." },
  { id: "meraas", name: "Meraas", verified: true, tier: 1, reraRegistered: true, healthScore: 93, deliveryRate: 88, salesValue2025AED: 7730000000, transactions2025: 1048, founded: 2007, hq: "City Walk", keyProjects: ["City Walk", "Bluewaters Island", "La Mer", "Port de La Mer", "Nad Al Sheba Gardens"], description: "Destination-focused lifestyle developer. Highest avg sale price per unit in Q1 2026 at AED 7.37M." },
  { id: "binghatti-developers", name: "Binghatti Developers", verified: true, tier: 1, reraRegistered: true, healthScore: 85, deliveryRate: 74, salesValue2025AED: 26000000000, transactions2025: 9786, founded: 2008, hq: "Business Bay", keyProjects: ["Binghatti Burj", "Binghatti House", "Mercedes-Benz Places", "Bugatti Residences"], description: "Design-led developer famous for distinctive architectural facades. AED 26B in 2025." },
  { id: "danube-properties", name: "Danube Properties", verified: true, tier: 2, reraRegistered: true, healthScore: 84, deliveryRate: 76, salesValue2025AED: 10000000000, transactions2025: 8500, founded: 2014, hq: "Al Quoz", keyProjects: ["Bayz", "Fashionz", "Sportz", "Pearlz"], description: "Affordable luxury with investor-friendly payment plans. 40+ amenities standard. AED 10B in 2025." },
  { id: "samana-developers", name: "Samana Developers", verified: true, tier: 2, reraRegistered: true, healthScore: 80, deliveryRate: 68, salesValue2025AED: 7100000000, transactions2025: 4513, founded: 2017, hq: "Business Bay", keyProjects: ["Samana Mykonos", "Samana Santorini", "Samana California"], description: "Fast-growing developer with European-themed projects. AED 7.1B in 2025." },
  { id: "nshama", name: "Nshama", verified: true, tier: 2, reraRegistered: true, healthScore: 82, deliveryRate: 77, salesValue2025AED: 4500000000, transactions2025: 3800, founded: 2014, hq: "Town Square", keyProjects: ["Town Square", "Rawda Apartments", "Aster"], description: "Affordable community developer. Town Square is flagship project with 7.72% ROI." },
  { id: "ellington-properties", name: "Ellington Properties", verified: true, tier: 2, reraRegistered: true, healthScore: 88, deliveryRate: 86, salesValue2025AED: 3500000000, transactions2025: 2100, founded: 2014, hq: "Business Bay", keyProjects: ["DT1", "Belgravia", "Crestbrook", "The Sanctuary"], description: "Design-focused boutique developer. 96% occupancy rate on delivered projects." },
  { id: "dubai-properties", name: "Dubai Properties", verified: true, tier: 1, reraRegistered: true, healthScore: 87, deliveryRate: 82, salesValue2025AED: 5200000000, transactions2025: 3200, founded: 2002, hq: "JBR", keyProjects: ["JBR", "Mudon", "Serena", "Villanova", "Business Bay towers"], description: "Dubai government-linked developer. Part of Dubai Holding. JBR is iconic beachfront project." },
  { id: "aldar-properties", name: "Aldar Properties", verified: true, tier: 1, reraRegistered: true, healthScore: 89, deliveryRate: 83, salesValue2025AED: 4800000000, transactions2025: 2900, founded: 2004, hq: "Abu Dhabi", keyProjects: ["Yas Island", "Saadiyat Island", "Haven by Aldar", "Reem Island"], description: "Abu Dhabi's largest developer expanding into Dubai. Dubailand's Haven project." },
  { id: "majid-al-futtaim", name: "Majid Al Futtaim Properties", verified: true, tier: 2, reraRegistered: true, healthScore: 86, deliveryRate: 84, salesValue2025AED: 3800000000, transactions2025: 2400, founded: 1995, hq: "Al Zahia", keyProjects: ["Tilal Al Ghaf", "Al Zahia (Sharjah)"], description: "Lifestyle master community developer. Tilal Al Ghaf with crystal lagoon is flagship." },
  { id: "select-group", name: "Select Group", verified: true, tier: 2, reraRegistered: true, healthScore: 83, deliveryRate: 79, salesValue2025AED: 2800000000, transactions2025: 1800, founded: 2002, hq: "Dubai Marina", keyProjects: ["Peninsula", "Marina Gate", "Studio One", "Six Senses Dubai"], description: "Premium Dubai Marina developer. Often ranked top 7 by market share." },
  { id: "azizi-developments", name: "Azizi Developments", verified: true, tier: 2, reraRegistered: true, healthScore: 79, deliveryRate: 69, salesValue2025AED: 5500000000, transactions2025: 6200, founded: 2007, hq: "Al Furjan", keyProjects: ["Riviera", "Venice", "Al Furjan villas", "Azizi Park Avenue"], description: "High-volume developer with affordable entry points from AED 400K." },
  { id: "omniyat", name: "Omniyat", verified: true, tier: 2, reraRegistered: true, healthScore: 87, deliveryRate: 81, salesValue2025AED: 4200000000, transactions2025: 580, founded: 2005, hq: "Business Bay", keyProjects: ["One Palm", "Vela Dorchester", "AVA at Palm Jumeirah"], description: "Ultra-luxury boutique developer. One Palm on Palm Jumeirah is iconic project." },
  { id: "emaar-hospitality", name: "Emaar Hospitality Group", verified: true, tier: 1, reraRegistered: true, healthScore: 91, deliveryRate: 88, salesValue2025AED: 2100000000, transactions2025: 890, founded: 2001, hq: "Downtown Dubai", keyProjects: ["Address Hotels", "Vida Hotels", "Rove Hotels"], description: "Emaar's hospitality arm with branded residence portfolio." },
  { id: "reportage-properties", name: "Reportage Properties", verified: true, tier: 2, reraRegistered: true, healthScore: 77, deliveryRate: 71, salesValue2025AED: 1800000000, transactions2025: 2100, founded: 2014, hq: "Abu Dhabi", keyProjects: ["Reportage Village", "Rukan"], description: "Abu Dhabi based developer with Dubai projects — affordable townhouses." },
  { id: "tiger-properties", name: "Tiger Properties", verified: true, tier: 2, reraRegistered: true, healthScore: 76, deliveryRate: 68, salesValue2025AED: 1600000000, transactions2025: 2800, founded: 2005, hq: "JVC", keyProjects: ["Tiger Sky Tower", "Jumeirah Garden"], description: "Volume developer with affordable JVC projects." },
  { id: "imtiaz-developments", name: "Imtiaz Developments", verified: true, tier: 2, reraRegistered: true, healthScore: 78, deliveryRate: 72, salesValue2025AED: 900000000, transactions2025: 1200, founded: 2016, hq: "JVC", keyProjects: ["Westwood by Imtiaz", "Sonate Residences"], description: "Growing boutique developer focused on JVC and Business Bay." },
];

// ── DLD VOLUMES DATA ──────────────────────────────────────────────
// Sources: DXB Analytics DLD database 2025, Bayut Sales Report 2025,
// Dubai property transaction volume article March 2026

const DLD_VOLUMES = [
  { community: "Jumeirah Village Circle", transactions: 18782, value: 15992000000, avgPpsf: 1485, area: "New Dubai", type: "Apartment" },
  { community: "Business Bay", transactions: 12450, value: 27045000000, avgPpsf: 2306, area: "Trade Center", type: "Apartment" },
  { community: "Dubai Marina", transactions: 11200, value: 32133000000, avgPpsf: 2188, area: "New Dubai", type: "Apartment" },
  { community: "Downtown Dubai", transactions: 8900, value: 24500000000, avgPpsf: 2750, area: "Trade Center", type: "Apartment" },
  { community: "Dubai Hills Estate", transactions: 8200, value: 22400000000, avgPpsf: 2100, area: "MBR City", type: "Mixed" },
  { community: "Sobha Hartland", transactions: 6800, value: 19700000000, avgPpsf: 2750, area: "MBR City", type: "Apartment" },
  { community: "Palm Jumeirah", transactions: 5400, value: 28900000000, avgPpsf: 3500, area: "New Dubai", type: "Villa/Apartment" },
  { community: "Dubai South", transactions: 17097, value: 9800000000, avgPpsf: 1050, area: "Dubai South", type: "Mixed" },
  { community: "DAMAC Hills 2", transactions: 7800, value: 7400000000, avgPpsf: 950, area: "Dubailand", type: "Villa" },
  { community: "Al Furjan", transactions: 5200, value: 6650000000, avgPpsf: 1280, area: "Jebel Ali", type: "Villa" },
  { community: "Arabian Ranches 3", transactions: 4100, value: 6480000000, avgPpsf: 1580, area: "Dubailand", type: "Villa" },
  { community: "Jumeirah Lake Towers (JLT)", transactions: 6100, value: 8900000000, avgPpsf: 1650, area: "New Dubai", type: "Apartment" },
  { community: "Dubai Creek Harbour", transactions: 5800, value: 13200000000, avgPpsf: 2280, area: "MBR City", type: "Apartment" },
  { community: "International City", transactions: 4300, value: 2050000000, avgPpsf: 910, area: "Dubailand", type: "Apartment" },
  { community: "Dubai Silicon Oasis", transactions: 3900, value: 4370000000, avgPpsf: 1120, area: "Dubailand", type: "Apartment" },
  { community: "Tilal Al Ghaf", transactions: 3200, value: 5380000000, avgPpsf: 1680, area: "Dubailand", type: "Villa" },
  { community: "Town Square", transactions: 3800, value: 3800000000, avgPpsf: 1000, area: "Dubailand", type: "Mixed" },
  { community: "Dubai Sports City", transactions: 2900, value: 3130000000, avgPpsf: 1080, area: "New Dubai", type: "Apartment" },
  { community: "Motor City", transactions: 2400, value: 2690000000, avgPpsf: 1120, area: "New Dubai", type: "Apartment" },
  { community: "Arjan", transactions: 3100, value: 4200000000, avgPpsf: 1355, area: "New Dubai", type: "Apartment" },
  { community: "Mirdif", transactions: 2800, value: 2940000000, avgPpsf: 1050, area: "Deira", type: "Villa" },
  { community: "Al Barsha 1", transactions: 2300, value: 3340000000, avgPpsf: 1450, area: "New Dubai", type: "Apartment" },
  { community: "DIFC", transactions: 1900, value: 6080000000, avgPpsf: 3200, area: "Trade Center", type: "Apartment" },
  { community: "Discovery Gardens", transactions: 2100, value: 1990000000, avgPpsf: 950, area: "Jebel Ali", type: "Apartment" },
  { community: "Wadi Al Safa 5", transactions: 4800, value: 15300000000, avgPpsf: 1420, area: "Dubailand", type: "Mixed" },
  { community: "Al Yalayis 1", transactions: 3200, value: 15700000000, avgPpsf: 2100, area: "Jebel Ali", type: "Mixed" },
  { community: "Nad Al Sheba", transactions: 2100, value: 3880000000, avgPpsf: 1850, area: "MBR City", type: "Villa" },
  { community: "Emaar Beachfront", transactions: 2800, value: 9380000000, avgPpsf: 3350, area: "New Dubai", type: "Apartment" },
  { community: "The Oasis by Emaar", transactions: 1200, value: 9710000000, avgPpsf: 2450, area: "Dubailand", type: "Villa" },
  { community: "Jumeirah Golf Estates", transactions: 1400, value: 2590000000, avgPpsf: 1850, area: "New Dubai", type: "Villa" },
];

// ── PRICE HISTORY DATA ─────────────────────────────────────────────
// Sources: DLD, ValuStrat VPI, REIDIN, DXB Analytics
// Annual series 2020-2026 + quarterly Q1 2026

const PRICE_HISTORY = [
  { period: "2020", type: "annual", avgPpsf: 980, apartmentPpsf: 1050, villaPpsf: 820, transactions: 51414, valueAED: 175000000000, yoyGrowth: -5.2, source: "DLD 2020 Annual" },
  { period: "2021", type: "annual", avgPpsf: 1120, apartmentPpsf: 1180, villaPpsf: 980, transactions: 84196, valueAED: 300000000000, yoyGrowth: 14.3, source: "DLD 2021 Annual" },
  { period: "2022", type: "annual", avgPpsf: 1340, apartmentPpsf: 1390, villaPpsf: 1210, transactions: 122658, valueAED: 528000000000, yoyGrowth: 19.6, source: "DLD 2022 Annual" },
  { period: "2023", type: "annual", avgPpsf: 1530, apartmentPpsf: 1580, villaPpsf: 1410, transactions: 166400, valueAED: 634000000000, yoyGrowth: 14.2, source: "DLD 2023 Annual" },
  { period: "2024", type: "annual", avgPpsf: 1750, apartmentPpsf: 1798, villaPpsf: 1620, transactions: 226000, valueAED: 761000000000, yoyGrowth: 14.4, source: "DLD 2024 Annual" },
  { period: "2025", type: "annual", avgPpsf: 1863, apartmentPpsf: 1920, villaPpsf: 1780, transactions: 270000, valueAED: 917000000000, yoyGrowth: 6.5, source: "DLD FY2025 + DXB Analytics Jan 2026" },
  { period: "2026-Q1", type: "quarterly", avgPpsf: 1759, apartmentPpsf: 1800, villaPpsf: 1949, transactions: 60303, valueAED: 252000000000, yoyGrowth: 12.5, source: "DLD Q1 2026 Official + Gulf News Apr 2026" },
  // Quarterly breakdown 2025
  { period: "2025-Q1", type: "quarterly", avgPpsf: 1680, apartmentPpsf: 1720, villaPpsf: 1590, transactions: 57000, valueAED: 204000000000, yoyGrowth: 15.6, source: "REIDIN Q1 2025" },
  { period: "2025-Q2", type: "quarterly", avgPpsf: 1740, apartmentPpsf: 1785, villaPpsf: 1680, transactions: 65000, valueAED: 227000000000, yoyGrowth: 11.2, source: "Bayut H1 2025" },
  { period: "2025-Q3", type: "quarterly", avgPpsf: 1798, apartmentPpsf: 1850, villaPpsf: 1730, transactions: 78000, valueAED: 241000000000, yoyGrowth: 10.1, source: "Knight Frank Q3 2025" },
  { period: "2025-Q4", type: "quarterly", avgPpsf: 1920, apartmentPpsf: 1980, villaPpsf: 1875, transactions: 70000, valueAED: 245000000000, yoyGrowth: 9.8, source: "DLD Q4 2025" },
  // Monthly highlights
  { period: "2026-01", type: "monthly", avgPpsf: 1976, apartmentPpsf: 2020, villaPpsf: 1920, transactions: 16919, valueAED: 72400000000, yoyGrowth: 12.8, source: "DLD Jan 2026 — Highest single month in history" },
];

// ── MAIN SEEDING LOGIC ─────────────────────────────────────────────
async function run() {
  let communityAdded = 0, communitySkipped = 0;
  let developerUpdated = 0;
  let dldAdded = 0;
  let historyAdded = 0;

  // 1. ADD MISSING COMMUNITIES
  console.log("\n📍 COMMUNITIES — Adding missing communities...");
  for (const c of NEW_COMMUNITIES) {
    const ref = db.collection("communities").doc(c.id);
    const existing = await ref.get();
    if (existing.exists) {
      communitySkipped++;
      if (!APPLY) console.log(`  SKIP (exists): ${c.name}`);
    } else {
      communityAdded++;
      console.log(`  ${APPLY ? "ADD" : "DRY"}: ${c.name} — ${c.area} · PPSF: AED ${c.avgPpsf} · Yield: ${c.grossYieldPct}%`);
      if (APPLY) {
        await ref.set({
          ...c,
          visibility: "published",
          verified: true,
          totalProjects: 0,
          developersActive: 0,
          netYieldPct: parseFloat((c.grossYieldPct * 0.78).toFixed(2)),
          tagline: c.description,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          _dataSource: "Session8 research seed — Bayut/DLD/REIDIN 2025",
          _seededAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. ENRICH DEVELOPERS
  console.log("\n🏗 DEVELOPERS — Enriching verified developers...");
  for (const dev of DEVELOPER_ENRICHMENTS) {
    const snap = await db.collection("developers").where("name", "==", dev.name).limit(1).get();
    let ref;
    if (!snap.empty) {
      ref = snap.docs[0].ref;
      developerUpdated++;
      console.log(`  ${APPLY ? "UPDATE" : "DRY"}: ${dev.name} — Score: ${dev.healthScore}/100 · 2025 Sales: AED ${(dev.salesValue2025AED/1e9).toFixed(1)}B`);
      if (APPLY) {
        await ref.update({
          verified: true,
          tier: dev.tier,
          reraRegistered: dev.reraRegistered,
          healthScore: dev.healthScore,
          deliveryRate: dev.deliveryRate,
          salesValue2025AED: dev.salesValue2025AED,
          transactions2025: dev.transactions2025,
          founded: dev.founded,
          hq: dev.hq,
          keyProjects: dev.keyProjects,
          description: dev.description,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          _dataSource: "Session8 research — DXB Analytics Q1 2026 rankings",
        });
      }
    } else {
      developerUpdated++;
      console.log(`  ${APPLY ? "CREATE" : "DRY NEW"}: ${dev.name}`);
      if (APPLY) {
        await db.collection("developers").doc(dev.id).set({
          ...dev,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          _dataSource: "Session8 research — DXB Analytics Q1 2026 rankings",
        });
      }
    }
  }

  // 3. SEED DLD VOLUMES
  console.log("\n📊 DLD VOLUMES — Seeding transaction data...");
  for (const d of DLD_VOLUMES) {
    const id = d.community.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    dldAdded++;
    console.log(`  ${APPLY ? "SET" : "DRY"}: ${d.community} — ${d.transactions.toLocaleString()} tx · AED ${(d.value/1e9).toFixed(1)}B`);
    if (APPLY) {
      await db.collection("dldVolumes").doc(id).set({
        ...d,
        year: 2025,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        _dataSource: "DXB Analytics DLD database 2025 · Bayut Sales Report 2025",
      });
    }
  }

  // 4. SEED PRICE HISTORY
  console.log("\n📈 PRICE HISTORY — Seeding time series...");
  for (const p of PRICE_HISTORY) {
    const id = "dubai-" + p.period + "-" + p.type;
    historyAdded++;
    console.log(`  ${APPLY ? "SET" : "DRY"}: ${p.period} (${p.type}) — AED ${p.avgPpsf}/sqft · ${p.transactions?.toLocaleString()} tx`);
    if (APPLY) {
      await db.collection("priceHistory").doc(id).set({
        ...p,
        market: "Dubai",
        currency: "AED",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        _dataSource: p.source,
      });
    }
  }

  console.log("\n══ SUMMARY ══════════════════════════════════════");
  console.log(`Communities: ${communityAdded} to add, ${communitySkipped} already exist`);
  console.log(`Developers:  ${developerUpdated} to enrich/create`);
  console.log(`DLD Volumes: ${dldAdded} community records`);
  console.log(`Price Hist:  ${historyAdded} data points`);
  if (!APPLY) console.log("\nRun with --apply to execute");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });