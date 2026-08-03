/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — COMPONENTS BARREL EXPORT
   Single import point: import { KPI, Section, ProGate } from './components'
   ═══════════════════════════════════════════════════════════════════ */

export { Icons, SvgIcons } from './Icons';

export {
  LoadingSkeleton, KPI, ForecastCard, Section, Chart, CustomTooltip,
  DataBadge, TabSources, EmptyState,
  ProGate, ProGateFullPage, UpgradeModal,
  PasswordStrength, useFocusTrap, TabErrorBoundary,
} from './SharedUI';

export { TAB_GROUPS, TABS, INTELLIGENCE_TABS } from './TabConfig';

/* LoginScreen was removed. EmaarDashboardV2.jsx defines its own LoginScreen at
   module scope, which shadowed this one — so the file here rendered for nobody
   while looking exactly like the login. It cost a real edit: the signup
   account-kind choice was written into this copy and had no effect on the
   product. Two implementations of the same screen is the same duplication that
   left three files quoting a price we had stopped charging. */
export { default as GlobalContextFilter } from './GlobalContextFilter';
