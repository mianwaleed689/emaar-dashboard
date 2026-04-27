const fs = require("fs");
const path = "src/tabs/ProjectsTab.jsx";
let content = fs.readFileSync(path, "utf8");

// === Edit 1: Add import after line 16 (after constants import) ===
const oldImports = `import { calcScore, scoreColor, scoreLabel } from "../utils/scoring";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";`;

const newImports = `import { calcScore, scoreColor, scoreLabel } from "../utils/scoring";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";
import { useUserFacingCommunities } from "../lib/communities";`;

if (!content.includes(oldImports)) {
  console.error("FAIL: Imports block not found.");
  process.exit(1);
}
content = content.replace(oldImports, newImports);
console.log("Edit 1: Added useUserFacingCommunities import");

// === Edit 2: Add hook call inside component ===
// Find first opening brace of ProjectsTab body and add hook right after it.
const oldComponentStart = `function ProjectsTab({`;

if (!content.includes(oldComponentStart)) {
  console.error("FAIL: ProjectsTab function not found.");
  process.exit(1);
}

// Find end of destructuring (closing }) {
// Just inject after the opening brace of the function body.
// We look for the first `\\n}) {` after the function start.

const fnStart = content.indexOf(oldComponentStart);
const bodyOpen = content.indexOf("}) {", fnStart);
if (bodyOpen === -1) {
  console.error("FAIL: Could not find component body opening.");
  process.exit(1);
}

const insertPoint = bodyOpen + "}) {".length;
const hookCall = `\n  // Single source of truth for community data (Session 5 unification)\n  const { data: allCommunitiesFromDb = [] } = useUserFacingCommunities();\n`;

// Avoid double-insert if rerun
if (content.includes("allCommunitiesFromDb")) {
  console.log("Edit 2: Hook already present, skipping insert");
} else {
  content = content.slice(0, insertPoint) + hookCall + content.slice(insertPoint);
  console.log("Edit 2: Added hook call to ProjectsTab body");
}

// === Edit 3: Replace commOptions to use hook data ===
const oldCommOptions = `            const commOptions = ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean))].slice(0, 500);`;

const newCommOptions = `            // commOptions: full Firestore community list (user-facing only) merged with project-derived names\n            // Session 5: data source = communities collection via useUserFacingCommunities hook\n            const commNamesFromDb = (allCommunitiesFromDb || []).map(c => c.name).filter(Boolean);\n            const commNamesFromProjects = rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean);\n            const commOptions = ["All", ...new Set([...commNamesFromDb, ...commNamesFromProjects])].slice(0, 500);`;

if (!content.includes(oldCommOptions)) {
  console.error("FAIL: Old commOptions line not found exactly.");
  process.exit(1);
}
content = content.replace(oldCommOptions, newCommOptions);
console.log("Edit 3: commOptions now uses hook data + project data merged");

fs.writeFileSync(path, content, "utf8");
console.log("");
console.log("All edits applied to " + path);