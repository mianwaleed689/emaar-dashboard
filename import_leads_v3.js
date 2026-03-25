/**
 * DXB ANALYTICS — LEADS IMPORT SCRIPT v3 (Admin SDK)
 * Uses Firebase Admin SDK — bypasses Firestore security rules
 *
 * HOW TO RUN:
 * 1. Copy this file to: C:\Users\TAD\emaar-dashboard\
 * 2. Make sure these are also in C:\Users\TAD\emaar-dashboard\
 *    - leads_import_ready.json
 *    - dxb-analytics-firebase-adminsdk key.json
 * 3. Run in PowerShell:
 *    npm install firebase-admin
 *    node import_leads_v3.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Load service account key
const serviceAccount = require("./dxb-analytics-firebase-adminsdk key.json");

// Init Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "dxb-analytics"
});

const db = admin.firestore();

// Load leads
const leads = JSON.parse(fs.readFileSync("./leads_import_ready.json", "utf8"));
console.log("Total leads to import: " + leads.length.toLocaleString());
console.log("Starting import with Admin SDK...\n");

const BATCH_SIZE = 400;
let imported = 0;
let skipped = 0;
let batchNum = 0;
const totalBatches = Math.ceil(leads.length / BATCH_SIZE);

async function importLeads() {
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    batchNum++;
    const chunk = leads.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const lead of chunk) {
      if (!lead.name || lead.name.trim().length < 2) {
        skipped++;
        continue;
      }
      const id = "lead_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      const ref = db.collection("leads").doc(id);

      batch.set(ref, {
        name:         lead.name || "",
        phone:        lead.phone || "",
        email:        lead.email || "",
        source:       "DLD Data",
        project:      lead.project || "",
        nationality:  lead.nationality || "",
        budget:       lead.budget || "",
        community:    lead.community || "",
        status:       "New",
        notes:        lead.notes || [],
        activity:     lead.activity || [],
        createdAt:    lead.createdAt || new Date().toISOString(),
        updatedAt:    new Date().toISOString(),
        followUpDate: "",
        respondedAt:  "",
        convertedAt:  "",
        lossReason:   "",
      });
      imported++;
    }

    // Commit with retry
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await batch.commit();
        success = true;
        break;
      } catch (err) {
        console.log("  Batch " + batchNum + " attempt " + attempt + " failed: " + err.message);
        await new Promise(r => setTimeout(r, 3000 * attempt));
      }
    }

    if (!success) {
      console.log("  SKIPPED batch " + batchNum);
    }

    // Show progress every 10 batches
    if (batchNum % 10 === 0 || batchNum === totalBatches || batchNum === 1) {
      const pct = Math.round((batchNum / totalBatches) * 100);
      console.log("  Batch " + batchNum + "/" + totalBatches + " (" + pct + "%) — " + imported.toLocaleString() + " imported");
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150));
  }

  console.log("\n=============================");
  console.log("IMPORT COMPLETE!");
  console.log("Imported : " + imported.toLocaleString());
  console.log("Skipped  : " + skipped);
  console.log("Total    : " + leads.length.toLocaleString());
  console.log("=============================");
  console.log("\nGo to Admin Panel -> Leads tab to see all contacts.");
  process.exit(0);
}

importLeads().catch(err => {
  console.error("\nImport failed: " + err.message);
  process.exit(1);
});
