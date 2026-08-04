/* ═══════════════════════════════════════════════════════════════════
   TAB CONFIGURATION — the single source of truth for navigation.

   ── WHY THIS FILE EXISTS ────────────────────────────────────────────

   There were two copies of TAB_GROUPS: one inline in EmaarDashboardV2.jsx
   (which the app actually rendered) and one in components/TabConfig.js
   (exported from components/index.js and imported by nobody). They had
   already drifted — the unused copy was missing the Data Quality tab. A
   navigation change made in the wrong file would have been invisible.

   Both now re-export from here.

   ── HOW IT IS ORGANISED ─────────────────────────────────────────────

   By the job the agent is doing, not by the feature category the tab was
   built in. The old grouping had nine tabs under "Investment Tools" and
   put Banking under "Developer Intelligence" — organised the way the
   product was built rather than the way it is used. An agent does not
   think "I need an investment tool"; they think "my client asked whether
   the service charge kills the yield".

   THE CRM IS CONTIGUOUS. The seven tabs that read or write the agency's
   own records — leads, deals, listings, team, people, agency, compliance —
   are the first two groups, one after the other. They used to be split:
   "Today" at the top, "Run the agency" at the bottom, and five groups of
   market tabs wedged in between, so running a deal and running the company
   meant crossing the whole product. Everything from "Find a property" down
   is market intelligence, opened when a specific client question arrives.

   ── ICONS ───────────────────────────────────────────────────────────

   Stored as NAMES, not components, so this file stays free of JSX and
   React. That lets the audit scripts (plain CommonJS) read it, and it
   removes the old coupling where the two copies of the nav pulled their
   icons from two different SvgIcons objects. Consumers map the name
   through whichever icon set they own.

   ── HELD BACK ───────────────────────────────────────────────────────

   A tab with `held` is hidden from customers and still reachable by an
   admin, so work in progress can be previewed on the live site without
   being sold. `held` carries the reason, in the tab entry, so it is
   answerable at a glance rather than buried in a commit message.

   Held is not deleted. A tab returns by removing one line, once it
   reaches the bar in scripts/tab-scorecard.js.
   ═══════════════════════════════════════════════════════════════════ */

