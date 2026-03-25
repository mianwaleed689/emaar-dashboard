/**
 * DXB ANALYTICS — LEADS IMPORT SCRIPT v5 (SLOW & STEADY)
 * Smaller batches, longer delays — avoids Firebase throttling
 */

const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./dxb-analytics-firebase-adminsdk key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "dxb-analytics"
});

const db = admin.firestore();

const allLeads = JSON.parse(fs.readFileSync("./leads_import_ready.json", "utf8"));

// Skip already imported
const SKIP = 16000;
const leads = allLeads.slice(SKIP);

console.log("Total: " + allLeads.length.toLocaleString());
console.log("Skipping first: " + SKIP.toLocaleString());
console.log("To import: " + leads.length.toLocaleString());
console.log("Starting slow & steady...\n");

const BATCH_SIZE = 100; // Small batches
let imported = SKIP;
let batchNum = 0;
const totalBatches = Math.ceil(leads.length / BATCH_SIZE);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function importLeads() {
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    batchNum++;
    const chunk = leads.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const lead of chunk) {
      if (!lead.name || lead.name.trim().length < 2) continue;
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
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await batch.commit();
        success = true;
        break;
      } catch (err) {
        console.log("  Attempt " + attempt + " failed: " + err.message.slice(0, 60));
        await sleep(5000 * attempt); // 5s, 10s, 15s, 20s, 25s
      }
    }

    if (!success) {
      console.log("  SKIPPED batch " + batchNum);
      imported -= chunk.length;
    }

    // Print every batch
    const pct = Math.round((imported / allLeads.length) * 100);
    console.log("Batch " + batchNum + "/" + totalBatches + " — " + imported.toLocaleString() + " / " + allLeads.length.toLocaleString() + " (" + pct + "%)");

    // 1 second delay between every batch
    await sleep(1000);
  }

  console.log("\n=============================");
  console.log("IMPORT COMPLETE!");
  console.log("Total imported: " + imported.toLocaleString());
  console.log("=============================");
  process.exit(0);
}

importLeads().catch(err => {
  console.error("Failed: " + err.message);
  process.exit(1);
});
