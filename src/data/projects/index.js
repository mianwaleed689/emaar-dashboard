/* ввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђ
   DXB ANALYTICS вв‚¬вЂќ PROJECT CATALOG
   ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
   Single source of truth for all projects.
   Each project lives in its own file under /data/projects/*.js
   Adding a new project = create file + add import below.
   ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
   Legacy compatibility: re-exports as `emaarProjects` array so existing
   imports like `import { emaarProjects } from './data'` keep working
   during the migration. Remove the alias once all consumers use
   `allProjects` or `projectById()`.
   ввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђввЂўђ */

import GolfGrand from "./emaar-golf-grand.js";
import TheGolfResidence from "./emaar-the-golf-residence.js";
import HillsPark from "./emaar-hills-park.js";

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ CANONICAL PROJECT CATALOG ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
export const allProjects = [
  GolfGrand,
  TheGolfResidence,
  HillsPark,
];

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ INDEXED LOOKUP (O(1) access) ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
export const projectsById = allProjects.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ HELPERS ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
export const projectById = (id) => projectsById[id] || null;

export const projectsByDeveloper = (developerId) =>
  allProjects.filter(p => p.developerId === developerId);

export const projectsByCommunity = (community) =>
  allProjects.filter(p => p.community === community);

export const projectsByLifecycle = (stage) =>
  allProjects.filter(p => p.lifecycleStage === stage);

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ AUDIT STATS (for admin overview) ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
export const catalogStats = {
  total: allProjects.length,
  verified: allProjects.filter(p => p._audit?.dataQuality === "high").length,
  unverified: allProjects.filter(p => p._audit?.dataQuality === "unverified").length,
  needsResearch: allProjects.filter(p => p._audit?.needsResearch).length,
};

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ LEGACY ALIAS (remove once all consumers migrated) ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
export const emaarProjects = allProjects;

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ DEFAULT EXPORT ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */
export default allProjects;
