// seed-damac.js — Seeds DAMAC Properties data to Firestore
// Run: node seed-damac.js
// Writes to: developers/damac

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const sa = JSON.parse(readFileSync("./dxb-analytics-firebase-adminsdk-fbsvc-d170435fc0.json","utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const damacData = {
  // Identity
  id: "damac", name: "DAMAC Properties", legalName: "DAMAC Properties Co. LLC",
  founded: 2002, founder: "Hussain Sajwani", md: "Amira Sajwani",
  hq: "Business Bay, Dubai, UAE", type: "Private", listed: false,
  delistedYear: 2022, tier: "T1", segment: "Mid-Premium → Ultra-Luxury",
  color: "#C8A951", website: "https://www.damacproperties.com",
  confidence: "VERIFIED", tagline: "Live the Luxury Life",

  // FY2025 Financials
  propertySales: 36.0, propertySalesUSD: 9.8, revenue: 26.4,
  netProfit: 8.1, ebitda: 11.8, unitsDelivered: 50000,
  underConstruction: 54000, employees: 7100,
  rank: "#1 Private Developer UAE & Middle East",
  markets: ["UAE","Saudi Arabia","Qatar","Iraq","UK","USA","Canada"],
  latestReportLabel: "FY2025 Sales Results",
  latestReportDate: "January 2026",

  // Key records
  records: [
    "AED 36B FY2025 sales — #1 private developer UAE",
    "AED 11B in 5 hours — DAMAC Islands 2 (Nov 2025) — fastest-selling launch Dubai history",
    "AED 10.2B in 24 hours — DAMAC Islands (2024) — Guinness World Record",
    "50,000+ units delivered since 2002",
    "54,000+ units under construction",
  ],

  // Communities
  communities: ["DAMAC Hills","DAMAC Hills 2","DAMAC Lagoons","DAMAC Islands","DAMAC Islands 2","DAMAC Riverside","DAMAC Sun City"],

  // Branded residences
  brands: ["Roberto Cavalli","Versace","Bugatti","Fendi Casa","de GRISOGONO","Chelsea FC","Bugatti","Trump","Tiger Woods Design","Paramount Hotels"],

  // Financial history
  financialHistory: [
    { year:2020, revenue:5.8,  netProfit:0.9,  propertySales:6.2  },
    { year:2021, revenue:7.2,  netProfit:1.3,  propertySales:8.1  },
    { year:2022, revenue:11.8, netProfit:3.1,  propertySales:14.3 },
    { year:2023, revenue:15.2, netProfit:4.8,  propertySales:19.6 },
    { year:2024, revenue:20.1, netProfit:6.2,  propertySales:28.4 },
    { year:2025, revenue:26.4, netProfit:8.1,  propertySales:36.0 },
  ],

  // Risk matrix
  damacRisks: [
    { factor:"Delivery Risk — 54K Under Construction", level:5, likelihood:4, impact:5, score:80, assessment:"ELEVATED", color:"#F59E0B" },
    { factor:"Private Ownership — No Public Disclosure", level:4, likelihood:3, impact:4, score:48, assessment:"MODERATE", color:"#F59E0B" },
    { factor:"Market Cycle Concentration", level:4, likelihood:3, impact:5, score:60, assessment:"ELEVATED", color:"#F59E0B" },
    { factor:"Luxury Segment Saturation", level:3, likelihood:4, impact:4, score:48, assessment:"MODERATE", color:"#D4A843" },
    { factor:"Pricing Volatility — Off-Plan", level:3, likelihood:3, impact:4, score:36, assessment:"MODERATE", color:"#D4A843" },
    { factor:"Founder/Family Key-Person Risk", level:2, likelihood:2, impact:5, score:20, assessment:"LOW", color:"#10B981" },
    { factor:"Currency Risk (AED Peg)", level:1, likelihood:1, impact:2, score:2, assessment:"VERY LOW", color:"#10B981" },
    { factor:"Regulatory / DLD Changes", level:1, likelihood:1, impact:2, score:2, assessment:"VERY LOW", color:"#10B981" },
  ],

  // Segments
  damacSegments: [
    { name:"Master Communities",    revenue:22.0, growth:"+42%",  color:"#D4A843" },
    { name:"Luxury Towers",         revenue:8.4,  growth:"+28%",  color:"#00BFA5" },
    { name:"Branded Residences",    revenue:4.8,  growth:"+65%",  color:"#8B5CF6" },
    { name:"International Markets", revenue:1.2,  growth:"+120%", color:"#3B82F6" },
  ],

  // Radar
  damacRadar: [
    { metric:"Sales Volume",       damac:92, emaar:100, market:70 },
    { metric:"Brand Equity",       damac:88, emaar:95,  market:65 },
    { metric:"Delivery Record",    damac:82, emaar:92,  market:72 },
    { metric:"Yield Performance",  damac:85, emaar:78,  market:70 },
    { metric:"Community Scale",    damac:90, emaar:88,  market:68 },
    { metric:"International Reach",damac:80, emaar:72,  market:55 },
    { metric:"Price Appreciation", damac:83, emaar:86,  market:72 },
    { metric:"Financial Strength", damac:75, emaar:95,  market:65 },
  ],

  source: "DAMAC Official Press Release Jan 2026 · DLD · Gulf News · Zawya · Bayut · Property Finder",
  seededAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  autoFetched: false,
};

async function seed() {
  try {
    await db.collection("developers").doc("damac").set(damacData, { merge: true });
    console.log("✅ DAMAC seeded to Firestore developers/damac");

    // Also update developerRegistry
    const reg = {
      id: "damac", name: "DAMAC Properties", tier: "T1",
      salesValue2025: 36.0, salesUSD2025: 9.8,
      unitsDelivered: 50000, underConstruction: 54000,
      segment: "Mid-Premium → Ultra-Luxury", color: "#C8A951",
      rank: 2, md: "Amira Sajwani", founded: 2002, listed: false,
      communities: 7, projects: 23,
      brands: ["Cavalli","Chelsea FC","Bugatti","de GRISOGONO"],
      confidence: "VERIFIED",
    };
    await db.collection("marketData").doc("developerRegistry").set(
      { damac: reg, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    console.log("✅ DAMAC added to developerRegistry");
  } catch(e) {
    console.error("❌", e.message);
  } finally { process.exit(0); }
}

seed();
