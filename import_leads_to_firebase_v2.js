/**
 * DXB ANALYTICS — LEADS IMPORT SCRIPT v2
 * PowerShell-friendly version with visible progress
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, writeBatch, doc } = require("firebase/firestore");
const fs = require("fs");

const firebaseConfig = {
  apiKey: "AIzaSyBEtQr19WTjSTxssB2TjJq-ENioG8Jpq6Q",
  authDomain: "dxb-analytics.firebaseapp.com",
  projectId: "dxb-analytics",
  storageBucket: "dxb-analytics.firebasestorage.app",
  messagingSenderId: "329487314073",
  appId: "1:329487314073:web:2a73aa4a5b770f58459c08"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const leads = JSON.parse(fs.readFileSync("./leads_import_ready.json", "utf8"));
console.log("Total leads to import: " + leads.length);
console.log("Starting import...");

const BATCH_SIZE = 400;
let imported = 0;
let batchNum = 0;
const totalBatches = Math.ceil(leads.length / BATCH_SIZE);

async function importLeads() {
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    batchNum++;
    const chunk = leads.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const lead of chunk) {
      if (!lead.name || lead.name.trim().length < 2) continue;
      const id = "lead_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      const ref = doc(collection(db, "leads"), id);
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

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await batch.commit();
        success = true;
        break;
      } catch (err) {
        console.log("Batch " + batchNum + " attempt " + attempt + " failed: " + err.message);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (!success) {
      console.log("SKIPPED batch " + batchNum + " after 3 attempts");
    }

    // Print progress every 10 batches
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      const pct = Math.round((batchNum / totalBatches) * 100);
      console.log("Batch " + batchNum + "/" + totalBatches + " (" + pct + "%) - " + imported + " leads imported");
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log("\n=============================");
  console.log("IMPORT COMPLETE");
  console.log("Imported: " + imported);
  console.log("Total: " + leads.length);
  console.log("=============================");
  console.log("Go to Admin Panel -> Leads tab to see all contacts.");
  process.exit(0);
}

importLeads().catch(err => {
  console.error("Import failed: " + err.message);
  process.exit(1);
});
