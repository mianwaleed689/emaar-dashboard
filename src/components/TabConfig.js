/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — TAB CONFIGURATION
   Extracted from EmaarDashboardV2.jsx
   TAB_GROUPS: sidebar navigation structure (6 groups, 32 tabs)
   INTELLIGENCE_TABS: empty state descriptions per tab
   TABS: flat array for backward compatibility
   ═══════════════════════════════════════════════════════════════════ */

import { SvgIcons } from './Icons';

/* ─── TAB GROUPS — 6 sections, 32 tabs in sequence ─── */
export const TAB_GROUPS = [
  {
    id: "market",
    label: "Market Intelligence",
    icon: SvgIcons.TrendingUp,
    tabs: [
      { key: "Overview",        icon: SvgIcons.LayoutDashboard },
      { key: "Market",          icon: SvgIcons.Globe },
      { key: "DLD Volumes",     icon: SvgIcons.Database },
      { key: "Price History",   icon: SvgIcons.TrendingUp },
      { key: "Neighbourhoods",  icon: SvgIcons.MapPin },
      { key: "Launch Calendar", icon: SvgIcons.Calendar },
      { key: "Currency",        icon: SvgIcons.CreditCard },
    ]
  },
  {
    id: "property",
    label: "Property Explorer",
    icon: SvgIcons.Building2,
    tabs: [
      { key: "Projects",        icon: SvgIcons.Building2 },
      { key: "Map",             icon: SvgIcons.Map },
      { key: "Handover",        icon: SvgIcons.Clock },
      { key: "Service Charges", icon: SvgIcons.Receipt },
    ]
  },
  {
    id: "investment",
    label: "Investment Tools",
    icon: SvgIcons.BarChart3,
    tabs: [
      { key: "Yields",           icon: SvgIcons.BarChart3 },
      { key: "STR vs LTR",       icon: SvgIcons.ArrowLeftRight },
      { key: "Mortgage",         icon: SvgIcons.Landmark },
      { key: "Investment Score", icon: SvgIcons.Star },
      { key: "Flip",             icon: SvgIcons.RefreshCw },
      { key: "DXB Estimate",     icon: SvgIcons.Search },
      { key: "Portfolio",        icon: SvgIcons.Briefcase },
      { key: "Golden Visa",      icon: SvgIcons.Award },
      { key: "Risk",             icon: SvgIcons.AlertTriangle },
    ]
  },
  {
    id: "developer",
    label: "Developer Intelligence",
    icon: SvgIcons.Activity,
    tabs: [
      { key: "Financials",       icon: SvgIcons.BarChart2 },
      { key: "Developer Health", icon: SvgIcons.Activity },
      { key: "Competitors",      icon: SvgIcons.Layers },
      { key: "Banking",          icon: SvgIcons.CreditCard },
    ]
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: SvgIcons.TrendingUp,
    tabs: [
      { key: "Marketing", icon: SvgIcons.Activity },
    ]
  },
  {
    id: "crm",
    label: "Agency CRM",
    icon: SvgIcons.Users,
    tabs: [
      { key: "My Leads",    icon: SvgIcons.Users },
      { key: "Pipeline",    icon: SvgIcons.LayoutGrid },
      { key: "Listings",    icon: SvgIcons.Building },
      { key: "Team",        icon: SvgIcons.Users2 },
      { key: "Agency",      icon: SvgIcons.Building2 },
      { key: "Compliance",  icon: SvgIcons.Shield },
      { key: "Dev Portal",  icon: SvgIcons.Layers },
      { key: "Intelligence",icon: SvgIcons.Database },
    ]
  },
];

/* ─── Flat TABS for backward compatibility ─── */
export const TABS = TAB_GROUPS.flatMap(g => g.tabs);

