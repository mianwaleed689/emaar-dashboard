const fs = require("fs");
const path = "src/tabs/NeighbourhoodsTab.jsx";
let src = fs.readFileSync(path, "latin1");

// 1. Remove SEED_DATA import
src = src.replace(
  `import SEED_DATA from "../utils/seedData";\n`,
  ``
);

// 2. Add communities hook import after the SharedUI import line
src = src.replace(
  `import { Section, Chart, CustomTooltip, DataBadge, TabSources } from "../components/SharedUI";`,
  `import { Section, Chart, CustomTooltip, DataBadge, TabSources } from "../components/SharedUI";\nimport { useUserFacingCommunities } from "../lib/communities";`
);

// 3. Add hook call inside the function, after the opening line
src = src.replace(
  `  /* Phase Tier-A: local tier filter (Verified / DLD Registry / All) */`,
  `  const { data: firestoreCommunities = [] } = useUserFacingCommunities();\n\n  /* Phase Tier-A: local tier filter (Verified / DLD Registry / All) */`
);

// 4. Replace SEED_DATA.communities fallback with Firestore data
src = src.replace(
  `const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : SEED_DATA.communities;`,
  `const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : firestoreCommunities;`
);

fs.writeFileSync(path, src, "latin1");
console.log("Done. Verifying changes...");

// Verify
const result = fs.readFileSync(path, "latin1");
const lines = result.split("\n");
lines.forEach((l, i) => {
  if (l.includes("SEED_DATA") || l.includes("firestoreCommunities") || l.includes("useUserFacingCommunities")) {
    console.log(i + 1, l.trim());
  }
});