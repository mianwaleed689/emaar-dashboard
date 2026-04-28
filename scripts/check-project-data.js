const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const projects = await db.collection("projects").get();
  
  // Group by community and collect all fields
  const commMap = {};
  projects.docs.forEach(d => {
    const data = d.data();
    const comm = data.community || data.location || data.area || "";
    if (!comm) return;
    if (!commMap[comm]) commMap[comm] = { projects: [], prices: [], types: [] };
    commMap[comm].projects.push(data.name || d.id);
    if (data.priceMin) commMap[comm].prices.push(parseFloat(data.priceMin));
    if (data.priceMax) commMap[comm].prices.push(parseFloat(data.priceMax));
    if (data.type) commMap[comm].types.push(data.type);
  });

  console.log("=== COMMUNITY DATA FROM PROJECTS ===");
  Object.entries(commMap).forEach(([comm, data]) => {
    const minP = data.prices.length ? Math.min(...data.prices) : null;
    const maxP = data.prices.length ? Math.max(...data.prices) : null;
    console.log("\n", comm);
    console.log("  Projects:", data.projects.length);
    console.log("  Types:", [...new Set(data.types)].join(", "));
    console.log("  Price range:", minP ? "AED "+minP.toLocaleString() : "N/A", "—", maxP ? "AED "+maxP.toLocaleString() : "N/A");
    console.log("  Sample projects:", data.projects.slice(0,3).join(", "));
  });

  // Also check what fields a project doc has
  const sample = projects.docs[0].data();
  console.log("\n=== PROJECT FIELDS ===");
  console.log(Object.keys(sample).join(", "));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });