const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Fix TeamTab props — add firebaseUser + orgId + orgName
const oldTeam = `            <TeamTab
              teamMembers={teamMembers} teamMembersLoading={teamMembersLoading}
              myLeads={myLeads} deals={deals} orgRole={orgRole}
            />`;

const newTeam = `            <TeamTab
              teamMembers={teamMembers} teamMembersLoading={teamMembersLoading}
              myLeads={myLeads} deals={deals} orgRole={orgRole}
              orgId={orgId} firebaseUser={firebaseUser}
              orgName={orgProfile?.name}
            />`;

if (content.includes(oldTeam)) {
  content = content.replace(oldTeam, newTeam);
  console.log("TeamTab props updated");
} else {
  console.log("Pattern not found — checking...");
  const idx = content.indexOf("teamMembers={teamMembers} teamMembersLoading");
  console.log("Found at char:", idx);
  const lineNum = content.substring(0,idx).split("\n").length;
  console.log("Line:", lineNum);
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");