export const TAB_GROUPS = [
  {
    id: "today",
    label: "Today",
    iconName: "LayoutDashboard",
    tabs: [
      { key: "Overview",  iconName: "LayoutDashboard" },
      { key: "My Leads",  iconName: "Users" },
      { key: "Pipeline",  iconName: "LayoutGrid" },
      { key: "Listings",  iconName: "Building" },
    ],
  },
  {
    id: "agency",
    label: "Run the agency",
    iconName: "Users2",
    tabs: [
      /* People is the HR half of the product, and it is deliberately NOT
         called "HR Sales" or filed under the sales group — it covers every
         department, including the ones that never touch a lead. */
      { key: "People",       iconName: "Users2" },
      { key: "Team",         iconName: "Users2" },
      { key: "Agency",       iconName: "Building2" },
      { key: "Compliance",   iconName: "Shield" },
    ],
  },
  {
    id: "find",
    label: "Find a property",
    iconName: "Building2",
    tabs: [
      { key: "Projects",        iconName: "Building2" },
      { key: "Map",             iconName: "Map" },
      { key: "Launch Calendar", iconName: "Calendar" },
      { key: "Handover",        iconName: "Clock" },
    ],
  },
  {
    id: "advise",
    label: "Advise a client",
    iconName: "MapPin",
    tabs: [
      { key: "Neighbourhoods",  iconName: "MapPin" },
      { key: "Yields",          iconName: "BarChart3" },
      { key: "Service Charges", iconName: "Receipt" },
      { key: "DXB Estimate",    iconName: "Search" },
      { key: "Risk",            iconName: "AlertTriangle" },
    ],
  },
  {
    id: "model",
    label: "Model a deal",
    iconName: "Star",
    tabs: [
      { key: "Investment Score", iconName: "Star" },
      { key: "STR vs LTR",       iconName: "ArrowLeftRight" },
      { key: "Flip",             iconName: "RefreshCw" },
      { key: "Portfolio",        iconName: "Briefcase" },
      { key: "Golden Visa",      iconName: "Award" },
    ],
  },
  {
    id: "finance",
    label: "Finance the deal",
    iconName: "Landmark",
    tabs: [
      { key: "Mortgage", iconName: "Landmark" },
      { key: "Banking",  iconName: "CreditCard" },
      { key: "Currency", iconName: "CreditCard" },
    ],
  },
  {
    id: "research",
    label: "Research the market",
    iconName: "Globe",
    tabs: [
      { key: "Market",        iconName: "Globe" },
      { key: "DLD Volumes",   iconName: "Database" },
      { key: "Price History", iconName: "TrendingUp" },
      /* Moved out of "Run the agency": neither reads the agency's own
         records. Intelligence is the market read and Data Quality is the
         platform's own coverage, so both belong with research. */
      { key: "Intelligence",  iconName: "Database" },
      { key: "Data Quality",  iconName: "Activity" },
    ],
  },
  {
    /* Everything below the line is admin-only. The group renders for an
       admin so the work is reachable; for a customer it disappears
       entirely, along with every tab inside it. */
    id: "held",
    label: "Not shipped (admin only)",
    iconName: "AlertTriangle",
    tabs: [
      { key: "Competitors",      iconName: "Layers",
        held: "Built for developers, not agents. Scores 42% with 40 unsourced claims and ten invented sub-scores. Returns rebuilt on developerMetrics.js as a 'who actually delivers here' tool for agents." },
      { key: "Developer Health", iconName: "Activity",
        held: "Built for developers, not agents. Publishes a composite grade — score 94, 'A+' — assembled from delivery, reputation and RERA figures the product does not hold." },
      { key: "Financials",       iconName: "BarChart2",
        held: "Developer IR reporting — revenue, EBITDA, EPS. No agent use case, and at 25% the lowest-scoring tab in the product precisely because nobody maintains a tab for an audience that is not there." },
      { key: "Dev Portal",       iconName: "Layers",
        held: "A portal for developers to submit inventory. Nothing to serve until developers are customers." },
      { key: "Marketing",        iconName: "TrendingUp",
        held: "27 unsourced claims, and a content tool rather than market intelligence. Held until it either earns its numbers or moves out of the intelligence product." },
    ],
  },
];

/* ─── Derived views ──────────────────────────────────────────────── */

/** Every tab, held or not. Use for lookups, never for rendering nav. */
export const TABS = TAB_GROUPS.flatMap(g => g.tabs);

/** Tab keys a paying customer must never reach. */
export const HELD_TABS = new Set(TABS.filter(t => t.held).map(t => t.key));

/** Tab keys that ship. This is what "v1" means, in code. */
export const SHIPPED_TABS = TABS.filter(t => !t.held).map(t => t.key);

/**
 * Groups to render for a given viewer.
 *
 * Admins see everything, so held work can be checked on the live site.
 * Everyone else sees only shipped tabs, and a group that ends up empty is
 * dropped rather than rendered as a heading with nothing under it.
 */
export function groupsFor({ isAdmin = false } = {}) {
  if (isAdmin) return TAB_GROUPS;
  return TAB_GROUPS
    .map(g => ({ ...g, tabs: g.tabs.filter(t => !t.held) }))
    .filter(g => g.tabs.length > 0);
}

/**
 * Guard for any navigation target — a saved sessionStorage value, a ?tab=
 * query parameter, or an in-app button. Returns a tab this viewer is
 * allowed to open, falling back to Overview.
 *
 * Without this, a customer who had a held tab open before it was held
 * would reload straight onto a screen that is no longer sold.
 */
export function resolveTab(key, { isAdmin = false } = {}) {
  if (!key) return "Overview";
  const known = TABS.some(t => t.key === key);
  if (!known) return "Overview";
  if (HELD_TABS.has(key) && !isAdmin) return "Overview";
  return key;
}
