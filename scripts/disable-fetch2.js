const fs = require("fs");
let content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");

// Find fetchLeads and insert early return after setLeadsLoading(true)
const old = "  const fetchLeads = useCallback(async (forceRefresh = false) => {\r\n    setLeadsLoading(true);\r\n    try {\r\n      const cacheKey = \"dxb_leads_v6\";";
const neww = "  const fetchLeads = useCallback(async (forceRefresh = false) => {\r\n    // DISABLED: SuperAdmin cannot see agency leads — privacy rule\r\n    setLeadsLoading(false); setLeads([]); return;\r\n    setLeadsLoading(true);\r\n    try {\r\n      const cacheKey = \"dxb_leads_v6\";";

if (content.includes(old)) {
  content = content.replace(old, neww);
  console.log("fetchLeads disabled");
} else {
  console.log("Not found — trying without \\r...");
  const old2 = "  const fetchLeads = useCallback(async (forceRefresh = false) => {\n    setLeadsLoading(true);\n    try {\n      const cacheKey = \"dxb_leads_v6\";";
  if (content.includes(old2)) {
    content = content.replace(old2, neww.replace(/\r\n/g,"\n"));
    console.log("fetchLeads disabled (unix line endings)");
  } else {
    console.log("Still not found");
  }
}

fs.writeFileSync("src/admin/AdminPanel.jsx", content, "latin1");
console.log("Written");