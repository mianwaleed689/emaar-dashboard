const fs = require("fs");
let content = fs.readFileSync("src/tabs/TeamTab.jsx", "latin1");

const old = `  const canManage = orgRole==="owner"||orgRole==="director"||orgRole==="manager";`;
const neww = `  const canManage = orgRole==="owner"||orgRole==="director"||orgRole==="manager"||userRole==="superAdmin"||userRole==="admin";`;

if (content.includes(old)) {
  content = content.replace(old, neww);
  console.log("Fixed canManage to include superAdmin");
} else {
  console.log("Pattern not found");
}

// Also fix the function signature to accept userRole
const oldSig = `export default function TeamTab({ teamMembers=[], teamMembersLoading, myLeads=[], deals=[], orgRole, orgId, firebaseUser, orgName }) {`;
const newSig = `export default function TeamTab({ teamMembers=[], teamMembersLoading, myLeads=[], deals=[], orgRole, userRole, orgId, firebaseUser, orgName }) {`;

if (content.includes(oldSig)) {
  content = content.replace(oldSig, newSig);
  console.log("Added userRole prop to TeamTab");
} else {
  console.log("Signature pattern not found");
}

fs.writeFileSync("src/tabs/TeamTab.jsx", content, "latin1");
console.log("Written");