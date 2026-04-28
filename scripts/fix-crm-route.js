const fs = require("fs");
let content = fs.readFileSync("src/App.jsx", "latin1");

// Update /crm route to use URL param instead of prop
const oldCrm = `            <Route path="/crm" element={<UserGuard><EmaarDashboardV2 defaultTab="My Leads" /></UserGuard>} />`;
const newCrm = `            <Route path="/crm" element={<CrmRedirect />} />`;

if (content.includes(oldCrm)) {
  content = content.replace(oldCrm, newCrm);
  console.log("Route updated");
} else {
  console.log("Pattern not found");
}

// Add CrmRedirect component before App function
const oldApp = `function App() {`;
const newApp = `function CrmRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard?tab=My%20Leads", { replace: true });
  }, [navigate]);
  return <Spinner />;
}

function App() {`;

if (content.includes(oldApp)) {
  content = content.replace(oldApp, newApp);
  console.log("CrmRedirect component added");
} else {
  console.log("App function not found");
}

fs.writeFileSync("src/App.jsx", content, "latin1");
console.log("Written");