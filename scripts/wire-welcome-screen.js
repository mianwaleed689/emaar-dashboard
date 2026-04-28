const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// ── FIX 1: Import WelcomeScreen ──
const oldImports = `import TeamTab from '../tabs/TeamTab';`;
const newImports = `import TeamTab from '../tabs/TeamTab';
import WelcomeScreen from '../components/WelcomeScreen';`;

if (content.includes(oldImports)) {
  content = content.replace(oldImports, newImports);
  console.log("FIX 1 done — WelcomeScreen imported");
} else {
  console.log("FIX 1 — pattern not found");
}

// ── FIX 2: Add onboardingComplete state ──
const oldState = `  const [authLoading, setAuthLoading] = useState(true);`;
const newState = `  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [managerName, setManagerName] = useState("");`;

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
  console.log("FIX 2 done — showWelcome state added");
} else {
  // try alternate
  const alt = `const [authLoading, setAuthLoading] = useState(true);`;
  const idx = content.indexOf(alt);
  console.log("FIX 2 — trying alternate, found at line:", content.substring(0,idx).split("\n").length);
}

// ── FIX 3: Set showWelcome after user doc loaded ──
// Find where onboardingComplete would be checked — after orgRole is set
const oldOrgRole = `            setOrgRole(data.orgRole || null);`;
const newOrgRole = `            setOrgRole(data.orgRole || null);
            // Show welcome screen for first-time agents
            if (!data.onboardingComplete && data.orgRole === "agent") {
              setShowWelcome(true);
            }
            // Fetch manager name if agent
            if (data.managerId) {
              try {
                const mgrDoc = await getDoc(doc(db, "users", data.managerId));
                if (mgrDoc.exists()) setManagerName(mgrDoc.data().name || "");
              } catch(e) {}
            }`;

if (content.includes(oldOrgRole)) {
  content = content.replace(oldOrgRole, newOrgRole);
  console.log("FIX 3 done — onboarding check added");
} else {
  console.log("FIX 3 — orgRole pattern not found");
}

// ── FIX 4: Render WelcomeScreen before main app ──
// Find where the main dashboard JSX starts returning
const oldReturn = `  if (authLoading) return (`;
const newReturn = `  // Welcome screen for first-time agents
  if (showWelcome) return (
    <WelcomeScreen
      userName={userName}
      orgName={orgProfile?.name || ""}
      managerName={managerName}
      userId={firebaseUser?.uid}
      onDismiss={() => setShowWelcome(false)}
    />
  );

  if (authLoading) return (`;

if (content.includes(oldReturn)) {
  content = content.replace(oldReturn, newReturn);
  console.log("FIX 4 done — WelcomeScreen render added");
} else {
  console.log("FIX 4 — authLoading pattern not found");
  const idx = content.indexOf("authLoading");
  console.log("authLoading found at line:", content.substring(0,idx).split("\n").length);
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");