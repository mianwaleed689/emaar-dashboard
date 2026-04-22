/**
 * DXB ANALYTICS — PROJECT CONTEXT SYSTEM
 * =========================================
 * File: src/utils/projectContext.js
 *
 * THE ONE-PROJECT CONNECTION SYSTEM
 * 
 * This is the glue between every tab and the selected project.
 * When a user clicks any action button on a project card,
 * this system pre-fills the destination tab with that project's data.
 *
 * Pattern:
 *   1. User clicks "Handover" button on Golf Grand card
 *   2. navigateToTab('handover', BASE_PROJECT) is called
 *   3. Handover tab opens pre-filtered to show Golf Grand
 *   4. User sees Golf Grand's construction timeline immediately
 *
 * Every tab that reads from this context will auto-update
 * when the active project changes.
 */

import { BASE_PROJECT } from '../data/dubai_complete_foundation';

// ─── TAB KEY MAP ─────────────────────────────────────────────────────────────
// Maps tab IDs used in EmaarDashboardV2 to connection keys in BASE_PROJECT
export const TAB_KEY_MAP = {
  'Handover':         'handover',
  'Mortgage':         'mortgage',
  'Yields':           'yields',
  'Investment Score': 'investment_score',
  'DLD Volumes':      'dld_volumes',
  'Price History':    'price_history',
  'Flip':             'flip',
  'Neighbourhoods':   'communities',
  'Developer Health': 'developer',
  'Financials':       'financials',
  'Service Charges':  'service_charges',
  'Risk':             'risk',
  'Map':              'map',
  'STR vs LTR':       'str_ltr',
  'Portfolio':        'portfolio',
  'My Leads':         'leads',
  'Banking':          'banking',
  'Pipeline':         'pipeline',
  'Launch Calendar':  'launch_calendar',
};

// ─── NAVIGATION FUNCTION ─────────────────────────────────────────────────────
/**
 * Navigate to a tab with the project pre-loaded.
 * 
 * Usage in any tab component:
 *   <button onClick={() => navigateToTab('Handover', project, handleTabChange, setProjectContext)}>
 *     View Handover
 *   </button>
 * 
 * @param {string} tabName - The display name of the tab to navigate to
 * @param {object} project - The project object (or BASE_PROJECT)
 * @param {function} handleTabChange - The tab change function from EmaarDashboardV2
 * @param {function} setProjectContext - State setter for active project context
 */
export function navigateToTab(tabName, project, handleTabChange, setProjectContext) {
  // Set the active project context so destination tab reads it
  if (setProjectContext) {
    setProjectContext(project);
  }
  // Navigate to the tab
  if (handleTabChange) {
    handleTabChange(tabName);
  }
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── CONTEXT READER ──────────────────────────────────────────────────────────
/**
 * Get the pre-fill data for a specific tab based on active project.
 * 
 * Usage at the top of any tab component:
 *   const prefill = getTabPrefill('handover', activeProject);
 *   // prefill.filter.community === "Dubai Hills Estate"
 * 
 * @param {string} tabKey - The connection key (e.g. 'handover', 'mortgage')
 * @param {object} project - The active project (defaults to BASE_PROJECT)
 */
export function getTabPrefill(tabKey, project = BASE_PROJECT) {
  const connections = project?.tabConnections || BASE_PROJECT.tabConnections;
  return connections[tabKey] || null;
}

// ─── PROJECT CARD ACTIONS ────────────────────────────────────────────────────
/**
 * All action buttons that appear on every project card.
 * Each defines: label, tab to navigate to, icon, color
 * 
 * Usage in ProjectsTab card rendering:
 *   {PROJECT_CARD_ACTIONS.map(action => (
 *     <button
 *       key={action.key}
 *       onClick={() => navigateToTab(action.tab, project, handleTabChange, setProjectContext)}
 *       style={{ color: action.color }}
 *     >
 *       {action.label}
 *     </button>
 *   ))}
 */
export const PROJECT_CARD_ACTIONS = [
  { key: 'handover',    label: 'Handover',        tab: 'Handover',         color: '#10B981', description: 'Construction progress & timeline'     },
  { key: 'mortgage',    label: 'Mortgage',         tab: 'Banking',          color: '#3B82F6', description: 'Calculate mortgage for this project'  },
  { key: 'roi',         label: 'ROI Score',        tab: 'Investment Score', color: '#D4A843', description: 'Full investment score breakdown'       },
  { key: 'yields',      label: 'Yields',           tab: 'Yields',           color: '#8B5CF6', description: 'Rental yield data for this community'  },
  { key: 'map',         label: 'Map',              tab: 'Map',              color: '#0EA5E9', description: 'View project location'                 },
  { key: 'developer',   label: 'Developer',        tab: 'Developer Health', color: '#F59E0B', description: 'Developer health score'                },
  { key: 'risk',        label: 'Risk',             tab: 'Risk',             color: '#EF4444', description: 'Risk assessment'                       },
  { key: 'add_lead',    label: 'Add Lead',         tab: 'My Leads',         color: '#14B8A6', description: 'Add a lead for this project'           },
  { key: 'flip',        label: 'Flip Calc',        tab: 'Flip',             color: '#EC4899', description: 'Flip / resale potential'               },
  { key: 'dld',         label: 'DLD Data',         tab: 'DLD Volumes',      color: '#6366F1', description: 'DLD transaction data'                  },
  { key: 'service',     label: 'Service Charges',  tab: 'Service Charges',  color: '#92400E', description: 'Service charge rates'                  },
  { key: 'str_ltr',     label: 'STR vs LTR',       tab: 'STR vs LTR',       color: '#7C3AED', description: 'Rental strategy comparison'            },
  { key: 'portfolio',   label: 'Add to Portfolio', tab: 'Portfolio',        color: '#D4A843', description: 'Add to your portfolio tracker'         },
];

// ─── THE BUTTON STRIP COMPONENT ──────────────────────────────────────────────
/**
 * React component: renders the action button strip on project cards.
 * Primary actions (most used) shown inline, secondary in a "More" dropdown.
 *
 * PRIMARY ACTIONS (always visible): Handover, Mortgage, ROI Score, Add Lead
 * SECONDARY ACTIONS (in "More" dropdown): everything else
 */
export const PRIMARY_ACTIONS = ['handover', 'mortgage', 'roi', 'add_lead'];
export const SECONDARY_ACTIONS = PROJECT_CARD_ACTIONS
  .filter(a => !PRIMARY_ACTIONS.includes(a.key));

