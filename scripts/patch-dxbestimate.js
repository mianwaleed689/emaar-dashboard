const fs = require("fs");
const p = "src/tabs/DXBEstimateTab.jsx";
let s = fs.readFileSync(p, "latin1");

// 1. Add import after existing imports
s = s.replace(
  `import { SvgIcons } from "../components/Icons";`,
  `import { SvgIcons } from "../components/Icons";\nimport { useUserFacingCommunities } from "../lib/communities";`
);

// 2. Add hook call inside function, after the useEffect block
s = s.replace(
  `            const BASE_PPSF = {`,
  `  const { data: firestoreCommunities = [] } = useUserFacingCommunities();\n\n            const BASE_PPSF = {`
);

// 3. Replace communities2 (dropdown list) to use Firestore, fall back to BASE_PPSF keys
s = s.replace(
  `            const communities2 = Object.keys(BASE_PPSF);`,
  `            const communities2 = firestoreCommunities.length > 0\n              ? firestoreCommunities.map(c => c.name)\n              : Object.keys(BASE_PPSF);`
);

// 4. Enrich communityData lookup — if BASE_PPSF has no entry, use Firestore avgPpsf as flat fallback
s = s.replace(
  `            const communityData = BASE_PPSF[avmCommunity] || {};`,
  `            const fsComm = firestoreCommunities.find(c => c.name === avmCommunity);\n            const communityData = BASE_PPSF[avmCommunity] || (fsComm?.avgPpsf ? { Apartment: { "1BR": fsComm.avgPpsf } } : {});`
);

fs.writeFileSync(p, s, "latin1");
console.log("Done. Verifying...");
const lines = fs.readFileSync(p, "latin1").split("\n");
lines.forEach((l, i) => {
  if (l.includes("useUserFacingCommunities") || l.includes("firestoreCommunities") || l.includes("communities2"))
    console.log(i + 1, l.trim());
});