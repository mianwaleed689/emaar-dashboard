/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — CONSTANTS & CONFIG
   Extracted from EmaarDashboardV2.jsx
   All filter configs, property types, status options, price presets
   ═══════════════════════════════════════════════════════════════════ */

/* ─── PROPERTY TYPE CONFIG ─── */
export const PROPERTY_TYPES = [
  {
    group: "Residential",
    types: [
      { value: "apartment",    label: "Apartment",       beds: ["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+","Penthouse","Duplex"] },
      { value: "penthouse",    label: "Penthouse",        beds: ["3 BR","4 BR","5 BR","6 BR+"] },
      { value: "villa",        label: "Villa",            beds: ["2 BR","3 BR","4 BR","5 BR","6 BR","7 BR+"] },
      { value: "townhouse",    label: "Townhouse",        beds: ["2 BR","3 BR","4 BR","5 BR"] },
      { value: "duplex",       label: "Duplex",           beds: ["2 BR","3 BR","4 BR","5 BR"] },
      { value: "garden_home",  label: "Garden Home",      beds: ["2 BR","3 BR","4 BR"] },
      { value: "sky_villa",    label: "Sky Villa",        beds: ["3 BR","4 BR","5 BR","6 BR+"] },
    ]
  },
  {
    group: "Hospitality",
    types: [
      { value: "hotel_apt",     label: "Hotel Apartment",    beds: ["Hotel Room","Studio","1 BR","2 BR","3 BR","Penthouse Suite"] },
      { value: "serviced_apt",  label: "Serviced Apartment", beds: ["Studio","1 BR","2 BR","3 BR"] },
      { value: "resort_villa",  label: "Resort Villa",       beds: ["1 BR","2 BR","3 BR","4 BR","5 BR+"] },
      { value: "branded_res",   label: "Branded Residence",  beds: ["1 BR","2 BR","3 BR","4 BR","Penthouse"] },
    ]
  },
  {
    group: "Commercial",
    types: [
      { value: "office",        label: "Office",          beds: ["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K–5K sqft","5K+ sqft","Full Floor","Full Building"] },
      { value: "retail",        label: "Retail / Shop",   beds: ["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K+ sqft"] },
      { value: "showroom",      label: "Showroom",        beds: ["< 2K sqft","2K–5K sqft","5K+ sqft"] },
      { value: "warehouse",     label: "Warehouse",       beds: ["< 5K sqft","5K–10K sqft","10K+ sqft"] },
      { value: "coworking",     label: "Co-working Space",beds: ["Hot Desk","Dedicated Desk","Private Office","Full Floor"] },
    ]
  },
  {
    group: "Industrial & Land",
    types: [
      { value: "industrial",    label: "Industrial Unit",    beds: ["< 5K sqft","5K–20K sqft","20K+ sqft"] },
      { value: "land_res",      label: "Land — Residential", beds: ["< 5K sqft","5K–15K sqft","15K+ sqft"] },
      { value: "land_comm",     label: "Land — Commercial",  beds: ["< 10K sqft","10K–50K sqft","50K+ sqft"] },
      { value: "land_mixed",    label: "Mixed Use Plot",     beds: ["< 10K sqft","10K–50K sqft","50K+ sqft"] },
    ]
  },
];

/* ─── STATUS OPTIONS ─── */
export const STATUS_OPTIONS = [
  { value: "all",          label: "All Status" },
  { value: "offplan",      label: "Off-Plan — Under Construction" },
  { value: "prelaunch",    label: "Off-Plan — Pre-Launch / EOI" },
  { value: "ready_new",    label: "Ready — New (Primary)" },
  { value: "secondary",    label: "Ready — Secondary Market" },
  { value: "handover_now", label: "Handover This Year" },
  { value: "handover_2026",label: "Handover 2026" },
  { value: "handover_2027",label: "Handover 2027+" },
];

/* ─── PRICE PRESETS ─── */
export const PRICE_PRESETS_APT = [
  { label: "Any Price", min: 0, max: 0 },
  { label: "< 500K", min: 0, max: 500000 },
  { label: "500K–1M", min: 500000, max: 1000000 },
  { label: "1M–2M", min: 1000000, max: 2000000 },
  { label: "2M–5M", min: 2000000, max: 5000000 },
  { label: "5M–10M", min: 5000000, max: 10000000 },
  { label: "10M+", min: 10000000, max: 0 },
];

export const PRICE_PRESETS_VILLA = [
  { label: "Any Price", min: 0, max: 0 },
  { label: "< 2M", min: 0, max: 2000000 },
  { label: "2M–5M", min: 2000000, max: 5000000 },
  { label: "5M–10M", min: 5000000, max: 10000000 },
  { label: "10M–25M", min: 10000000, max: 25000000 },
  { label: "25M–50M", min: 25000000, max: 50000000 },
  { label: "50M+", min: 50000000, max: 0 },
];

/* ─── MAGIC NUMBERS → NAMED CONSTANTS ─── */
export const TRIAL_DURATION_DAYS = 7;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const GOLDEN_VISA_THRESHOLD = 2000000;
export const LEADS_PAGE_SIZE = 200;
export const ADMIN_LEADS_LIMIT = 500;
export const PROJECTS_PER_PAGE = 12;
export const DLD_REFRESH_INTERVAL_MS = 60000; // 60 seconds
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const APPROX_DAYS_PER_MONTH = 30.44;

