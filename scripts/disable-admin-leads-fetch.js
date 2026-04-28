const fs = require("fs");
let content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");

// Replace fetchLeads with a no-op — privacy rule: admin cannot see agency leads
const oldFetch = `const fetchLeads = useCallback(async (forceRefresh = false) => {
    setLeadsLoading(true);
    try {
      const cacheKey = "dxb_leads_v6";`;

const newFetch = `const fetchLeads = useCallback(async (forceRefresh = false) => {
    // DISABLED — SuperAdmin cannot see agency leads (privacy rule)
    // Agency leads are private to each org. Use dashboard CRM as agency owner.
    setLeadsLoading(false);
    setLeads([]);
    return;
    // eslint-disable-next-line no-unreachable
    setLeadsLoading(true);
    try {
      const cacheKey = "dxb_leads_v6";`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  console.log("fetchLeads disabled — privacy rule applied");
} else {
  console.log("Pattern not found");
  const idx = content.indexOf("const fetchLeads = useCallback");
  console.log("fetchLeads found at line:", content.substring(0,idx).split("\n").length);
}

fs.writeFileSync("src/admin/AdminPanel.jsx", content, "latin1");
console.log("Written");