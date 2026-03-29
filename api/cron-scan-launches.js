// api/cron-scan-launches.js
// Vercel Cron Job — runs every day at 6:00 AM UTC
// Scans Bayut for new project launches → saves NEW ones to Firestore automatically
// Schedule: "0 6 * * *" in vercel.json

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Init Firebase Admin (uses environment variables set in Vercel dashboard)
function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "dxb-analytics",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

const BAYUT_KEY = process.env.BAYUT_RAPIDAPI_KEY || process.env.BAYUT_RAPIDAPI_KEY;
const HEADERS = {
  "x-rapidapi-key": BAYUT_KEY,
  "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com",
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const DEV_MAP = {
  emaar: ["emaar"], damac: ["damac"], sobha: ["sobha"], nakheel: ["nakheel"],
  meraas: ["meraas"], binghatti: ["binghatti"], ellington: ["ellington"],
  azizi: ["azizi"], danube: ["danube"], aldar: ["aldar"], mag: ["mag"],
  nshama: ["nshama"], samana: ["samana"], imtiaz: ["imtiaz"], taraf: ["taraf"],
};

function detectDeveloper(devName = "") {
  const dl = devName.toLowerCase();
  for (const [id, keywords] of Object.entries(DEV_MAP)) {
    if (keywords.some(k => dl.includes(k))) return id;
  }
  return "other";
}

module.exports = async function handler(req, res) {
  // Vercel cron sends GET with authorization header
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getDb();
  const results = { scanned: 0, newProjects: 0, skipped: 0, errors: [] };

  try {
    // ── FETCH from Bayut (multi-category) ──────────────────────────────────
    const categories = [
      { id: "4", name: "Apartments" },
      { id: "3", name: "Villas" },
      { id: "16", name: "Townhouses" },
    ];

    const projectMap = {};

    for (const cat of categories) {
      for (let page = 0; page <= 2; page++) {
        try {
          const url = `https://unofficial-bayut-api.p.rapidapi.com/search?purpose=for-sale&categoryExternalID=${cat.id}&lang=en&sort=date-desc&page=${page}&hitsPerPage=50&completionStatus=off-plan&locationExternalIDs=5002`;
          const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
          if (!r.ok) break;
          const data = await r.json();
          const hits = data?.hits || [];
          if (!hits.length) break;
          results.scanned += hits.length;

          hits.forEach(h => {
            const name = h.project?.name || h.title?.split("|")[0]?.split("•")[0]?.trim();
            if (!name || name.length < 3) return;
            const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (!projectMap[key]) {
              const devName = h.agency?.name || h.project?.developer?.name || "";
              projectMap[key] = {
                projectName: name,
                name,
                developer: devName || "—",
                developerId: detectDeveloper(devName),
                community: h.location?.[h.location.length - 2]?.name || "—",
                priceFrom: h.price || 0,
                type: cat.name,
                beds: h.rooms > 0 ? String(h.rooms) : "1-3",
                handover: h.project?.completionDetails?.text || "—",
                payment: "—",
                construction: h.project?.percentCompleted || 0,
                branded: !!(h.project?.brand),
                brand: h.project?.brand || "—",
                source: "Bayut.com",
                sourceUrl: `https://www.bayut.com${h.slug || ""}`,
                addedViaRadar: true,
                addedByCron: true,
                addedAt: new Date().toISOString(),
              };
            }
          });

          if (hits.length < 50) break;
          await sleep(200);
        } catch (e) {
          results.errors.push(`Bayut ${cat.name} p${page}: ${e.message}`);
          break;
        }
      }
    }

    // ── Also fetch from /new-projects endpoint ─────────────────────────────
    try {
      const url = `https://unofficial-bayut-api.p.rapidapi.com/new-projects?locationExternalIDs=5002&lang=en&sort=date-desc&page=0&hitsPerPage=50`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const data = await r.json();
        const projects = data?.hits || data?.projects || [];
        projects.forEach(p => {
          const name = p.name || p.title || "";
          if (!name || name.length < 3) return;
          const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const devName = p.developer?.name || p.agency?.name || "";
          if (!projectMap[key]) {
            projectMap[key] = {
              projectName: name, name,
              developer: devName || "—",
              developerId: detectDeveloper(devName),
              community: p.location?.[p.location.length - 2]?.name || "—",
              priceFrom: p.minPrice || p.price || 0,
              type: p.category?.nameSingular || "Mixed",
              beds: p.minRooms ? `${p.minRooms}-${p.maxRooms || p.minRooms}` : "1-3",
              handover: p.completionDate || "—",
              payment: p.paymentPlan || "—",
              construction: p.percentCompleted || 0,
              branded: !!(p.brand),
              brand: p.brand || "—",
              source: "Bayut New Projects",
              sourceUrl: `https://www.bayut.com${p.slug || "/new-projects/dubai/"}`,
              addedViaRadar: true,
              addedByCron: true,
              addedAt: new Date().toISOString(),
            };
          }
        });
      }
    } catch (e) {
      results.errors.push(`Bayut NewProjects: ${e.message}`);
    }

    // ── CHECK EXISTING in Firestore — only save NEW ones ──────────────────
    const existingSnap = await db.collection("projects").get();
    const existingKeys = new Set();
    existingSnap.forEach(d => {
      const data = d.data();
      const key = (data.name || data.projectName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key) existingKeys.add(key);
    });

    // Also check radarLaunches collection
    const radarSnap = await db.collection("radarLaunches").get();
    radarSnap.forEach(d => {
      const data = d.data();
      const key = (data.name || data.projectName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key) existingKeys.add(key);
    });

    // ── LOAD curated project names from data (to detect true new projects) ──────
    // These are the known project names per developer — new ones get added, duplicates skipped
    const CURATED_NAMES = {
      emaar: new Set([
        "the golf residence","hills park","golf grand","parkside views","greenside residence",
        "club drive","golf hillside","park lane","palace residences hillside","greencrest",
        "vida residences hillside","parkwood","hillsedge","club place","rosehill","parkland",
        "the cove ii","creek waters","creek waters 2","oria","albero","montiva by vida","silva",
        "creek bay","creek haven","lyvia by palace","altan","address the bay","beachgate by address",
        "seapoint","bayview","bristol luxury residences","golf verge","golf meadow","terra gardens",
        "farm gardens","elora","selvara","equestra","equiterra","chevalia estate 2","selvara 3",
        "selvara 4","aurea","baystar by vida","mareva 2","avarra by palace","greencrest heights",
        "raya","palace beach residence","address villas hillcrest","golf meadows"
      ]),
      // Add curated names for other developers as their modules are built
    };

    // ── SAVE only genuinely new projects ──────────────────────────────────────
    const batch = db.batch();
    let batchCount = 0;

    for (const [key, project] of Object.entries(projectMap)) {
      if (existingKeys.has(key)) {
        results.skipped++;
        continue;
      }

      // Smart duplicate check — skip if name matches a curated project for this developer
      const curatedSet = CURATED_NAMES[project.developerId];
      const projectNameKey = (project.name || "").toLowerCase().trim();
      if (curatedSet && curatedSet.has(projectNameKey)) {
        results.skipped++;
        continue;
      }

      const docId = `${project.developerId}_${key.slice(0, 40)}`;
      const ref = db.collection("projects").doc(docId);
      batch.set(ref, { ...project, cronAddedAt: new Date().toISOString() });
      results.newProjects++;
      batchCount++;

      // Firestore batch limit is 500
      if (batchCount >= 490) break;
    }

    if (batchCount > 0) await batch.commit();

    // ── LOG the cron run ───────────────────────────────────────────────────
    await db.collection("cronLogs").add({
      type: "scan-launches",
      scanned: results.scanned,
      newProjects: results.newProjects,
      skipped: results.skipped,
      errors: results.errors,
      runAt: new Date().toISOString(),
    });

    // ── NOTIFY admin if new projects found ─────────────────────────────────
    if (results.newProjects > 0) {
      await db.collection("notifications").add({
        title: `🚀 ${results.newProjects} New Project${results.newProjects > 1 ? "s" : ""} Detected`,
        body: `Launch Radar auto-scan found ${results.newProjects} new project${results.newProjects > 1 ? "s" : ""} on Bayut. Check Admin → Data Manager → Launch Radar to review.`,
        type: "launch_radar",
        targetType: "admin",
        createdAt: new Date().toISOString(),
        read: false,
        autoScan: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Cron complete: ${results.newProjects} new projects added, ${results.skipped} already known`,
      ...results,
      runAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Cron scan error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
