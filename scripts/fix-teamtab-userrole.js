const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

const old = `            <TeamTab
              teamMembers={teamMembers} teamMembersLoading={teamMembersLoading}
              myLeads={myLeads} deals={deals} orgRole={orgRole}
              orgId={orgId} firebaseUser={firebaseUser}
              orgName={orgProfile?.name}
            />`;

const neww = `            <TeamTab
              teamMembers={teamMembers} teamMembersLoading={teamMembersLoading}
              myLeads={myLeads} deals={deals} orgRole={orgRole} userRole={userRole}
              orgId={orgId} firebaseUser={firebaseUser}
              orgName={orgProfile?.name}
            />`;

if (content.includes(old)) {
  content = content.replace(old, neww);
  console.log("userRole added to TeamTab props");
} else {
  console.log("Pattern not found");
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");