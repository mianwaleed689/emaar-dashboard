/* ═══════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — PROJECT CATALOG
   ─────────────────────────────────────────────────────────────────────────
   Single source of truth for all projects.
   Each project lives in its own file under /data/projects/*.js
   Adding a new project = create file + add import below.
   ─────────────────────────────────────────────────────────────────────────
   Legacy compatibility: re-exports as `emaarProjects` array so existing
   imports like `import { emaarProjects } from './data'` keep working
   during the migration. Remove the alias once all consumers use
   `allProjects` or `projectById()`.
   ═══════════════════════════════════════════════════════════════════════ */

import GolfGrand from "./emaar-golf-grand.js";
import TheGolfResidence from "./emaar-the-golf-residence.js";
import HillsPark from "./emaar-hills-park.js";

/* ─── CANONICAL PROJECT CATALOG ─── */
export const allProjects = [
  GolfGrand,
  TheGolfResidence,
  HillsPark,
];

/* ─── INDEXED LOOKUP (O(1) access) ─── */
export const projectsById = allProjects.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

/* ─── HELPERS ─── */
export const projectById = (id) => projectsById[id] || null;

export const projectsByDeveloper = (developerId) =>
  allProjects.filter(p => p.developerId === developerId);

export const projectsByCommunity = (community) =>
  allProjects.filter(p => p.community === community);

export const projectsByLifecycle = (stage) =>
  allProjects.filter(p => p.lifecycleStage === stage);

/* ─── AUDIT STATS (for admin overview) ─── */
export const catalogStats = {
  total: allProjects.length,
  verified: allProjects.filter(p => p._audit?.dataQuality === "high").length,
  unverified: allProjects.filter(p => p._audit?.dataQuality === "unverified").length,
  needsResearch: allProjects.filter(p => p._audit?.needsResearch).length,
};

/* ─── LEGACY ALIAS (remove once all consumers migrated) ─── */
export const emaarProjects = allProjects;

/* ─── DEFAULT EXPORT ─── */
export default allProjects;
