/**
 * DXB Analytics - Consolidated Cron Router
 * File: api/cron.js
 *
 * Routes to individual cron job handlers by ?job=<name>
 * This exists because Vercel Hobby tier limits deployments to 12
 * serverless functions. Rather than pay for Pro, we consolidate.
 *
 * Schedules are declared in vercel.json with paths like:
 *   "path": "/api/cron?job=currency"
 *
 * Individual handler files still live in api/_cron/*.js (underscore
 * prefix = not deployed as its own function, only reachable via this
 * router). Each handler file exports its original module.exports
 * signature so zero behavioural change.
 *
 * All handlers are CRON_SECRET protected. The router verifies the
 * Bearer token once, up front, before dispatching.
 */

const HANDLERS = {

  eibor:          () => require("./_cron/cron-eibor.js"),
  "dld-daily":    () => require("./_cron/cron-dld-daily.js"),
  financials:     () => require("./_cron/cron-financials.js"),
  yields:         () => require("./_cron/cron-yields.js"),
  "sync-market":  () => require("./_cron/cron-sync-market.js"),
  "scan-launches":() => require("./_cron/cron-scan-launches.js"),
  "weekly-digest":() => require("./_cron/weekly-digest.js"),
  /* Pre-aggregates the developer brand list into a single document so the
     browser reads 1 doc instead of all 2,034 developer records per page load. */
  "developer-brands": () => require("./_cron/cron-developer-brands.js"),
  /* Packs the 1,728-document projects collection into ~26 chunk documents so
     the browser reads 27 documents per visit instead of 1,728. Data is
     byte-for-byte identical — this only changes how it is fetched. */
  "project-chunks": () => require("./_cron/cron-project-chunks.js"),
};

module.exports = async function handler(req, res) {
  // CORS (not strictly needed for cron, but harmless)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Central CRON_SECRET check - do it ONCE here, not in every handler
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized", hint: "Cron jobs require Bearer CRON_SECRET" });
    }
  }

  const job = (req.query.job || "").toString().trim();
  if (!job) {
    return res.status(400).json({
      error: "Missing ?job= parameter",
      availableJobs: Object.keys(HANDLERS),
    });
  }

  const handlerFactory = HANDLERS[job];
  if (!handlerFactory) {
    return res.status(404).json({
      error: `Unknown job '${job}'`,
      availableJobs: Object.keys(HANDLERS),
    });
  }

  try {
    const mod = handlerFactory();
    // Handler may export as module.exports (CommonJS) or module.exports.default (ESM compiled)
    const handlerFn = (typeof mod === "function") ? mod : (mod.default || mod.handler);
    if (typeof handlerFn !== "function") {
      return res.status(500).json({ error: `Handler for '${job}' is not a function`, exportType: typeof mod });
    }
    return await handlerFn(req, res);
  } catch (err) {
    console.error(`[cron router] job=${job} failed:`, err);
    return res.status(500).json({ error: "Cron job failed", job, message: err.message });
  }
};