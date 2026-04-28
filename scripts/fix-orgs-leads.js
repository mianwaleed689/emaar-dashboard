const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function run() {
  console.log(APPLY ? "APPLYING" : "DRY RUN");

  // ── FIX 1: Link orgs to their manager users ──────────────────
  const users = await db.collection("users").get();
  const orgs  = await db.collection("organisations").get();

  console.log("\n=== FIX 1: Org owner emails ===");
  for (const orgDoc of orgs.docs) {
    const org = orgDoc.data();
    if (org.ownerEmail) { console.log(" SKIP:", orgDoc.id, "— already has owner"); continue; }

    // Find manager user for this org
    const manager = users.docs.find(u => {
      const d = u.data();
      return d.orgId === orgDoc.id && (d.orgRole === "manager" || d.orgRole === "owner");
    });

    if (manager) {
      const m = manager.data();
      console.log(" FIX:", orgDoc.id, "—", org.name, "→ owner:", m.email, "uid:", manager.id);
      if (APPLY) {
        await db.collection("organisations").doc(orgDoc.id).update({
          ownerEmail: m.email || "",
          ownerId:    manager.id,
          updatedAt:  new Date().toISOString(),
        });
      }
    } else {
      console.log(" NO MANAGER FOUND for:", orgDoc.id);
    }
  }

  // ── FIX 2: Migrate lead status "New" → "New Lead" ────────────
  console.log("\n=== FIX 2: Lead status migration ===");
  
  // Map of old → new status names
  const STATUS_MAP = {
    "New":       "New Lead",
    "Contacted": "Potential",
    "Viewing":   "Potential",
    "Offer":     "EOI",
    "Won":       "Closed Deal",
    "Lost":      "Closed Outside",
  };

  const leads = await db.collection("leads").get();
  let toFix = 0;
  let fixed = 0;

  for (const leadDoc of leads.docs) {
    const status = leadDoc.data().status;
    if (STATUS_MAP[status]) {
      toFix++;
      const newStatus = STATUS_MAP[status];
      console.log(" FIX:", leadDoc.id.slice(-6), status, "→", newStatus);
      if (APPLY) {
        await db.collection("leads").doc(leadDoc.id).update({
          status:    newStatus,
          updatedAt: new Date().toISOString(),
        });
        fixed++;
      }
    }
  }

  console.log("\nLeads to fix:", toFix);
  if (APPLY) console.log("Leads fixed:", fixed);
  if (!APPLY) console.log("\nRun with --apply to execute");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });