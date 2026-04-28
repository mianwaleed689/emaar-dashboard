const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// ── FIX 2: Extend role-aware leads fetch for all 4 levels ──
const oldFetch = `  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    setMyLeadsLoading(true);
    // Agents see only their assigned leads; admins/managers see all org leads
    const isAgent = orgRole === "agent";
    const isManager = orgRole === "manager";
    let leadsQuery;
    if (isAgent) {
      leadsQuery = query(collection(db, "leads"), where("assignedTo", "==", firebaseUser.uid), orderBy("createdAt", "desc"), limit(200));
    } else if (isManager && orgId) {
      leadsQuery = query(collection(db, "leads"), where("orgId", "==", orgId), orderBy("createdAt", "desc"), limit(500));
    } else {
      setMyLeadsLoading(false);
      return; // regular users don't see leads tab
    }
    const unsub = onSnapshot(leadsQuery, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMyLeads(list);
      setMyLeadsLoading(false);
    }, (err) => { console.warn("[Leads]", err); setMyLeadsLoading(false); });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, orgId]);`;

const newFetch = `  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    setMyLeadsLoading(true);

    const role     = userRole  || "user";
    const oRole    = orgRole   || "";
    const uid      = firebaseUser.uid;
    const isSuperAdmin = role === "superAdmin" || role === "admin";
    const isOwner      = oRole === "owner";
    const isDirector   = oRole === "director";
    const isManager    = oRole === "manager";
    const isAgent      = oRole === "agent";

    let leadsQuery;

    if (isSuperAdmin) {
      // SuperAdmin sees all leads across all orgs (admin analytics only — no privacy breach)
      leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(500));
    } else if ((isOwner || isDirector || isManager) && orgId) {
      // Owner, Director, Manager: see all leads in their org
      leadsQuery = query(collection(db, "leads"), where("orgId", "==", orgId), orderBy("createdAt", "desc"), limit(500));
    } else if (isAgent) {
      // Agent: sees only their assigned leads
      leadsQuery = query(collection(db, "leads"), where("assignedTo", "==", uid), orderBy("createdAt", "desc"), limit(200));
    } else {
      // Regular platform user — no CRM access
      setMyLeadsLoading(false);
      return;
    }

    const unsub = onSnapshot(leadsQuery, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMyLeads(list);
      setMyLeadsLoading(false);
    }, (err) => { console.warn("[Leads]", err); setMyLeadsLoading(false); });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, userRole, orgId]);`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  console.log("FIX 2 done — role-aware leads fetch updated");
} else {
  console.log("FIX 2 — exact match not found, trying fuzzy...");
  const idx = content.indexOf("Agents see only their assigned leads");
  if (idx > -1) {
    const lineNum = content.substring(0, idx).split("\n").length;
    console.log("Found comment at line", lineNum);
  } else {
    console.log("Not found at all");
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");