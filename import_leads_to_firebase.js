/**
 * DXB ANALYTICS — LEADS IMPORT SCRIPT
 * Imports 67,722 contacts from DLD property register into Firebase Firestore
 *
 * HOW TO RUN:
 * 1. Copy this file to: C:\Users\TAD\emaar-dashboard\
 * 2. Copy leads_import_ready.json to: C:\Users\TAD\emaar-dashboard\
 * 3. Open PowerShell in that folder
 * 4. Run: node import_leads_to_firebase.js
 *
 * It will import in batches of 500 (Firestore limit is 500 per batch write)
 * Estimated time: 5-10 minutes for all 67,722 records
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, writeBatch, doc } = require("firebase/firestore");
const fs = require("fs");

// ── Firebase Config (from your project) ──────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBEtQr19WTjSTxssB2TjJq-ENioG8Jpq6Q",
  authDomain: "dxb-analytics.firebaseapp.com",
  projectId: "dxb-analytics",
  storageBucket: "dxb-analytics.firebasestorage.app",
  messagingSenderId: "329487314073",
  appId: "1:329487314073:web:2a73aa4a5b770f58459c08"
};

// ── Init ──────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Load data ─────────────────────────────────────────────────
const leads = JSON.parse(fs.readFileSync("./leads_import_ready.json", "utf8"));
console.log(`\n📋 Total leads to import: ${leads.length.toLocaleString()}`);

// ── Batch import (500 per batch — Firestore limit) ────────────
const BATCH_SIZE = 500;

async function importLeads() {
  let imported = 0;
  let skipped = 0;
  const totalBatches = Math.ceil(leads.length / BATCH_SIZE);

  console.log(`🚀 Starting import in ${totalBatches} batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const chunk = leads.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    for (const lead of chunk) {
      // Skip if no name
      if (!lead.name || lead.name.trim().length < 2) {
        skipped++;
        continue;
      }

      // Generate unique ID: lead_ + timestamp + random
      const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const ref = doc(collection(db, "leads"), id);

      batch.set(ref, {
        name:         lead.name || "",
        phone:        lead.phone || "",
        email:        lead.email || "",
        source:       lead.source || "DLD Data",
        project:      lead.project || "",
        nationality:  lead.nationality || "",
        budget:       lead.budget || "",
        community:    lead.community || "",
        status:       "New",
        notes:        lead.notes || [],
        activity:     lead.activity || [],
        createdAt:    lead.createdAt || new Date().toISOString(),
        updatedAt:    lead.updatedAt || new Date().toISOString(),
        followUpDate: "",
        respondedAt:  "",
        convertedAt:  "",
        lossReason:   "",
      });

      imported++;
    }

    // Commit batch
    try {
      await batch.commit();
      const pct = Math.round((batchNum / totalBatches) * 100);
      process.stdout.write(`\r  ✅ Batch ${batchNum}/${totalBatches} (${pct}%) — ${imported.toLocaleString()} imported`);
    } catch (err) {
      console.error(`\n  ❌ Batch ${batchNum} failed:`, err.message);
      // Wait 2 seconds and retry once
      await new Promise(r => setTimeout(r, 2000));
      try {
        await batch.commit();
        console.log(`  ↩️  Batch ${batchNum} retried successfully`);
      } catch (err2) {
        console.error(`  ❌ Batch ${batchNum} failed on retry — skipping`);
      }
    }

    // Small delay between batches to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\n🎉 IMPORT COMPLETE`);
  console.log(`   ✅ Imported: ${imported.toLocaleString()}`);
  console.log(`   ⚠️  Skipped:  ${skipped.toLocaleString()}`);
  console.log(`   📊 Total:    ${leads.length.toLocaleString()}`);
  console.log(`\n   Go to your Admin Panel → Leads tab to see all contacts.`);
  process.exit(0);
}

importLeads().catch(err => {
  console.error("\n❌ Import failed:", err);
  process.exit(1);
});
