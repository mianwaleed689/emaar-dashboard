const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function run() {
  console.log(APPLY ? "APPLYING CHANGES" : "DRY RUN");

  // ── 1. Extract unique orgs from users ───────────────────────────
  const users = await db.collection("users").get();
  const orgMap = {}; // orgId -> { managers, agents }

  users.docs.forEach(d => {
    const u = { id: d.id, ...d.data() };
    if (!u.orgId) return;
    if (!orgMap[u.orgId]) orgMap[u.orgId] = { managers: [], agents: [], members: [] };
    if (u.orgRole === "manager") orgMap[u.orgId].managers.push({ uid: u.id, name: u.name || "Manager", email: u.email || "" });
    if (u.orgRole === "agent")   orgMap[u.orgId].agents.push({ uid: u.id, name: u.name || "Agent", email: u.email || "" });
    orgMap[u.orgId].members.push(u.id);
  });

  console.log("\n=== ORGS TO CREATE ===");
  Object.entries(orgMap).forEach(([id, data]) => {
    console.log(`  ${id}: ${data.managers.length} managers, ${data.agents.length} agents`);
  });

  // ── 2. Create org docs ──────────────────────────────────────────
  for (const [orgId, data] of Object.entries(orgMap)) {
    const orgDoc = {
      id: orgId,
      name: orgId.replace(/org_/,"").replace(/_[a-z0-9]+$/,"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()),
      createdAt: new Date().toISOString(),
      plan: "trial",
      active: true,
      memberCount: data.members.length,
      managers: data.managers,
      agents: data.agents,
    };
    console.log(`\n  ${APPLY?"CREATE":"DRY"} org: ${orgId}`, JSON.stringify(orgDoc).substring(0,100));
    if (APPLY) await db.collection("orgs").doc(orgId).set(orgDoc, { merge: true });
  }

  // ── 3. Fix users — add missing orgRole, standardize role ────────
  console.log("\n=== USER FIXES ===");
  const fixes = [];
  users.docs.forEach(d => {
    const u = d.data();
    const fix = {};

    // Users with orgId but no orgRole — check if they have role=manager/agent
    if (u.orgId && !u.orgRole) {
      if (u.role === "manager") fix.orgRole = "manager";
      else if (u.role === "agent") fix.orgRole = "agent";
      else fix.orgRole = "agent"; // default
    }

    // Managers whose role is "user" not "manager" — fix platform role
    if (u.orgRole === "manager" && u.role === "user") {
      fix.role = "manager";
    }
    if (u.orgRole === "agent" && u.role === "user") {
      fix.role = "agent";
    }

    if (Object.keys(fix).length > 0) {
      fixes.push({ id: d.id, name: u.name, current: { role: u.role, orgRole: u.orgRole }, fix });
      console.log(`  ${APPLY?"FIX":"DRY"}: ${u.name} (${d.id.substring(0,8)}) — ${JSON.stringify(fix)}`);
      if (APPLY) db.collection("users").doc(d.id).update({ ...fix, updatedAt: new Date().toISOString() });
    }
  });

  console.log(`\n${fixes.length} users need fixing`);

  // ── 4. Create orgMembers subcollection for fast lookups ─────────
  if (APPLY) {
    for (const [orgId, data] of Object.entries(orgMap)) {
      for (const member of [...data.managers, ...data.agents]) {
        await db.collection("orgs").doc(orgId).collection("members").doc(member.uid).set({
          uid: member.uid,
          name: member.name,
          email: member.email,
          orgRole: data.managers.find(m=>m.uid===member.uid) ? "manager" : "agent",
          orgId,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
    console.log("Created orgMembers subcollections");
  }

  console.log("\n✅ Done");
  if (!APPLY) console.log("Run with --apply to execute");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });