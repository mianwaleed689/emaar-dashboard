const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Fix the broken devOptions
src = src.replace(
  `              : ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.d
            // commOptions: tier-organized community list (Session 5 hierarchy)
            // Pulls from Firestore via useUserFacingCommunities, groups by displayCategory.
            // Sub-communities show parent prefix (e.g. "Dubai Hills Estate > Maple 1").
            )];`,
  `              : ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.developer||"").filter(Boolean))];
            // commOptions: tier-organized community list (Session 5 hierarchy)
            // Pulls from Firestore via useUserFacingCommunities, groups by displayCategory.
            // Sub-communities show parent prefix (e.g. "Dubai Hills Estate > Maple 1").`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
console.log("Fixed");