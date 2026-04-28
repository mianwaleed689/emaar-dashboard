const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// ── FIX 3: Team members fetch for owner + director + manager ──
const oldTeam = `    if (!isLoggedIn || !firebaseUser || orgRole !== "manager" || !orgId) return;
    setTeamMembersLoading(true);
    const q = query(collection(db, "users"), where("orgId", "==", orgId));`;

const newTeam = `    const canSeeTeam = orgRole === "owner" || orgRole === "director" || orgRole === "manager";
    if (!isLoggedIn || !firebaseUser || !canSeeTeam || !orgId) return;
    setTeamMembersLoading(true);
    const q = query(collection(db, "users"), where("orgId", "==", orgId));`;

if (content.includes(oldTeam)) {
  content = content.replace(oldTeam, newTeam);
  console.log("FIX 3 done — team members fetch extended to owner + director");
} else {
  console.log("FIX 3 — pattern not found");
  const idx = content.indexOf('orgRole !== "manager"');
  if (idx > -1) {
    const lineNum = content.substring(0, idx).split("\n").length;
    console.log("Found at line:", lineNum);
    console.log("Context:", content.substring(idx - 100, idx + 200));
  }
}

// ── FIX 4: Remove liveLeads prop from MyLeadsTab ──
const oldProps = `              myLeads={myLeads} liveLeads={liveLeads}`;
const newProps = `              myLeads={myLeads}`;

if (content.includes(oldProps)) {
  content = content.replace(oldProps, newProps);
  console.log("FIX 4 done — liveLeads prop removed from MyLeadsTab");
} else {
  console.log("FIX 4 — liveLeads prop pattern not found");
}

// ── FIX 5: Add teamMembers prop to MyLeadsTab ──
// Check if already passed
if (content.includes("teamMembers={teamMembers}") && 
    content.substring(content.indexOf("<MyLeadsTab"), content.indexOf("<MyLeadsTab") + 2000).includes("teamMembers")) {
  console.log("FIX 5 — teamMembers already passed to MyLeadsTab");
} else {
  const oldMyLeadsClose = `              showMLAnalytics={showMLAnalytics} setShowMLAnalytics={setShowMLAnalytics}
              showMLTemplates={showMLTemplates} setShowMLTemplates={setShowMLTemplates}
              showQuickCapture={showQuickCapture} setShowQuickCapture={setShowQuickCapture}
            />`;
  const newMyLeadsClose = `              showMLAnalytics={showMLAnalytics} setShowMLAnalytics={setShowMLAnalytics}
              showMLTemplates={showMLTemplates} setShowMLTemplates={setShowMLTemplates}
              showQuickCapture={showQuickCapture} setShowQuickCapture={setShowQuickCapture}
              teamMembers={teamMembers}
              firebaseUser={firebaseUser}
            />`;
  if (content.includes(oldMyLeadsClose)) {
    content = content.replace(oldMyLeadsClose, newMyLeadsClose);
    console.log("FIX 5 done — teamMembers + firebaseUser added to MyLeadsTab");
  } else {
    console.log("FIX 5 — closing pattern not found");
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written successfully");