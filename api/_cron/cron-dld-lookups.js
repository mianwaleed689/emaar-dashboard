/**
 * DAILY REFRESH OF THE FREE LAND DEPARTMENT LOOKUPS.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS REPLACES THE OLD JOB
 * ─────────────────────────────
 * `cron-dld-daily.js` authenticates against Dubai Pulse with DLD_API_KEY and
 * DLD_API_SECRET. Neither exists in this project's environment, so it threw at
 * its ninety-second line and returned 500 — every day at 03:00, since it was
 * written. Dubai Pulse has since migrated to data.dubai and that OAuth flow is
 * gone regardless.
 *
 * WHAT IS ACTUALLY AVAILABLE FOR FREE
 * ───────────────────────────────────
 * The Land Department runs a JSON gateway that needs no key and no account.
 * Verified against production on 2026-08-03 with a plain request and an empty
 * body:
 *
 *     POST gateway.dubailand.gov.ae/open-data/carea-lookup     -> every area
 *     POST gateway.dubailand.gov.ae/open-data/projects-lookup  -> every project
 *
 * TRANSACTIONS ARE NOT AVAILABLE THIS WAY. Those endpoints exist — they answer
 * 420 INVALID_REQUEST rather than 404 — but they are routed through a reCAPTCHA
 * proxy, which their own script confirms and their page reports as "Invalid
 * captcha". No unattended job can read them. Transactions come from the manual
 * export, and B-18 in LAUNCH_READINESS.md records why.
 *
 * So this job keeps the REGISTER current — new projects, new areas — which is
 * the "what is coming" half of the market picture, at no cost. It does not
 * pretend to do the other half.
 */
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID || "dxb-analytics",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

const GATEWAY = "https://gateway.dubailand.gov.ae/open-data";

/* The gateway answers a plain request; these headers only make it look like the
   page that normally calls it, which costs nothing and avoids surprises. */
const HEADERS = {
  "Content-Type": "application/json",
  "Origin":  "https://dubailand.gov.ae",
  "Referer": "https://dubailand.gov.ae/en/open-data/real-estate-data/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

async function lookup(command) {
  const res = await fetch(`${GATEWAY}/${command}`, {
    method: "POST", headers: HEADERS, body: "{}",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`${command}: HTTP ${res.status}`);
  const json = await res.json();
  /* The gateway returns 200 with a responseCode inside the body, so an HTTP 200
     alone does not mean success. */
  if (json.responseCode !== 200) {
    const first = (json.validationErrorsList || [])[0];
    throw new Error(`${command}: responseCode ${json.responseCode}` +
                    (first ? ` — ${first.errorMessage}` : ""));
  }
  const rows = json?.response?.result;
  if (!Array.isArray(rows)) throw new Error(`${command}: no result array`);
  return rows;
}

module.exports = async function handler(req, res) {
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const startedAt = new Date().toISOString();
  console.log("[dld-lookups] started");

  const out = { areas: 0, projects: 0, newProjects: 0, errors: [] };

  /* ── AREAS ──────────────────────────────────────────────────────────────── */
  try {
    const areas = await lookup("carea-lookup");
    out.areas = areas.length;
    await db.collection("tabData").doc("dldAreas").set({
      areas: areas.map(a => ({ id: a.AREA_ID, en: a.NAME_EN, ar: a.NAME_AR })),
      count: areas.length,
      source: "Dubai Land Department area register",
      syncedAt: startedAt,
    });
    console.log(`[dld-lookups] areas: ${areas.length}`);
  } catch (err) {
    out.errors.push(String(err.message));
    console.error("[dld-lookups] areas failed:", err.message);
  }

  /* ── PROJECTS ───────────────────────────────────────────────────────────── */
  try {
    const projects = await lookup("projects-lookup");
    out.projects = projects.length;

    /* Which of these are new since the last run? That is the whole point of a
       daily job — a project appearing on the register is a launch. */
    let known = new Set();
    try {
      const prev = await db.collection("tabData").doc("dldProjects").get();
      known = new Set((prev.data()?.ids) || []);
    } catch { /* first run — everything is new, which is not worth reporting */ }

    const ids = projects.map(p => p.ID);
    const fresh = known.size ? projects.filter(p => !known.has(p.ID)) : [];
    out.newProjects = fresh.length;

    await db.collection("tabData").doc("dldProjects").set({
      count: projects.length,
      ids,
      newest: fresh.slice(0, 40).map(p => ({ id: p.ID, en: p.NAME_EN, ar: p.NAME_AR })),
      newSinceLastRun: fresh.length,
      source: "Dubai Land Department project register",
      syncedAt: startedAt,
    });
    console.log(`[dld-lookups] projects: ${projects.length}` +
                (known.size ? `, ${fresh.length} new since last run` : ", first run"));
  } catch (err) {
    out.errors.push(String(err.message));
    console.error("[dld-lookups] projects failed:", err.message);
  }

  if (out.errors.length === 2) {
    console.error("[dld-lookups] BOTH lookups failed — the register did not " +
                  "refresh. The gateway may have changed or gone behind the " +
                  "same captcha as transactions.");
    return res.status(500).json({ ok: false, ...out });
  }

  await db.collection("cronLogs").add({ type: "dld-lookups", ...out, syncedAt: startedAt });

  console.log(`[dld-lookups] done — ${out.areas} areas, ${out.projects} projects, ` +
              `${out.newProjects} new`);
  return res.status(200).json({
    ok: true,
    note: "Transactions are not included: those endpoints are reCAPTCHA-gated " +
          "and cannot be read unattended. See B-18 in LAUNCH_READINESS.md.",
    ...out,
  });
};
