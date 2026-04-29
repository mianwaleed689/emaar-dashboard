const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });

// Update Firestore rules to allow reading new collections
const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

// Check current rules
console.log("Need to update Firestore rules manually in Firebase Console");
console.log("Add these collections to your rules:");
console.log("  communityLookup - allow read");
console.log("  developers - allow read");
console.log("\nGo to: https://console.firebase.google.com/project/dxb-analytics/firestore/rules");