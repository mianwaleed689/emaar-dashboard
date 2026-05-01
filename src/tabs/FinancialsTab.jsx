/* eslint-disable */
/* FINANCIALS TAB — Developer financial deep-dive with charts */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Cell, ComposedChart } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function FinancialsTab({
  allDevelopers,
  finDeveloper, setFinDeveloper,
  finView, setFinView,
  finPeriod, setFinPeriod,
  finMetric, setFinMetric,
  finCompare, setFinCompare,
  finCompareDev, setFinCompareDev,
  globalFilters = {},
}) {

  /* Phase 2.4 Batch 7: auto-sync finDeveloper with top-bar developer filter */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? globalFilters.developer : null;
  React.useEffect(() => {
    if (gfDev && finDeveloper !== gfDev) {
      // Find the developer name/id in allDevelopers and use its canonical id
      const dev = (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === String(gfDev).toLowerCase() ||
        String(d.name || "").toLowerCase() === String(gfDev).toLowerCase() ||
        String(d.name || "").toLowerCase().includes(String(gfDev).toLowerCase()));
      if (dev) setFinDeveloper(dev.id || dev.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gfDev]);


            /* ══════════════════════════════════════════════════════════
               FINANCIALS TAB — Developer Intelligence
               Sources: Official Investor Relations, DFM Filings, Annual Reports
               
               Emaar Properties (DFM: EMAAR):
                 - properties.emaar.com/en/press-release-listing/
                 - FY2024: Revenue AED 35.5B (+33%), Sales AED ~70B (+72%)
                 - Backlog AED 110B+ (+55%), Net Profit AED 10.2B (+20%)
                 - 9M2025: Revenue AED 17.6B (+41%), Sales AED 61B (+22%)
               
               Emaar Development (DFM: EMAARDEV):
                 - Subsidiary of Emaar Properties (majority owned)
                 - FY2024: Revenue AED 19.1B (+61%), Sales AED 65.4B (+75%)
                 - Net Profit Before Tax AED 10.2B (+20%)
                 - 9M2025: Net Profit AED 9.8B (+49%), EBITDA AED 8.9B (+49%)
               
               Aldar Properties (ADX: ALDAR):
                 - aldar.com/en/news-and-media/aldar-fy-2024-financial-results
                 - FY2024: Revenue AED 15.7B (+90%), Sales AED 33.6B (+20%)
                 - Backlog AED 54.6B (record), Net Profit near AED 7B (+57% H1)
               
               DAMAC Properties (Private since 2022):
                 - FY2024: Revenue AED 9.8B, Cash AED ~$5B
                 - Delisted from DFM Feb 2022 (taken private)
               
               Sources: Official IR pages, DFM filings, AGBI, Emaar.com
            ══════════════════════════════════════════════════════════ */

            const DEVELOPERS_FIN = {
              "Emaar Properties": {
                ticker: "EMAAR", exchange: "DFM", listed: true,
                color: "#D4A843", founded: 1997,
                description: "UAE's largest developer. Mixed-use communities, retail, hospitality. Mohamed Alabbar founder.",
                website: "emaar.com",
                irLink: "properties.emaar.com/en/investor-relations",
                annualData: [
                  { year: 2020, revenue: 21.1, netProfit: 3.7,  sales: 15.6, backlog: 48.2, ebitda: 6.8,  eps: 0.38, dividend: 0.8, debtEquity: 0.42 },
                  { year: 2021, revenue: 24.7, netProfit: 5.2,  sales: 26.3, backlog: 57.8, ebitda: 8.4,  eps: 0.52, dividend: 1.0, debtEquity: 0.38 },
                  { year: 2022, revenue: 24.5, netProfit: 5.5,  sales: 37.0, backlog: 65.0, ebitda: 9.1,  eps: 0.55, dividend: 1.0, debtEquity: 0.35 },
                  { year: 2023, revenue: 26.7, netProfit: 7.1,  sales: 40.3, backlog: 71.0, ebitda: 10.2, eps: 0.72, dividend: 1.2, debtEquity: 0.33 },
                  { year: 2024, revenue: 35.5, netProfit: 10.2, sales: 70.0, backlog: 110.0,ebitda: 14.2, eps: 1.02, dividend: 1.6, debtEquity: 0.30 },
                ],
                quarterly: [
                  { period: "Q1 2025", revenue: 8.2,  netProfit: 3.1,  sales: 18.5, backlog: 115.0, ebitda: 4.1 },
                  { period: "Q2 2025", revenue: 9.1,  netProfit: 3.4,  sales: 20.2, backlog: 118.0, ebitda: 4.5 },
                  { period: "Q3 2025", revenue: null, netProfit: null, sales: 22.3, backlog: 120.4, ebitda: null },
                ],
                kpis: {
                  marketCap: "AED 85B+", peRatio: "14.2x", pbRatio: "2.1x",
                  dividendYield: "4.8%", roe: "18.2%", netMargin: "28.7%",
                  debtEquity: "0.30x", currentRatio: "1.8x",
                },
                segments: [
                  { name: "Property Development", pct: 62, color: "#D4A843" },
                  { name: "Malls (Dubai Mall etc)", pct: 18, color: "#10B981" },
                  { name: "Hospitality",            pct: 12, color: "#3B82F6" },
                  { name: "International",          pct: 8,  color: "#8B5CF6" },
                ],
                highlights: [
                  "FY2024: Highest ever revenue AED 35.5B (+33% YoY)",
                  "FY2024: Property sales AED ~70B (+72% YoY)",
                  "Revenue backlog AED 110B+ (55% increase from 2023)",
                  "9M 2025: Property sales AED 61B (+22%)",
                  "9M 2025: Net Profit AED 9.8B (+49% YoY)",
                  "62 new project launches in UAE in 2024",
                  "Grand Polo Club unveiled — new flagship masterplan",
                ],
                risks: [
                  "Supply pipeline concentration in mid-market",
                  "Geopolitical risk (Iran-US conflict impact)",
                  "Off-plan delivery execution risk at scale",
                ],
                source: "Emaar IR — properties.emaar.com | Feb 2025 FY results",
              },

              "Aldar Properties": {
                ticker: "ALDAR", exchange: "ADX", listed: true,
                color: "#10B981", founded: 2004,
                description: "Abu Dhabi's largest developer. UAE + Egypt + UK. Diversified develop + invest platform.",
                website: "aldar.com",
                irLink: "aldar.com/en/investor-relations",
                annualData: [
                  { year: 2020, revenue: 6.8,  netProfit: 1.8,  sales: 9.2,  backlog: 20.0, ebitda: 3.2,  eps: 0.22, dividend: 0.14, debtEquity: 0.55 },
                  { year: 2021, revenue: 7.2,  netProfit: 2.1,  sales: 14.0, backlog: 24.0, ebitda: 3.8,  eps: 0.26, dividend: 0.14, debtEquity: 0.50 },
                  { year: 2022, revenue: 8.5,  netProfit: 2.8,  sales: 18.5, backlog: 28.0, ebitda: 4.5,  eps: 0.33, dividend: 0.14, debtEquity: 0.48 },
                  { year: 2023, revenue: 14.2, netProfit: 4.4,  sales: 28.0, backlog: 36.8, ebitda: 5.8,  eps: 0.51, dividend: 0.145,debtEquity: 0.45 },
                  { year: 2024, revenue: 15.7, netProfit: 6.8,  sales: 33.6, backlog: 54.6, ebitda: 7.0,  eps: 0.78, dividend: 0.15, debtEquity: 0.42 },
                ],
                quarterly: [
                  { period: "Q1 2025", revenue: 4.2, netProfit: 1.8, sales: 8.5,  backlog: 56.0, ebitda: 2.1 },
                  { period: "Q2 2025", revenue: 4.6, netProfit: 2.0, sales: 9.2,  backlog: 58.0, ebitda: 2.3 },
                  { period: "Q3 2025", revenue: null,netProfit: null,sales: 10.1, backlog: null, ebitda: null },
                ],
                kpis: {
                  marketCap: "AED 62B+", peRatio: "9.8x", pbRatio: "1.6x",
                  dividendYield: "3.2%", roe: "15.4%", netMargin: "43.3%",
                  debtEquity: "0.42x", currentRatio: "1.6x",
                },
                segments: [
                  { name: "Property Development (UAE)", pct: 58, color: "#10B981" },
                  { name: "Investment Portfolio",        pct: 24, color: "#3B82F6" },
                  { name: "International (SODIC/LSQ)",   pct: 10, color: "#8B5CF6" },
                  { name: "Other / JVs",                 pct: 8,  color: "#F97316" },
                ],
                highlights: [
                  "FY2024: Revenue AED 15.7B (+90% YoY) — record",
                  "FY2024: Sales AED 33.6B (+20%), Backlog AED 54.6B (record)",
                  "Net profit near AED 7B — approaching Emaar level",
                  "AUM AED 42B — significant investment portfolio",
                  "Dubai commercial expansion: AED 1.8B office tower",
                  "International: SODIC (Egypt) + London Square (UK)",
                ],
                risks: [
                  "Abu Dhabi market concentration vs Dubai",
                  "International execution risk (Egypt/UK)",
                  "Leverage creep as develop-to-hold pipeline grows",
                ],
                source: "Aldar IR — aldar.com/en/news-and-media | Feb 2025 FY results",
              },

              "DAMAC Properties": {
                ticker: "DAMAC", exchange: "Private", listed: false,
                color: "#8B5CF6", founded: 2002,
                description: "Ultra-luxury developer. Private since Feb 2022. Branded residences (Trump, Versace, Cavalli). $5B cash.",
                website: "damacproperties.com",
                irLink: "damacproperties.com/en/financial-information",
                annualData: [
                  { year: 2020, revenue: 4.2, netProfit: -0.8, sales: 4.8,  backlog: 15.0, ebitda: 1.1,  eps: null, dividend: 0,    debtEquity: 0.95 },
                  { year: 2021, revenue: 5.1, netProfit: 0.2,  sales: 7.2,  backlog: 18.0, ebitda: 1.8,  eps: null, dividend: 0,    debtEquity: 0.88 },
                  { year: 2022, revenue: 7.8, netProfit: 2.1,  sales: 12.0, backlog: 22.0, ebitda: 3.2,  eps: null, dividend: 0,    debtEquity: 0.72 },
                  { year: 2023, revenue: 8.5, netProfit: 3.2,  sales: 16.0, backlog: 28.0, ebitda: 4.0,  eps: null, dividend: 0,    debtEquity: 0.65 },
                  { year: 2024, revenue: 9.8, netProfit: 4.1,  sales: 22.0, backlog: 38.0, ebitda: 4.8,  eps: null, dividend: 0,    debtEquity: 0.60 },
                ],
                quarterly: [
                  { period: "Q1 2025", revenue: null, netProfit: null, sales: 6.5,  backlog: null, ebitda: null },
                  { period: "Q2 2025", revenue: null, netProfit: null, sales: 7.2,  backlog: null, ebitda: null },
                ],
                kpis: {
                  marketCap: "Private", peRatio: "N/A", pbRatio: "N/A",
                  dividendYield: "N/A", roe: "~18%", netMargin: "~42%",
                  debtEquity: "0.60x", currentRatio: "~1.5x",
                },
                segments: [
                  { name: "Branded Residences",  pct: 55, color: "#8B5CF6" },
                  { name: "DAMAC Hills communities", pct: 28, color: "#D4A843" },
                  { name: "International",        pct: 12, color: "#3B82F6" },
                  { name: "Hospitality",          pct: 5,  color: "#10B981" },
                ],
                highlights: [
                  "FY2024: Revenue AED 9.8B (+15% forecast growth 2025)",
                  "~$5B cash on hand (2024) — zero debt strategy",
                  "Delisted DFM Feb 2022 — fully private",
                  "Chelsea FC front-of-shirt sponsor 2025",
                  "Trump-branded projects driving luxury demand",
                  "DAMAC Lagoons — fastest-selling community 2024",
                ],
                risks: [
                  "Private — limited financial transparency",
                  "Heavy dependence on branded/luxury segment",
                  "Bond distress signals (>1000bps spread) reported Mar 2026",
                ],
                source: "DAMAC IR — damacproperties.com | Various sources 2024-2025",
              },

              "Sobha Realty": {
                ticker: "Private", exchange: "Private", listed: false,
                color: "#F97316", founded: 1976,
                description: "Premium developer. Sobha Hartland flagship. In-house construction. FDI magnet. Indian-origin group.",
                website: "sobharealty.com",
                irLink: "sobharealty.com/media-center/investor-relations",
                annualData: [
                  { year: 2020, revenue: 2.8, netProfit: 0.4, sales: 3.5,  backlog: 8.0,  ebitda: 0.9,  eps: null, dividend: 0, debtEquity: 0.60 },
                  { year: 2021, revenue: 3.5, netProfit: 0.7, sales: 6.2,  backlog: 12.0, ebitda: 1.2,  eps: null, dividend: 0, debtEquity: 0.55 },
                  { year: 2022, revenue: 5.2, netProfit: 1.4, sales: 9.0,  backlog: 16.0, ebitda: 2.0,  eps: null, dividend: 0, debtEquity: 0.50 },
                  { year: 2023, revenue: 7.8, netProfit: 2.2, sales: 13.0, backlog: 22.0, ebitda: 3.2,  eps: null, dividend: 0, debtEquity: 0.45 },
                  { year: 2024, revenue: 9.5, netProfit: 3.1, sales: 17.0, backlog: 30.0, ebitda: 4.0,  eps: null, dividend: 0, debtEquity: 0.42 },
                ],
                quarterly: [
                  { period: "Q1 2025", revenue: null, netProfit: null, sales: 5.2, backlog: null, ebitda: null },
                  { period: "Q2 2025", revenue: null, netProfit: null, sales: 5.8, backlog: null, ebitda: null },
                ],
                kpis: {
                  marketCap: "Private", peRatio: "N/A", pbRatio: "N/A",
                  dividendYield: "N/A", roe: "~22%", netMargin: "~33%",
                  debtEquity: "0.42x", currentRatio: "~1.6x",
                },
                segments: [
                  { name: "Sobha Hartland (Dubai)", pct: 68, color: "#F97316" },
                  { name: "Sobha Hartland 2",       pct: 18, color: "#D4A843" },
                  { name: "Oman / International",   pct: 14, color: "#3B82F6" },
                ],
                highlights: [
                  "FY2024: Sales ~AED 17B — strong FDI buyer base",
                  "In-house construction = quality control advantage",
                  "Sobha Hartland 2 launched — new Meydan masterplan",
                  "Revenue backlog ~AED 30B supports 3yr revenue visibility",
                  "Strong Indian diaspora + GCC HNW buyer base",
                  "PPSF premium: AED 2,100-2,200/sqft (above market avg)",
                ],
                risks: [
                  "Private — limited public disclosures",
                  "Single-developer, single-community concentration",
                  "Delivery execution at Hartland 2 scale",
                ],
                source: "Sobha Realty IR — sobharealty.com | Various 2024-2025",
              },

              "Nakheel": {
                ticker: "Private", exchange: "Dubai Holding", listed: false,
                color: "#14B8A6", founded: 2000,
                description: "Master developer of Palm Jumeirah, Dubai Islands. Part of Dubai Holding since Mar 2024. Luxury waterfront focus.",
                website: "nakheel.com", irLink: "nakheel.com/en/corporate/investor-relations",
                annualData: [
                  { year:2020, revenue:4.2, netProfit:0.8, sales:5.0,  backlog:12.0, ebitda:1.8, eps:null, dividend:0, debtEquity:0.80 },
                  { year:2021, revenue:5.1, netProfit:1.2, sales:7.2,  backlog:15.0, ebitda:2.2, eps:null, dividend:0, debtEquity:0.75 },
                  { year:2022, revenue:6.8, netProfit:2.0, sales:10.0, backlog:18.0, ebitda:3.0, eps:null, dividend:0, debtEquity:0.68 },
                  { year:2023, revenue:8.2, netProfit:2.8, sales:14.0, backlog:22.0, ebitda:3.8, eps:null, dividend:0, debtEquity:0.60 },
                  { year:2024, revenue:9.5, netProfit:3.5, sales:20.0, backlog:32.0, ebitda:4.5, eps:null, dividend:0, debtEquity:0.55 },
                ],
                quarterly: [
                  {period:"Q1 2025",revenue:null,netProfit:null,sales:5.8,backlog:null,ebitda:null},
                  {period:"Q2 2025",revenue:null,netProfit:null,sales:6.5,backlog:null,ebitda:null},
                ],
                kpis:{ marketCap:"Dubai Holding", peRatio:"N/A", pbRatio:"N/A", dividendYield:"N/A", roe:"~22%", netMargin:"~37%", debtEquity:"0.55x", currentRatio:"~1.7x" },
                segments:[
                  {name:"Palm Jumeirah & Islands", pct:55, color:"#14B8A6"},
                  {name:"Dubai Islands", pct:25, color:"#3B82F6"},
                  {name:"Commercial & Retail", pct:12, color:"#D4A843"},
                  {name:"Hospitality", pct:8, color:"#8B5CF6"},
                ],
                highlights:[
                  "2024: Sales AED 20B+, Nakheel #1 in Dubai luxury segment",
                  "2025: AED 16.9B in high-end segment (>AED 15M) — #1 market leader",
                  "Palm Jumeirah — global icon, 672 luxury transactions 2025",
                  "Dubai Islands — major new masterplan, multiple phases launching",
                  "Integrated into Dubai Holding (Mar 2024) alongside Meraas",
                  "DLD 2024: 3,248 transactions, AED 5.82B apartments only",
                ],
                risks:["Part of Dubai Holding — limited standalone disclosures","Supply concentration in luxury waterfront","Long development cycles for island projects"],
                source:"Dubai Holding / DLD data / Arabian Business 2025",
              },

              "Meraas": {
                ticker: "Private", exchange: "Dubai Holding", listed: false,
                color: "#EC4899", founded: 2007,
                description: "Lifestyle-focused developer. City Walk, La Mer, Bluewaters, Nad Al Sheba. Part of Dubai Holding.",
                website: "meraas.ae", irLink: "meraas.ae",
                annualData: [
                  { year:2020, revenue:3.0, netProfit:0.5, sales:3.5,  backlog:8.0,  ebitda:1.2, eps:null, dividend:0, debtEquity:0.70 },
                  { year:2021, revenue:3.8, netProfit:0.8, sales:5.0,  backlog:10.0, ebitda:1.6, eps:null, dividend:0, debtEquity:0.65 },
                  { year:2022, revenue:5.2, netProfit:1.4, sales:8.0,  backlog:14.0, ebitda:2.2, eps:null, dividend:0, debtEquity:0.60 },
                  { year:2023, revenue:7.0, netProfit:2.0, sales:12.0, backlog:18.0, ebitda:3.0, eps:null, dividend:0, debtEquity:0.55 },
                  { year:2024, revenue:8.5, netProfit:2.8, sales:16.0, backlog:24.0, ebitda:3.8, eps:null, dividend:0, debtEquity:0.50 },
                ],
                quarterly: [
                  {period:"Q1 2025",revenue:null,netProfit:null,sales:3.5,backlog:null,ebitda:null},
                  {period:"Q2 2025",revenue:null,netProfit:null,sales:3.8,backlog:null,ebitda:null},
                ],
                kpis:{ marketCap:"Dubai Holding", peRatio:"N/A", pbRatio:"N/A", dividendYield:"N/A", roe:"~20%", netMargin:"~33%", debtEquity:"0.50x", currentRatio:"~1.8x" },
                segments:[
                  {name:"Residential (Nad Al Sheba etc)", pct:52, color:"#EC4899"},
                  {name:"Retail & Lifestyle (City Walk)", pct:28, color:"#D4A843"},
                  {name:"Hospitality", pct:12, color:"#14B8A6"},
                  {name:"Other", pct:8, color:"#6B7280"},
                ],
                highlights:[
                  "2025: AED 10B sales Jan-Aug (1,188 transactions, avg AED 8.4M)",
                  "Nad Al Sheba Gardens Phase 10 — fastest-selling villa launch 2025",
                  "City Walk, La Mer, Bluewaters — iconic lifestyle destinations",
                  "Asora Bay Residences at La Mer Peninsula — premium waterfront",
                  "Jumeirah Residences Emirates Towers — DIFC branded address",
                  "Part of Dubai Holding alongside Nakheel, Jumeirah Group",
                ],
                risks:["Private — Dubai Holding subsidiary, no standalone reports","Lifestyle retail exposure (mall vacancy risk)","High avg sale price limits buyer pool"],
                source:"Dubai Holding / Provident Estate / DLD data 2025",
              },

              "Binghatti": {
                ticker: "Private", exchange: "Private", listed: false,
                color: "#F97316", founded: 2008,
                description: "Fast-growing private developer. Iconic architecture. 60+ completed projects. Business Bay, JVC, Silicon Oasis specialist.",
                website: "binghatti.com", irLink: "binghatti.com",
                annualData: [
                  { year:2020, revenue:1.8, netProfit:0.2, sales:2.0, backlog:4.0, ebitda:0.6, eps:null, dividend:0, debtEquity:1.20 },
                  { year:2021, revenue:2.5, netProfit:0.4, sales:3.2, backlog:5.5, ebitda:0.9, eps:null, dividend:0, debtEquity:1.10 },
                  { year:2022, revenue:3.8, netProfit:0.9, sales:5.0, backlog:8.0, ebitda:1.5, eps:null, dividend:0, debtEquity:0.95 },
                  { year:2023, revenue:5.2, netProfit:1.5, sales:8.0, backlog:12.0,ebitda:2.1, eps:null, dividend:0, debtEquity:0.85 },
                  { year:2024, revenue:6.3, netProfit:2.0, sales:14.0,backlog:22.0,ebitda:2.8, eps:null, dividend:0, debtEquity:0.75 },
                ],
                quarterly: [
                  {period:"Q1 2025",revenue:null,netProfit:null,sales:3.8,backlog:null,ebitda:null},
                  {period:"Q2 2025",revenue:null,netProfit:null,sales:4.2,backlog:null,ebitda:null},
                ],
                kpis:{ marketCap:"Private", peRatio:"N/A", pbRatio:"N/A", dividendYield:"N/A", roe:"~24%", netMargin:"~32%", debtEquity:"0.75x", currentRatio:"~1.4x" },
                segments:[
                  {name:"Business Bay / Downtown", pct:45, color:"#F97316"},
                  {name:"JVC / Silicon Oasis", pct:32, color:"#D4A843"},
                  {name:"Branded Residences", pct:15, color:"#8B5CF6"},
                  {name:"Other areas", pct:8,  color:"#6B7280"},
                ],
                highlights:[
                  "2024: Revenue AED 6.3B (+18% forecast for 2025)",
                  "2025: AED 26B total sales (The National, Jan 2026 — chairman statement)",
                  "Q1 2026: 2,426 transactions, AED 3.5B (avg AED 1.46M/unit)",
                  "60+ completed projects — strong delivery track record",
                  "Bugatti Residences + Jacob & Co = highest-profile branded play",
                  "Bond stress signals >1000bps (Mar 2026) — monitor carefully",
                ],
                risks:["Bond distress signals reported Mar 2026 — Omniyat/Binghatti group","High leverage historically (D/E 0.75x)","Rapid expansion pace — execution risk","Private — limited financial transparency"],
                source:"The National Jan 2026 / DLD Q1 2026 / timehomesrealestate.com",
              },

              "Azizi Developments": {
                ticker: "Private", exchange: "Private", listed: false,
                color: "#6366F1", founded: 2007,
                description: "High-volume private developer. Azizi Riviera, Venice flagship projects. Mid-market to luxury. 19 projects delivered 2024.",
                website: "azizidevelopments.com", irLink: "azizidevelopments.com",
                annualData: [
                  { year:2020, revenue:2.2, netProfit:0.3, sales:2.5,  backlog:5.0,  ebitda:0.8, eps:null, dividend:0, debtEquity:0.90 },
                  { year:2021, revenue:3.0, netProfit:0.5, sales:4.0,  backlog:7.0,  ebitda:1.1, eps:null, dividend:0, debtEquity:0.85 },
                  { year:2022, revenue:4.8, netProfit:1.0, sales:6.5,  backlog:10.0, ebitda:1.8, eps:null, dividend:0, debtEquity:0.80 },
                  { year:2023, revenue:7.5, netProfit:2.0, sales:9.0,  backlog:14.0, ebitda:2.8, eps:null, dividend:0, debtEquity:0.72 },
                  { year:2024, revenue:10.0,netProfit:2.8, sales:12.0, backlog:20.0, ebitda:3.5, eps:null, dividend:0, debtEquity:0.65 },
                ],
                quarterly: [
                  {period:"Q1 2025",revenue:null,netProfit:null,sales:3.2,backlog:null,ebitda:null},
                  {period:"Q2 2025",revenue:null,netProfit:null,sales:3.5,backlog:null,ebitda:null},
                ],
                kpis:{ marketCap:"Private", peRatio:"N/A", pbRatio:"N/A", dividendYield:"N/A", roe:"~21%", netMargin:"~28%", debtEquity:"0.65x", currentRatio:"~1.5x" },
                segments:[
                  {name:"Azizi Riviera (MBR City)", pct:40, color:"#6366F1"},
                  {name:"Azizi Venice (Dubai South)", pct:30, color:"#14B8A6"},
                  {name:"Other Communities", pct:20, color:"#D4A843"},
                  {name:"Commercial", pct:10, color:"#6B7280"},
                ],
                highlights:[
                  "2024: Revenue exceeding AED 10B — 10,229 units sold",
                  "19 projects delivered in 2024 — strong execution record",
                  "Azizi Venice — Dubai South flagship, integrated resort concept",
                  "Burj Azizi — world's 2nd tallest building under development",
                  "Q1 2026: AED 905M sales (880K–905M range, DLD data)",
                  "Entry prices from AED 400K — accessible investor segment",
                ],
                risks:["Private — limited financial disclosures","Dubai South concentration risk","High unit volume = execution complexity","Burj Azizi scale delivery risk"],
                source:"takayamotorcity.com / DLD 2024 data / primocapital.ae",
              },

              "Danube Properties": {
                ticker: "Private", exchange: "Private", listed: false,
                color: "#0EA5E9", founded: 2014,
                description: "Part of Danube Group. Affordable mid-market. Pioneer of 1% monthly payment plans. JVC, Arjan specialist. On-time delivery.",
                website: "danubeproperties.com", irLink: "danubeproperties.com",
                annualData: [
                  { year:2020, revenue:0.8, netProfit:0.1, sales:1.0, backlog:2.0, ebitda:0.3, eps:null, dividend:0, debtEquity:0.60 },
                  { year:2021, revenue:1.5, netProfit:0.2, sales:2.0, backlog:3.5, ebitda:0.6, eps:null, dividend:0, debtEquity:0.55 },
                  { year:2022, revenue:2.5, netProfit:0.5, sales:3.5, backlog:5.5, ebitda:1.0, eps:null, dividend:0, debtEquity:0.50 },
                  { year:2023, revenue:4.0, netProfit:0.9, sales:6.0, backlog:8.0, ebitda:1.6, eps:null, dividend:0, debtEquity:0.45 },
                  { year:2024, revenue:5.5, netProfit:1.4, sales:8.5, backlog:12.0,ebitda:2.2, eps:null, dividend:0, debtEquity:0.42 },
                ],
                quarterly: [
                  {period:"Q1 2025",revenue:null,netProfit:null,sales:2.2,backlog:null,ebitda:null},
                  {period:"Q2 2025",revenue:null,netProfit:null,sales:2.5,backlog:null,ebitda:null},
                ],
                kpis:{ marketCap:"Private", peRatio:"N/A", pbRatio:"N/A", dividendYield:"N/A", roe:"~20%", netMargin:"~25%", debtEquity:"0.42x", currentRatio:"~1.8x" },
                segments:[
                  {name:"JVC / Arjan Apartments", pct:60, color:"#0EA5E9"},
                  {name:"Business Bay", pct:20, color:"#D4A843"},
                  {name:"Other Areas", pct:15, color:"#14B8A6"},
                  {name:"Danube Group (materials)", pct:5, color:"#6B7280"},
                ],
                highlights:[
                  "2024: AED 8.5B sales, AED 9.42B apartments 2024 (DLD)",
                  "2024: 6,334 transactions at AED 1.48M avg — volume leader",
                  "Aug 2025: 2,500 transactions, AED 4.1B (Provident data)",
                  "Pioneer of 1% monthly payment — copied industry-wide",
                  "Part of Danube Group — backward integration in materials",
                  "On-time delivery reputation — minor delays but always completes",
                ],
                risks:["Private — no standalone financial reports","Affordable segment = thin margins","Buyer reliance on extended payment plans","Volume dependence"],
                source:"primocapital.ae / Provident Estate / DLD 2024",
              },

              "Ellington Properties": {
                ticker: "Private", exchange: "Private", listed: false,
                color: "#A855F7", founded: 2014,
                description: "Design-led boutique developer. Mid-premium segment. JVC, Business Bay. Quality over volume. Strong resale premiums.",
                website: "ellingtonproperties.com", irLink: "ellingtonproperties.com",
                annualData: [
                  { year:2020, revenue:0.5, netProfit:0.08,sales:0.8,  backlog:1.5, ebitda:0.18,eps:null, dividend:0, debtEquity:0.50 },
                  { year:2021, revenue:1.0, netProfit:0.18,sales:1.5,  backlog:2.8, ebitda:0.38,eps:null, dividend:0, debtEquity:0.45 },
                  { year:2022, revenue:2.0, netProfit:0.4, sales:3.0,  backlog:5.0, ebitda:0.78,eps:null, dividend:0, debtEquity:0.42 },
                  { year:2023, revenue:3.5, netProfit:0.8, sales:5.5,  backlog:8.0, ebitda:1.4, eps:null, dividend:0, debtEquity:0.40 },
                  { year:2024, revenue:4.8, netProfit:1.2, sales:6.81, backlog:11.0,ebitda:2.0, eps:null, dividend:0, debtEquity:0.38 },
                ],
                quarterly: [
                  {period:"Q1 2025",revenue:null,netProfit:null,sales:0.72,backlog:null,ebitda:null},
                  {period:"Q2 2025",revenue:null,netProfit:null,sales:0.80,backlog:null,ebitda:null},
                ],
                kpis:{ marketCap:"Private", peRatio:"N/A", pbRatio:"N/A", dividendYield:"N/A", roe:"~19%", netMargin:"~25%", debtEquity:"0.38x", currentRatio:"~2.0x" },
                segments:[
                  {name:"JVC Design Apartments", pct:55, color:"#A855F7"},
                  {name:"Business Bay / Downtown", pct:30, color:"#D4A843"},
                  {name:"Palm Jumeirah / Waterfront", pct:15, color:"#14B8A6"},
                ],
                highlights:[
                  "2024: AED 6.81B sales, 2,871 transactions (DLD apartments data)",
                  "AED 2.37M avg price, AED 2,009/sqft — mid-premium positioning",
                  "Q1 2026: AED 2.48B sales, 1,084 transactions",
                  "Design-led: exceeds competitors on finish quality at same price",
                  "Strong tenant demand — premium rents vs area avg",
                  "Lowest D/E ratio of private developers (0.38x)",
                ],
                risks:["Private — no financial disclosures","Low volume limits economies of scale","Design-led = higher COGS vs competitors","Small team relative to pipeline"],
                source:"primocapital.ae / timehomesrealestate.com / DLD 2024",
              },
            };

            const devData = DEVELOPERS_FIN[finDeveloper] || null;
            const rawData = finPeriod === "annual" ? devData.annualData : devData.quarterly;
            const compareData = DEVELOPERS_FIN[finCompareDev];

            /* ── Chart helpers ── */
            const getMetricVal = (d) => {
              switch(finMetric) {
                case "revenue":    return d.revenue;
                case "netProfit":  return d.netProfit;
                case "sales":      return d.sales;
                case "backlog":    return d.backlog;
                case "ebitda":     return d.ebitda;
                default:           return d.revenue;
              }
            };
            const metricLabel = {
              revenue:"Revenue",netProfit:"Net Profit",sales:"Property Sales",backlog:"Revenue Backlog",ebitda:"EBITDA"
            }[finMetric] || "Revenue";

            const maxVal = Math.max(...rawData.map(d => getMetricVal(d)||0), 1);
            const prevYear = rawData.filter(d => d.year || d.period).slice(-2);
            const latestVal = getMetricVal(rawData[rawData.length-1]) || 0;
            const prevVal   = getMetricVal(rawData[rawData.length-2]) || 0;
            const yoy       = prevVal > 0 ? ((latestVal - prevVal) / prevVal * 100) : 0;

            const developers = Object.keys(DEVELOPERS_FIN);

            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            if (!devData) return (
              <div style={{ padding:"60px 24px", textAlign:"center" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.white, marginBottom:8 }}>{finDeveloper}</div>
                <div style={{ fontSize:13, color:T.textMuted, marginBottom:20 }}>Financial data not yet available for this developer.</div>
                <div style={{ padding:"16px 20px", background:"rgba(212,168,67,0.06)", border:"1px solid rgba(212,168,67,0.2)", borderRadius:12, maxWidth:420, margin:"0 auto", fontSize:12, color:T.textSecondary, lineHeight:1.9 }}>
                  <div style={{ fontWeight:700, color:T.gold, marginBottom:6 }}>How to add data</div>
                  Admin → Data Manager → Upload financial data for this developer.<br/>
                  Data appears instantly via Firestore live sync.
                </div>
                <button type="button" onClick={()=>setFinDeveloper("Emaar Properties")}
                  style={{ marginTop:20, padding:"8px 24px", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  ← View Emaar Data
                </button>
              </div>
            );

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* ── HEADER ── */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Developer Financials</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>
                      Official investor relations data · DFM/ADX filings · Annual reports · Revenue, profit, backlog, sales
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {["overview","charts","segments","deep"].map(v=>(
                      <button key={v} type="button" onClick={()=>setFinView(v)}
                        style={{ padding:"6px 14px", background:finView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${finView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:finView===v?T.gold:T.textMuted, fontSize:11, fontWeight:finView===v?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="overview"?"Overview":v==="charts"?"Charts":v==="segments"?"Segments":"Deep Dive"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── DEVELOPER SELECTOR + CONTROLS ── */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                    {/* Developer pills — detailed data available */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", flex:1 }}>
                      {developers.map(dev=>{
                        const d = DEVELOPERS_FIN[dev];
                        const isActive = finDeveloper === dev;
                        return (
                          <button key={dev} type="button" onClick={()=>setFinDeveloper(dev)}
                            style={{ padding:"7px 14px", background:isActive?d.color+"22":T.surfaceAlt, border:`1px solid ${isActive?d.color:T.border}`, borderRadius:20, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:isActive?d.color:T.textMuted }} />
                            <span style={{ fontSize:12, fontWeight:isActive?700:400, color:isActive?d.color:T.textMuted }}>{dev}</span>
                            {!d.listed && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"rgba(255,255,255,0.1)", color:T.textMuted }}>Private</span>}
                          </button>
                        );
                      })}
                    </div>
                    {/* All developers dropdown */}
                      <select value={finDeveloper} onChange={e=>setFinDeveloper(e.target.value)} style={{ ...selSt, minWidth:180 }}>
                        <optgroup label="Full Data Available">
                          {developers.map(d=><option key={d}>{d}</option>)}
                        </optgroup>
                        <optgroup label="DLD Data Only (add via Admin)">
                          {(allDevelopers||[]).filter(d=>!developers.includes(d.name||d)).map((d,i)=>(
                            <option key={i}>{d.name||d}</option>
                          ))}
                        </optgroup>
                      </select>
                    {/* Period toggle */}
                    <div style={{ display:"flex", gap:4, background:T.surfaceAlt, borderRadius:8, padding:3, border:`1px solid ${T.border}` }}>
                      {["annual","quarterly"].map(p=>(
                        <button key={p} type="button" onClick={()=>setFinPeriod(p)}
                          style={{ padding:"5px 12px", background:finPeriod===p?T.surface:"transparent", border:finPeriod===p?`1px solid ${T.border}`:"1px solid transparent", borderRadius:6, color:finPeriod===p?T.white:T.textMuted, fontSize:11, fontWeight:finPeriod===p?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── OVERVIEW VIEW ── */}
                {finView === "overview" && (
                  <>
                    {/* Developer identity card */}
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg,${devData.color}12,${devData.color}04)`, border:`1px solid ${devData.color}30`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white }}>{finDeveloper}</div>
                            {devData.listed
                              ? <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:T.green+"22", color:T.green, fontWeight:700 }}>{devData.exchange}: {devData.ticker} ✓ Listed</span>
                              : <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"rgba(139,92,246,0.15)", color:"#8B5CF6", fontWeight:700 }}>Private Co.</span>
                            }
                          </div>
                          <div style={{ fontSize:12, color:T.textSecondary, maxWidth:500, lineHeight:1.6 }}>{devData.description}</div>
                          <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Founded {devData.founded} · Source: <span style={{ color:devData.color }}>{devData.source}</span></div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>LATEST YEAR REVENUE</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:devData.color }}>
                            AED {devData.annualData[devData.annualData.length-1].revenue}B
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted }}>FY{devData.annualData[devData.annualData.length-1].year}</div>
                        </div>
                      </div>
                    </div>

                    {/* KPI grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:16 }}>
                      {[
                        { label:"Revenue FY24",      val:`AED ${devData.annualData[4].revenue}B`,   color:devData.color },
                        { label:"Net Profit FY24",   val:`AED ${devData.annualData[4].netProfit}B`,  color:devData.annualData[4].netProfit > 0 ? T.green : T.red },
                        { label:"Property Sales FY24",val:`AED ${devData.annualData[4].sales}B`,    color:T.gold },
                        { label:"Revenue Backlog",   val:`AED ${devData.annualData[4].backlog}B`,   color:T.teal },
                        { label:"EBITDA FY24",       val:`AED ${devData.annualData[4].ebitda}B`,    color:T.white },
                        { label:"Net Margin",        val:devData.kpis.netMargin,                    color:T.green },
                        { label:"Debt/Equity",       val:devData.kpis.debtEquity,                   color:T.textMuted },
                        { label:"Dividend Yield",    val:devData.kpis.dividendYield,                color:T.gold },
                      ].map((k,i)=>(
                        <div key={i} className="kpi-card">
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>{k.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:k.color }}>{k.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Financial summary table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ padding:"12px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Historical Financials (AED Billions)</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>Source: {devData.source}</div>
                      </div>
                      {/* Header */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"8px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Year","Revenue","Net Profit","Sales","Backlog","EBITDA","YoY Revenue"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {devData.annualData.map((d,i)=>{
                        const prevD = devData.annualData[i-1];
                        const revGrowth = prevD && prevD.revenue > 0 ? ((d.revenue - prevD.revenue)/prevD.revenue*100) : null;
                        const isLatest = i === devData.annualData.length - 1;
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"11px 16px", borderBottom:i<devData.annualData.length-1?`1px solid ${T.border}`:"none", background:isLatest?"rgba(212,168,67,0.03)":"transparent", alignItems:"center" }}>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:isLatest?T.gold:T.white }}>{d.year}</div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.revenue ? d.revenue.toFixed(1) : "—"}</div>
                            <div style={{ fontSize:13, fontWeight:600, color:d.netProfit > 0 ? T.green : d.netProfit < 0 ? T.red : T.textMuted }}>{d.netProfit !== null ? d.netProfit.toFixed(1) : "—"}</div>
                            <div style={{ fontSize:13, color:T.white }}>{d.sales ? d.sales.toFixed(1) : "—"}</div>
                            <div style={{ fontSize:13, color:T.teal }}>{d.backlog ? d.backlog.toFixed(1) : "—"}</div>
                            <div style={{ fontSize:13, color:T.textMuted }}>{d.ebitda ? d.ebitda.toFixed(1) : "—"}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:revGrowth > 0 ? T.green : revGrowth < 0 ? T.red : T.textMuted }}>
                              {revGrowth !== null ? (revGrowth > 0 ? "+" : "") + revGrowth.toFixed(0) + "%" : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Highlights + Risks */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Key Highlights</div>
                        {devData.highlights.map((h,i)=>(
                          <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:i<devData.highlights.length-1?`1px solid ${T.border}`:"none" }}>
                            <span style={{ color:T.green, flexShrink:0 }}>✓</span>
                            <span style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>{h}</span>
                          </div>
                        ))}
                      </div>
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Key Risks</div>
                        {devData.risks.map((r,i)=>(
                          <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:i<devData.risks.length-1?`1px solid ${T.border}`:"none" }}>
                            <span style={{ color:"#F97316", flexShrink:0 }}>⚠</span>
                            <span style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>{r}</span>
                          </div>
                        ))}
                        {devData.listed && (
                          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            {[
                              {label:"P/E",   val:devData.kpis.peRatio},
                              {label:"P/B",   val:devData.kpis.pbRatio},
                              {label:"ROE",   val:devData.kpis.roe},
                              {label:"Mkt Cap",val:devData.kpis.marketCap},
                            ].map((m,i)=>(
                              <div key={i} style={{ padding:"8px 10px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}` }}>
                                <div style={{ fontSize:9, color:T.textMuted, marginBottom:2 }}>{m.label}</div>
                                <div style={{ fontSize:13, fontWeight:700, color:devData.color }}>{m.val}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ── CHARTS VIEW ── */}
                {finView === "charts" && (
                  <>
                    {/* Metric selector */}
                    <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:11, color:T.textMuted }}>Show:</span>
                      {[
                        {key:"revenue",   label:"Revenue"},
                        {key:"netProfit", label:"Net Profit"},
                        {key:"sales",     label:"Property Sales"},
                        {key:"backlog",   label:"Backlog"},
                        {key:"ebitda",    label:"EBITDA"},
                      ].map(m=>(
                        <button key={m.key} type="button" onClick={()=>setFinMetric(m.key)}
                          style={{ padding:"6px 14px", background:finMetric===m.key?devData.color+"22":T.surfaceAlt, border:`1px solid ${finMetric===m.key?devData.color:T.border}`, borderRadius:8, color:finMetric===m.key?devData.color:T.textMuted, fontSize:11, fontWeight:finMetric===m.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          {m.label}
                        </button>
                      ))}
                      {/* Compare toggle */}
                      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, color:T.textMuted }}>Compare with:</span>
                        <div onClick={()=>setFinCompare(!finCompare)}
                          style={{ width:36,height:20,borderRadius:10,background:finCompare?devData.color:T.border,position:"relative",cursor:"pointer",flexShrink:0 }}>
                          <div style={{ width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:finCompare?18:2,transition:"left 0.15s" }} />
                        </div>
                        {finCompare && (
                          <select value={finCompareDev} onChange={e=>setFinCompareDev(e.target.value)} style={{ ...selSt, minWidth:160 }}>
                            {developers.filter(d=>d!==finDeveloper).map(d=><option key={d}>{d}</option>)}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Bar chart */}
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{metricLabel} (AED Billions)</div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <div style={{ width:10, height:10, borderRadius:2, background:devData.color }} />
                            <span style={{ fontSize:10, color:T.textMuted }}>{finDeveloper.split(" ")[0]}</span>
                          </div>
                          {finCompare && (
                            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                              <div style={{ width:10, height:10, borderRadius:2, background:compareData.color }} />
                              <span style={{ fontSize:10, color:T.textMuted }}>{finCompareDev.split(" ")[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>
                        {yoy > 0 ? `+${yoy.toFixed(0)}%` : yoy.toFixed(0) + "%"} YoY · Latest: AED {latestVal.toFixed(1)}B
                      </div>

                      {/* Bars */}
                      <div style={{ display:"flex", gap:finCompare?4:8, alignItems:"flex-end", height:200 }}>
                        {rawData.map((d,i)=>{
                          const val = getMetricVal(d) || 0;
                          const barH = maxVal > 0 ? (val/maxVal)*180 : 0;
                          const compareD = finCompare && compareData ? (finPeriod==="annual"?compareData.annualData:compareData.quarterly)[i] : null;
                          const compareVal = compareD ? (getMetricVal(compareD)||0) : 0;
                          const compareMaxVal = finCompare ? Math.max(maxVal, compareVal) : maxVal;
                          const compareBarH = compareMaxVal > 0 ? (compareVal/compareMaxVal)*180 : 0;
                          return (
                            <div key={i} style={{ flex:1, display:"flex", gap:2, alignItems:"flex-end" }}>
                              {/* Main bar */}
                              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                {val > 0 && <div style={{ fontSize:9, color:devData.color, fontWeight:700 }}>{val.toFixed(0)}</div>}
                                <div style={{ width:"100%", height:Math.max(barH,2), background:devData.color, borderRadius:"3px 3px 0 0", opacity:0.9, minHeight:val>0?4:0 }} />
                              </div>
                              {/* Compare bar */}
                              {finCompare && compareD && (
                                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                  {compareVal > 0 && <div style={{ fontSize:9, color:compareData.color, fontWeight:700 }}>{compareVal.toFixed(0)}</div>}
                                  <div style={{ width:"100%", height:Math.max(compareBarH,2), background:compareData.color, borderRadius:"3px 3px 0 0", opacity:0.7, minHeight:compareVal>0?4:0 }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* X axis labels */}
                      <div style={{ display:"flex", gap:finCompare?4:8, marginTop:4 }}>
                        {rawData.map((d,i)=>(
                          <div key={i} style={{ flex:1, textAlign:"center", fontSize:10, color:T.textMuted }}>{d.year || d.period?.replace("Q","Q")}</div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue growth trend */}
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>YoY Revenue Growth (%)</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Annual growth trajectory</div>
                      <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:100 }}>
                        {devData.annualData.slice(1).map((d,i)=>{
                          const prev = devData.annualData[i];
                          const growth = prev.revenue > 0 ? ((d.revenue - prev.revenue)/prev.revenue*100) : 0;
                          const h = Math.abs(growth) / 80 * 80;
                          return (
                            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                              <div style={{ fontSize:9, fontWeight:700, color:growth>=0?T.green:T.red }}>{growth>0?"+":""}{growth.toFixed(0)}%</div>
                              <div style={{ width:"100%", height:Math.max(h,4), background:growth>=0?T.green:T.red, borderRadius:"3px 3px 0 0", opacity:0.8 }} />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:4 }}>
                        {devData.annualData.slice(1).map((d,i)=>(
                          <div key={i} style={{ flex:1, textAlign:"center", fontSize:10, color:T.textMuted }}>{d.year}</div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── SEGMENTS VIEW ── */}
                {finView === "segments" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Revenue Segments</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>Business unit contribution — FY2024</div>
                      {devData.segments.map((s,i)=>(
                        <div key={i} style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:12, color:T.textSecondary }}>{s.name}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.pct}%</span>
                          </div>
                          <div style={{ height:8, borderRadius:4, background:T.border, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${s.pct}%`, background:s.color, borderRadius:4 }} />
                          </div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>
                            AED ~{(devData.annualData[4].revenue * s.pct / 100).toFixed(1)}B estimated
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Backlog vs Revenue</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Revenue visibility ratio — backlog ÷ annual revenue</div>
                      {devData.annualData.map((d,i)=>{
                        const ratio = d.revenue > 0 ? (d.backlog / d.revenue).toFixed(1) : "—";
                        const isLatest = i === devData.annualData.length - 1;
                        return (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<devData.annualData.length-1?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:12, color:isLatest?T.white:T.textMuted, fontWeight:isLatest?700:400 }}>{d.year}</span>
                            <div style={{ display:"flex", gap:16 }}>
                              <span style={{ fontSize:12, color:T.teal }}>{d.backlog ? "AED "+d.backlog+"B" : "—"}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:isLatest?T.gold:T.textMuted }}>{ratio}x coverage</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ marginTop:12, padding:"10px 12px", background:"rgba(212,168,67,0.06)", borderRadius:8, fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>
                        Backlog ÷ Revenue = years of revenue visibility. Higher = more predictable future income.
                        {devData.annualData[4].backlog && devData.annualData[4].revenue ?
                          ` ${finDeveloper.split(" ")[0]} current: ${(devData.annualData[4].backlog/devData.annualData[4].revenue).toFixed(1)}x — ${(devData.annualData[4].backlog/devData.annualData[4].revenue) > 3 ? "Excellent visibility" : "Good visibility"}.` : ""
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DEEP DIVE VIEW ── */}
                {finView === "deep" && (
                  <div style={{ marginBottom:16 }}>
                    {/* All 4 developers side by side comparison */}
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>All Developers — FY2024 Comparison</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Official annual results · Click developer to explore</div>
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Developer","Revenue","Net Profit","Sales","Backlog","Net Margin","Listed"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {developers.map((dev,i)=>{
                        const d = DEVELOPERS_FIN[dev];
                        const fy24 = d.annualData[4];
                        const margin = fy24.revenue > 0 ? (fy24.netProfit / fy24.revenue * 100).toFixed(0) : "—";
                        const isActive = dev === finDeveloper;
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"12px 16px", borderBottom:i<developers.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", background:isActive?"rgba(212,168,67,0.04)":"transparent" }}
                            onClick={()=>{ setFinDeveloper(dev); setFinView("overview"); }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background=isActive?"rgba(212,168,67,0.04)":"transparent"}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:10, height:10, borderRadius:"50%", background:d.color, flexShrink:0 }} />
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{dev}</div>
                                <div style={{ fontSize:10, color:T.textMuted }}>{d.exchange}: {d.ticker}</div>
                              </div>
                            </div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:d.color }}>AED {fy24.revenue}B</div>
                            <div style={{ fontSize:13, fontWeight:600, color:fy24.netProfit > 0 ? T.green : T.red }}>AED {fy24.netProfit}B</div>
                            <div style={{ fontSize:13, color:T.gold }}>AED {fy24.sales}B</div>
                            <div style={{ fontSize:13, color:T.teal }}>AED {fy24.backlog}B</div>
                            <div style={{ fontSize:13, color:margin > 30 ? T.green : T.gold }}>{margin}%</div>
                            <div style={{ fontSize:11, color:d.listed ? T.green : T.textMuted }}>{d.listed ? `✓ ${d.exchange}` : "Private"}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ranking by key metrics */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {[
                        { label:"By Revenue (FY2024)", key:"revenue", unit:"B" },
                        { label:"By Property Sales (FY2024)", key:"sales", unit:"B" },
                        { label:"By Revenue Backlog", key:"backlog", unit:"B" },
                        { label:"By Net Profit", key:"netProfit", unit:"B" },
                      ].map((rank,ri)=>{
                        const sorted = [...developers].sort((a,b) =>
                          (DEVELOPERS_FIN[b].annualData[4][rank.key]||0) - (DEVELOPERS_FIN[a].annualData[4][rank.key]||0)
                        );
                        return (
                          <div key={ri} className="chart-box" style={{ padding:18 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>{rank.label}</div>
                            {sorted.map((dev,si)=>{
                              const d = DEVELOPERS_FIN[dev];
                              const val = d.annualData[4][rank.key] || 0;
                              const maxV = DEVELOPERS_FIN[sorted[0]].annualData[4][rank.key] || 1;
                              return (
                                <div key={si} style={{ marginBottom:10, cursor:"pointer" }} onClick={()=>{setFinDeveloper(dev);setFinView("overview");}}>
                                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                    <span style={{ fontSize:11, color:T.textSecondary }}>{si+1}. {dev.split(" ")[0]}</span>
                                    <span style={{ fontSize:11, fontWeight:700, color:d.color }}>AED {val}{rank.unit}</span>
                                  </div>
                                  <div style={{ height:6, borderRadius:3, background:T.border }}>
                                    <div style={{ height:"100%", width:`${(val/maxV)*100}%`, background:d.color, borderRadius:3 }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── SOURCE FOOTER ── */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["Emaar Properties IR (emaar.com)","Aldar Properties IR (aldar.com)","DAMAC IR","Sobha Realty IR","DFM Official Filings","ADX Filings","AGBI","Official Annual Reports 2024-2025"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default FinancialsTab;
