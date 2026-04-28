const fs = require("fs");
let content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");

// Hide leads tab from sidebar navigation
const oldLeadsNav = `{ id: "leads", label: "Leads", icon: I.leads },`;
const newLeadsNav = `// { id: "leads", label: "Leads", icon: I.leads }, // REMOVED — superAdmin uses dashboard CRM`;

if (content.includes(oldLeadsNav)) {
  content = content.replace(oldLeadsNav, newLeadsNav);
  console.log("Leads tab hidden from sidebar");
} else {
  console.log("Pattern not found — checking...");
  const idx = content.indexOf('"leads", label:"Leads"') || content.indexOf('"leads", label: "Leads"');
  console.log("Found at:", idx);
}

fs.writeFileSync("src/admin/AdminPanel.jsx", content, "latin1");
console.log("Written");