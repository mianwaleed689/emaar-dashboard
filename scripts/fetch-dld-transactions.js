/**
 * fetch-dld-transactions.js — v2
 * Saves ALL fields from data.dubai DLD API
 * Includes: master_project, rooms, ppsf, metro, mall, landmark, transaction_id
 */

const https = require("https");
const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const DATASET_ID = "470061";
const PAGE_SIZE = 1000;
const IS_BULK = process.argv.includes("--bulk");
const MAX_PAGES = IS_BULK ? 67 : 5;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchPage(page) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: "data.dubai",
      path: `/o/dda/data-services/dataset-metadata?datasetId=${DATASET_ID}&page=${page}&pageSize=${PAGE_SIZE}`,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://data.dubai/en/l/470061",
      },
      timeout: 30000,
    }, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(d);
          resolve(json.success ? json.data || [] : []);
        } catch(e) { resolve([]); }
      });
    });
    req.on("error", () => resolve([]));
    req.on("timeout", () => { req.destroy(); resolve([]); });
    req.end();
  });
}

async function main() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`\nDLD Transaction Fetch v2 — ${today} ${IS_BULK ? "(BULK)" : "(DAILY)"}`);

  if (!IS_BULK) {
    const stateDoc = await db.collection("sync_logs").doc(`transactions-${today}`).get();
    if (stateDoc.exists) { console.log("Already fetched today"); process.exit(0); }
  }

  let total = 0, saved = 0, skipped = 0;
  let batch = db.batch(), bc = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const rows = await fetchPage(page);
    if (!rows.length) { console.log("No more data at page", page); break; }

    for (const tx of rows) {
      if (!tx.transaction_id) { skipped++; continue; }
      const ppsf = tx.meter_sale_price || (tx.procedure_area > 0 ? Math.round(tx.actual_worth / tx.procedure_area) : 0);
      if (ppsf > 25000) { skipped++; continue; }

      const docId = tx.transaction_id.replace(/[^a-zA-Z0-9-]/g, "_");

      batch.set(db.collection("transactions").doc(docId), {
        // Core fields
        transactionId:    tx.transaction_id,
        date:             tx.instance_date,
        price:            tx.actual_worth || 0,
        ppsf:             Math.round(ppsf) || 0,
        areaSqft:         tx.procedure_area || 0,

        // Property info
        projectName:      tx.project_name_en || "",
        projectNameAr:    tx.project_name_ar || "",
        buildingName:     tx.building_name_en || "",
        masterProject:    tx.master_project_en || "",
        areaName:         tx.area_name_en || "",
        propertyType:     tx.property_type_en || "",
        propertySubType:  tx.property_sub_type_en || "",
        propertyUsage:    tx.property_usage_en || "",
        rooms:            tx.rooms_en || "",
        hasParking:       tx.has_parking === 1,
        projectNumber:    tx.project_number || null,

        // Transaction info
        procedureName:    tx.procedure_name_en || "",
        transGroup:       tx.trans_group_en || "",
        regType:          tx.reg_type_en || "",

        // Location context
        nearestMetro:     tx.nearest_metro_en || "",
        nearestMall:      tx.nearest_mall_en || "",
        nearestLandmark:  tx.nearest_landmark_en || "",

        // Meta
        source:           "data.dubai",
        importedAt:       new Date().toISOString(),
      }, { merge: true });

      bc++; saved++;
      if (bc >= 400) {
        await batch.commit();
        batch = db.batch(); bc = 0;
      }
    }

    total += rows.length;
    if (page % 5 === 0 || page === MAX_PAGES) {
      console.log(`Page ${page}/${MAX_PAGES} | Total: ${total} | Saved: ${saved} | Skipped: ${skipped}`);
    }
    await sleep(300);
  }

  if (bc > 0) await batch.commit();

  console.log(`\nDone! Saved: ${saved} | Skipped: ${skipped}`);

  await db.collection("sync_logs").doc(`transactions-${today}`).set({
    date: today, totalFetched: total, saved, skipped,
    completedAt: new Date().toISOString(),
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
