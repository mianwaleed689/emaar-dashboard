/**
 * DXB ANALYTICS — LEADS IMPORT SCRIPT v4 (RESUME)
 * Resumes from where it stopped — skips first 16,000 already imported
 *
 * HOW TO RUN:
 * node import_leads_v4_resume.js
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

// Skip first 16,000 already imported
const SKIP = 16000;
const leads = allLeads.slice(SKIP);

console.log("Total leads: " + allLeads.length.toLocaleString());
console.log("Already imported: " + SKIP.toLocaleString());
console.log("Remaining to import: " + leads.length.toLocaleString());
console.log("Starting resume...\n");

const BATCH_SIZE = 300;
let imported = SKIP;
let batchNum = 0;
const totalBatches = Math.ceil(leads.length / BATCH_SIZE);

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
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await batch.commit();
        success = true;
        break;
      } catch (err) {
        console.log("  Batch " + batchNum + " attempt " + attempt + " failed: " + err.message);
        await new Promise(r => setTimeout(r, 4000 * attempt));
      }
    }

    if (!success) {
      console.log("  SKIPPED batch " + batchNum);
    }

    // Print every 5 batches
    if (batchNum % 5 === 0 || batchNum === totalBatches || batchNum === 1) {
      const pct = Math.round((imported / allLeads.length) * 100);
      console.log("  Batch " + batchNum + "/" + totalBatches + " — " + imported.toLocaleString() + " / " + allLeads.length.toLocaleString() + " (" + pct + "%)");
    }

    // Longer delay to avoid Firebase throttling
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n=============================");
  console.log("IMPORT COMPLETE!");
  console.log("Total imported: " + imported.toLocaleString());
  console.log("=============================");
  console.log("Go to Admin Panel -> Leads tab to verify.");
  process.exit(0);
}

importLeads().catch(err => {
  console.error("\nFailed: " + err.message);
  process.exit(1);
});
