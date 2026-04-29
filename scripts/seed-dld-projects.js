const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const fs = require("fs");
const path = require("path");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const projects = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-projects-processed.json"),"utf8"));
console.log("Projects to seed:", projects.length);

const APPLY = process.argv.includes("--apply");
console.log(APPLY ? "APPLYING" : "DRY RUN");

// Show sample
projects.slice(0,5).forEach(p=>console.log(
  p.name?.substring(0,30).padEnd(30),
  "| community:", p.community?.substring(0,20),
  "| pct:", p.constructionPct+"%",
  "| handover:", p.handoverQuarter||"--",
  "| units:", p.totalUnits||"--"
));

if(!APPLY) {
  console.log("\nRun with --apply to seed");
  process.exit(0);
}

async function run() {
  // Load existing Emaar projects to avoid overwriting
  const existing = await db.collection("projects").get();
  const existingIds = new Set(existing.docs.map(d=>d.id));
  console.log("Existing projects:", existingIds.size);

  let added=0, skipped=0;
  const BATCH_SIZE = 400;

  for(let i=0; i<projects.length; i+=BATCH_SIZE) {
    const batch = db.batch();
    const chunk = projects.slice(i, i+BATCH_SIZE);

    chunk.forEach(p => {
      // Generate clean doc ID from project name
      const docId = (p.name||"unknown")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-|-$/g,"")
        .substring(0,60)
        + "-dld-" + (p.projectNumber||p.dldProjectId||i);

      // Skip if already exists as Emaar project
      if(existingIds.has(docId)) { skipped++; return; }

      batch.set(db.collection("projects").doc(docId), {
        ...p,
        id: docId,
        // Add source tag so we know these are DLD imported
        source: "DLD-2026",
        dldImported: true,
      });
      added++;
    });

    await batch.commit();
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} committed — total added so far: ${added}`);
  }

  console.log("\n=== DONE ===");
  console.log("Added:", added);
  console.log("Skipped (existing):", skipped);
  console.log("Total projects now:", existingIds.size + added);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});