/* ─── INTELLIGENCE TAB CONFIGS — empty state descriptions ─── */
export const INTELLIGENCE_TABS = {
  "Overview": {
    icon: "📊",
    description: "Your Bloomberg-style command centre. Live market ticker, KPI cards, developer intelligence panel, and real-time DLD feed — all connected to your data sources.",
    adminHint: "Connect data sources from Admin → Data Manager → Market Data"
  },
  "Financials": {
    icon: "📹",
    description: "Developer financial intelligence — revenue, net profit, EBITDA, backlog, EPS, DPS — 6-year history charts. Auto-updated from developer IR reports.",
    adminHint: "Add developer financials from Admin → Data Manager → Developers"
  },
  "Projects": {
    icon: "🏗️",
    description: "Browse all projects across all property types — Off-Plan, Residential, Commercial, Secondary Market, Hotel Apartments, Villas, Balcony View Units. Filter, compare, and score every property.",
    adminHint: "Import projects from Admin → Data Manager → Projects"
  },
  "Handover": {
    icon: "📅",
    description: "Construction timeline tracker. Monitor handover dates, construction progress, and delivery risk for all off-plan projects. Automated countdown alerts.",
    adminHint: "Add project handover data from Admin → Data Manager → Projects"
  },
  "Launch Calendar": {
    icon: "🚀",
    description: "Never miss a launch. Upcoming project launches by developer, EOI status, expected pricing, and past launch performance vs actual prices.",
    adminHint: "Launch data auto-populates from Bayut API scanner — check Admin → Data Health"
  },
  "Neighbourhoods": {
    icon: "🏘️",
    description: "Community intelligence — average PPSF, yields, schools, hospitals, metro access, lifestyle ratings, supply risk, and demand strength for every Dubai community.",
    adminHint: "Add community data from Admin → Data Manager → Communities"
  },
  "Service Charges": {
    icon: "📋",
    description: "RERA registered service charge rates per community in AED/sqft/year. Historical trends, net yield impact calculator, and community comparisons.",
    adminHint: "Add service charge data from Admin → Data Manager → Communities"
  },
  "STR vs LTR": {
    icon: "🏠",
    description: "Short-term Airbnb vs long-term tenancy comparison per community per unit type. Occupancy rates, daily rates, platform fees, management costs, and net income.",
    adminHint: "STR data connects to Bayut API — configure from Admin → Data Health"
  },
  "Developer Health": {
    icon: "🩺",
    description: "Developer health scores — delivery track record, financial strength, project pipeline risk, RERA status, and complaint ratios. 9-factor radar chart.",
    adminHint: "Add developer profiles from Admin → Data Manager → Developers"
  },
  "DLD Volumes": {
    icon: "📈",
    description: "Live DLD transaction data — volume by community, developer, property type, nationality, cash vs mortgage. Monthly trends, price anomaly alerts.",
    adminHint: "DLD data auto-syncs daily — check Admin → Data Health → DLD Cron"
  },
  "DXB Estimate": {
    icon: "🔍",
    description: "The Zestimate for Dubai. Enter any unit details and get an estimated market value backed by actual DLD transaction comparables.",
    adminHint: "AVM requires DLD data — check Admin → Data Health → DLD Cron"
  },
  "Portfolio": {
    icon: "💼",
    description: "Personal investment portfolio tracker. Add your properties, track current market value, unrealised gains, rental income, IRR, and Golden Visa eligibility.",
    adminHint: "Portfolio reads from live market data — connect DLD and Bayut first"
  },
  "Competitors": {
    icon: "⚔️",
    description: "Developer vs developer intelligence — sales volume, delivery record, PPSF comparison, market share, community presence, and branded residence count.",
    adminHint: "Add developer data from Admin → Data Manager → Developers"
  },
  "Yields": {
    icon: "📊",
    description: "Gross and net rental yields by community and unit type. 5-year historical trend, best yielding communities ranked, and yield vs appreciation tradeoff.",
    adminHint: "Yield data auto-syncs weekly from Bayut API — check Admin → Data Health"
  },
  "Mortgage": {
    icon: "🏦",
    description: "Live EIBOR mortgage calculator. Monthly payment, total cost of acquisition (DLD 4%, agency 2%, trustee fees), amortisation schedule, and 5 bank rate comparison.",
    adminHint: "EIBOR updates daily — check Admin → EIBOR Rates"
  },
  "Map": {
    icon: "🗺️",
    description: "Interactive property map with yield heatmap, PPSF heatmap, transaction volume layer, project pins, and community boundaries. Distance rings from key landmarks.",
    adminHint: "Map renders from project data — import projects first"
  },
  "Risk": {
    icon: "⚠️",
    description: "9-factor investment risk scoring per community and project. Supply risk, demand strength, price trajectory, developer quality, regulatory environment.",
    adminHint: "Risk scores calculate automatically from project and market data"
  },
  "Market": {
    icon: "🌍",
    description: "Dubai real estate macro view — total market size, transaction count, off-plan vs secondary split, top developers, international buyer breakdown, and analyst forecasts.",
    adminHint: "Market data updates from Admin → Market Intelligence → Update Stats"
  },
  "Currency": {
    icon: "💱",
    description: "Live AED exchange rates for international buyers — GBP, USD, EUR, RUB, INR, CNY, and more. Property price converter and historical rate chart.",
    adminHint: "Currency rates update automatically via ExchangeRate API"
  },
  "Golden Visa": {
    icon: "🥇",
    description: "Golden Visa eligibility calculator. Enter property value to check AED 2M minimum, requirements, process steps, and timeline. Auto-checks portfolio eligibility.",
    adminHint: "Golden Visa rules update from Admin → Data Manager → Regulations"
  },
  "Flip": {
    icon: "🔄",
    description: "Property flip ROI calculator — purchase price, renovation cost, holding period, selling price. Returns net profit, ROI, annualised return, and optimal hold period.",
    adminHint: "Flip calculator works with market data — connect DLD and Bayut first"
  },
  "Investment Score": {
    icon: "⭐",
    description: "AI investment scoring for any property — yield potential, location quality, developer health, price vs market, liquidity, handover risk, supply risk. 0-100 score with breakdown.",
    adminHint: "Investment Score requires project data — import projects first"
  },
  "Price History": {
    icon: "📉",
    description: "5-year PPSF trend per community per unit type. Off-plan vs secondary price divergence, correction alerts, and momentum indicators.",
    adminHint: "Price history syncs from DLD data — check Admin → Data Health → DLD Cron"
  },
};
