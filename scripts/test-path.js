const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const fs = require("fs");
const path = require("path");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Load from project data folder
const dataPath = path.join(__dirname, "../data/dld-area-stats.json");
console.log("Loading from:", dataPath);
const dldData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
console.log("DLD areas loaded:", Object.keys(dldData).length);
process.exit(0);