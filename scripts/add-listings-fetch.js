const fs = require('fs');
let c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const lines = c.split('\n');

// Find DEALS PIPELINE LISTENER line
const dealsIdx = lines.findIndex(l => l.includes('DEALS PIPELINE LISTENER'));
console.log('Deals listener at line:', dealsIdx + 1);

// Insert listings listener before deals listener
const listingsListener = `
  /* LISTINGS LISTENER */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    const uid = firebaseUser.uid;
    const isSuperAdmin = userRole === "superAdmin" || userRole === "admin";
    const isOwnerOrManager = orgRole === "owner" || orgRole === "director" || orgRole === "manager";
    import("firebase/firestore").then(({ collection, query, where, orderBy, onSnapshot, getFirestore }) => {
      const fdb = getFirestore();
      let q;
      if (isSuperAdmin) {
        // SuperAdmin sees no agency listings — privacy rule
        setListings([]);
        setListingsLoading(false);
        return;
      } else if (isOwnerOrManager && orgId) {
        q = query(collection(fdb, "listings"), where("orgId", "==", orgId), orderBy("createdAt", "desc"));
      } else {
        q = query(collection(fdb, "listings"), where("agentId", "==", uid), orderBy("createdAt", "desc"));
      }
      setListingsLoading(true);
      const unsub = onSnapshot(q, snap => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setListings(list);
        setListingsLoading(false);
      }, err => { console.warn("[Listings]", err); setListingsLoading(false); });
      return () => unsub();
    });
  }, [isLoggedIn, firebaseUser, orgRole, userRole, orgId]);

`;

lines.splice(dealsIdx, 0, listingsListener);
fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', lines.join('\n'), 'utf8');
console.log('Listings listener added. Line count:', lines.length);
