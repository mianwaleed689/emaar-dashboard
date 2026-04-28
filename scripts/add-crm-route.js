const fs = require("fs");
let content = fs.readFileSync("src/App.jsx", "latin1");

const oldRoute = `            <Route path="/agency/signup" element={<AgencySignup />} />`;
const newRoute = `            <Route path="/agency/signup" element={<AgencySignup />} />
            <Route path="/crm" element={<UserGuard><EmaarDashboardV2 defaultTab="My Leads" /></UserGuard>} />`;

if (content.includes(oldRoute)) {
  content = content.replace(oldRoute, newRoute);
  console.log("Done — /crm route added");
} else {
  console.log("Pattern not found");
}

fs.writeFileSync("src/App.jsx", content, "latin1");
console.log("Written");