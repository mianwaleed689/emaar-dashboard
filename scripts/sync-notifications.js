/**
 * sync-notifications.js
 * 
 * Reads latest sync_log and writes important changes
 * to the notifications collection so all users see them.
 * 
 * Run after auto-sync: node scripts/sync-notifications.js
 * Or add to scheduler after auto-sync.
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const today = new Date().toISOString().split("T")[0];
  console.log("Reading sync log for", today);

  const logDoc = await db.collection("sync_logs").doc(today).get();
  if (!logDoc.exists) {
    console.log("No sync log for today yet");
    process.exit(0);
  }

  const log = logDoc.data();
  const changes = log.changes || [];

  const notifications = [];
  const batch = db.batch();

  changes.forEach(c => {
    const ch = c.changes || {};

    // Project COMPLETED
    if (ch.constructionPct && ch.constructionPct.includes("→ 100")) {
      notifications.push({
        type: "completed",
        icon: "✅",
        title: `${c.name} is now COMPLETE`,
        body: `Construction reached 100%. DLD status: Ready.`,
        projectName: c.name,
        projectNumber: c.projectNumber,
        priority: "high",
      });
    }

    // Project CANCELLED
    if (ch.status && ch.status.includes("Cancelled")) {
      notifications.push({
        type: "cancelled",
        icon: "⚠️",
        title: `${c.name} has been CANCELLED`,
        body: `DLD has marked this project as Cancelled. Check your leads.`,
        projectName: c.name,
        projectNumber: c.projectNumber,
        priority: "urgent",
      });
    }

    // Big construction jump (10%+)
    if (ch.constructionPct) {
      const match = ch.constructionPct.match(/(\d+\.?\d*)%\s*→\s*(\d+\.?\d*)%/);
      if (match) {
        const from = parseFloat(match[1]);
        const to = parseFloat(match[2]);
        if (to - from >= 10) {
          notifications.push({
            type: "progress",
            icon: "🏗",
            title: `${c.name} — major progress`,
            body: `Construction jumped from ${Math.round(from)}% to ${Math.round(to)}%`,
            projectName: c.name,
            projectNumber: c.projectNumber,
            priority: "normal",
          });
        }
      }
    }
  });

  // NEW PROJECT LAUNCHES
  const todayStart = new Date(today + 'T00:00:00.000Z');
  const newSnap = await db.collection('projects').where('createdAt', '>=', todayStart).get();
  if (newSnap.size > 0) {
    const names = newSnap.docs.slice(0, 3).map(d => d.data().name || d.data().project || 'Unknown').join(', ');
    const projectNumbers = newSnap.docs.map(d => d.data().projectNumber || d.data().dldProjectNumber).filter(Boolean);
    const more = newSnap.size > 3 ? ' and ' + (newSnap.size - 3) + ' more...' : '';
    notifications.push({
      type: 'new_launch',
      projectNumbers: projectNumbers,
      icon: '🚀',
      title: newSnap.size + ' new project' + (newSnap.size > 1 ? 's' : '') + ' discovered today',
      body: names + more,
      priority: 'high',
    });
  }

    if (notifications.length === 0) {
    console.log("No important changes to notify");
    process.exit(0);
  }

  // Write to Firestore notifications collection
  notifications.forEach(n => {
    const docId=[today,n.type,(n.projectName||"global")].join("_").replace(/[^a-zA-Z0-9_-]/g,"_").substring(0,100); const ref=db.collection("notifications").doc(docId);
    batch.set(ref, {
      ...n,
      userId: "all",
      read: false,
      createdAt: new Date().toISOString(),
      source: "dld-auto-sync",
      date: today,
    });
  });

  await batch.commit();
  console.log(`Written ${notifications.length} notifications:`);
  notifications.forEach(n => console.log(` ${n.icon} ${n.title}`));
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
