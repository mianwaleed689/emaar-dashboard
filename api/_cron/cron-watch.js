/**
 * THE NIGHTLY SWEEP.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Eleven of the fifteen notification events describe things that happen because
 * time passed — a broker card approaching expiry, a permit lapsing, an NOC going
 * stale, a lead nobody answered, a deal that stopped moving. They were built and
 * tested and had nothing to trigger them.
 *
 * All the judgement lives in src/crm/model/watch.js, which is pure and has 33
 * assertions behind it. This file is the plumbing: read each agency's data, ask
 * what is due, write it, remember what was sent.
 *
 * WHY IT REMEMBERS
 * ────────────────
 * A broker card ninety days out would otherwise be ninety identical messages.
 * Each notification carries a dedupeKey naming exactly which warning it is
 * ("brn_expiring:ag1:30"), those keys are stored per agency, and the sweep is
 * given them on the next run. That also makes this safe to run twice, which
 * matters because a cron that failed halfway is the normal case.
 *
 * RUNS PER AGENCY, NOT ACROSS THE PLATFORM
 * ────────────────────────────────────────
 * Every read is scoped by orgId. A sweep that queried collections globally and
 * then sorted the results would be one bad filter away from telling one agency
 * about another's deals.
 */
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

let modelPromise = null;
const model = () => (modelPromise = modelPromise || import("../../src/crm/model/watch.js"));

function database() {
  if (!getApps().length) {
    const key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!key || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL is not set, " +
                      "so the nightly sweep cannot run.");
    }
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID || "dxb-analytics",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  key,
      }),
    });
  }
  return getFirestore();
}

/* Firestore caps a batch at 500 writes. */
const CHUNK = 400;

/** Keys already notified for one agency. Kept as one document per agency so a
    sweep reads once rather than querying every notification ever written. */
async function sentKeysFor(db, orgId) {
  try {
    const doc = await db.collection("cronState").doc(`watch_${orgId}`).get();
    return new Set(doc.data()?.keys || []);
  } catch {
    /* Without the memory the sweep would repeat everything. Better to skip this
       agency for one night than to send them ninety duplicate messages. */
    return null;
  }
}

async function rememberKeys(db, orgId, keys) {
  /* Only the last few thousand are kept. A key for a card that expired two
     years ago will never be produced again, so holding it forever grows a
     document that eventually breaks the 1 MB limit. */
  const trimmed = keys.slice(-4000);
  await db.collection("cronState").doc(`watch_${orgId}`).set({
    keys: trimmed, count: trimmed.length, sweptAt: new Date().toISOString(),
  });
}

module.exports = async function handler(req, res) {
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let db;
  try { db = database(); }
  catch (err) {
    console.error("[watch]", err.message);
    return res.status(503).json({ error: err.message });
  }

  const startedAt = new Date().toISOString();
  const now = Date.now();
  console.log("[watch] started");

  const summary = { organisations: 0, notifications: 0, skipped: [], errors: [] };

  try {
    const { sweep, sweepSummary } = await model();

    const orgs = await db.collection("organisations").get();
    if (orgs.empty) {
      console.log("[watch] no organisations — nothing to sweep");
      return res.status(200).json({ ok: true, note: "No organisations yet.", ...summary });
    }

    for (const orgDoc of orgs.docs) {
      const orgId = orgDoc.id;
      try {
        const sent = await sentKeysFor(db, orgId);
        if (sent === null) {
          /* Skipping is the safe failure. Sweeping without the memory would
             re-send every warning this agency has ever had. */
          console.error(`[watch] ${orgId}: could not read what was already sent — skipped ` +
                        "rather than risk re-sending everything.");
          summary.skipped.push(orgId);
          continue;
        }

        const [people, deals, listings, leads, viewings] = await Promise.all([
          db.collection("users").where("orgId", "==", orgId).get(),
          db.collection("deals").where("orgId", "==", orgId).get(),
          db.collection("listings").where("orgId", "==", orgId).get(),
          db.collection("leads").where("orgId", "==", orgId).get(),
          db.collection("viewings").where("orgId", "==", orgId).get(),
        ]);

        const data = {
          org: { ...orgDoc.data(), id: orgId },
          people: people.docs.map(d => {
            const u = d.data();
            return {
              id: u.uid || d.id, name: u.name || u.email || "Unnamed",
              department: u.department ||
                (u.orgRole === "owner" || u.orgRole === "director" ? "management" : "sales"),
              seniority: u.seniority, managerId: u.managerId, expiries: u.expiries || {},
            };
          }),
          deals:    deals.docs.map(d => ({ id: d.id, ...d.data() })),
          listings: listings.docs.map(d => ({ id: d.id, ...d.data() })),
          leads:    leads.docs.map(d => ({ id: d.id, ...d.data() })),
          viewings: viewings.docs.map(d => ({ id: d.id, ...d.data() })),
        };

        const due = sweep(data, sent, now);
        summary.organisations++;

        if (due.length) {
          for (let i = 0; i < due.length; i += CHUNK) {
            const batch = db.batch();
            due.slice(i, i + CHUNK).forEach(n => {
              batch.set(db.collection("notifications").doc(), { ...n, orgId });
            });
            await batch.commit();
          }
          await rememberKeys(db, orgId, [...sent, ...due.map(n => n.dedupeKey)]);
          summary.notifications += due.length;
        }

        console.log(`[watch] ${orgId}: ${sweepSummary(due)} ` +
                    `(${data.people.length} people, ${data.deals.length} deals, ` +
                    `${data.listings.length} listings, ${data.leads.length} leads, ` +
                    `${data.viewings.length} viewings)`);
      } catch (err) {
        console.error(`[watch] ${orgId} failed:`, err.message);
        summary.errors.push(`${orgId}: ${err.message}`);
      }
    }

    await db.collection("cronLogs").add({ type: "watch", ...summary, syncedAt: startedAt });

    console.log(`[watch] done — ${summary.organisations} agencies, ` +
                `${summary.notifications} notifications, ${summary.errors.length} errors`);
    return res.status(200).json({ ok: true, ...summary });
  } catch (err) {
    console.error("[watch] failed:", err);
    return res.status(500).json({ error: String(err.message) });
  }
};