/* ─── TIER CONFIG ─── */
export const TIER_ORDER = { free: 0, pro: 1, enterprise: 2 };

export const TIER_MESSAGES = {
  free: {
    subject: "Your DXB Analytics plan has changed to Free",
    body: "Your account has been updated to the Free plan. You have access to 5 featured projects and basic market data.",
  },
  pro_trial: {
    subject: "Your 7-Day Pro Trial has been activated!",
    body: "Great news! Your Pro Trial has been activated. You now have full access to 48+ projects, community yields, ROI calculator, PDF reports and all Pro features for 7 days.",
  },
  pro: {
    subject: "Welcome to DXB Analytics Pro! ⭐",
    body: "Your account has been upgraded to the Pro Plan. You now have unlimited access to all 48+ projects, live yield data, ROI analysis, investment reports, and all Pro features.",
  },
  enterprise: {
    subject: "Welcome to DXB Analytics Enterprise! 🏢",
    body: "Your account has been upgraded to Enterprise. You have access to all platform features including custom reports, priority support, and full data access.",
  },
};

/* ─── HANDOVER STATUS + RISK CONFIG ─── */
export const STATUS_CFG = {
  "On Track": { color: "#10B981", bg: "rgba(16,185,129,0.12)",  label: "On Track"  },
  "Delayed":  { color: "#F97316", bg: "rgba(249,115,22,0.12)",  label: "Delayed"   },
  "At Risk":  { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   label: "At Risk"   },
  "Ready":    { color: "#14B8A6", bg: "rgba(20,184,166,0.12)",  label: "Ready"     },
};

export const RISK_CFG = {
  "Low":          { color: "#10B981", dot: "#10B981", bg: "rgba(16,185,129,0.12)", label: "Low Risk"     },
  "Medium":       { color: "#F97316", dot: "#F97316", bg: "rgba(249,115,22,0.12)", label: "Medium Risk"  },
  "High":         { color: "#EF4444", dot: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "High Risk"    },
  "On Track":     { color: "#10B981", dot: "#10B981", bg: "rgba(16,185,129,0.12)", label: "On Track"     },
  "Delayed":      { color: "#F97316", dot: "#F97316", bg: "rgba(249,115,22,0.12)", label: "Delayed"      },
  "At Risk":      { color: "#EF4444", dot: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "At Risk"      },
  "Ready":        { color: "#14B8A6", dot: "#14B8A6", bg: "rgba(20,184,166,0.12)", label: "Ready"        },
  "Near Handover":{ color: "#14B8A6", dot: "#14B8A6", bg: "rgba(20,184,166,0.12)", label: "Near Handover"},
  "Minor Delay":  { color: "#F97316", dot: "#F97316", bg: "rgba(249,115,22,0.12)", label: "Minor Delay"  },
  "Major Delay":  { color: "#EF4444", dot: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "Major Delay"  },
  "Early Stage":  { color: "#8B5CF6", dot: "#8B5CF6", bg: "rgba(139,92,246,0.12)", label: "Early Stage"  },
};

/* ─── SEED DATA SOURCE URLS ─── */
export const SEED_SOURCE_URL = {
  DLD: "https://dubailand.gov.ae/en/open-data/research/",
  Bayut: "https://www.bayut.com/mybayut/bayut-h1-2025-dubai-rental-market-report/",
  REIDIN: "https://reidin.com",
  ValuStrat: "https://valustrat.com/vpi",
  KnightFrank: "https://www.knightfrank.ae/research",
  PropertyMonitor: "https://propertymonitor.com",
  DXBAnalytics: "https://www.dxbanalytics.com/blog/dubai-property-transaction-volume-2026",
};

/* ─── PRO GATE TAB BENEFITS ─── */
export const TAB_BENEFITS = {
  "DXB Estimate":     ["Automated property valuations", "AVM price estimates per unit", "Bayut live listings", "±15% accuracy model"],
  "Portfolio":        ["Track your Dubai investments", "ROI calculations", "Portfolio performance chart", "Yield tracking"],
  "Yields":           ["Gross & net yield by community", "STR vs LTR comparison", "Top yielding Dubai areas", "Historical yield trends"],
  "Mortgage":         ["Live EIBOR rates", "UAE bank comparison", "Monthly payment calculator", "Affordability analysis"],
  "DLD Volumes":      ["Real transaction volumes", "Community deal counts", "YoY growth by area", "Quarterly breakdown"],
  "STR vs LTR":       ["Airbnb vs long-term yields", "Occupancy rates", "Nightly rate benchmarks", "Best STR communities"],
  "Developer Health": ["Developer financial scores", "Delivery track records", "Risk ratings", "Off-plan safety analysis"],
  "Competitors":      ["Emaar vs DAMAC vs Nakheel", "Market share data", "Price per sqft comparison", "Analyst ratings"],
  "Service Charges":  ["RERA approved rates", "Community-by-community breakdown", "Annual charge estimates", "Hidden cost analysis"],
  "Flip":             ["Buy-renovate-sell calculator", "Flip ROI estimator", "DLD fee breakdown", "Best flip communities"],
  "Investment Score": ["Yield, price and handover scored together", "Risk vs return matrix", "Shortlist by budget", "Every point in the score explained"],
  "Price History":    ["Historical price charts", "5-year appreciation data", "Price per sqft trends", "Community comparisons"],
};
