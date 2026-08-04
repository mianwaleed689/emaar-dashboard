/**
 * REMOVE THE DEMO AGENCY.
 *
 * Everything the seed writes carries `demoSeed: true` and the demo orgId, so
 * removal is one query rather than a hunt. Firebase Auth accounts are left
 * alone — the client SDK cannot delete another user, and they are harmless
 * (they belong to a company that no longer exists in Firestore).
 *
 *   node scripts/unseed-demo-agency.mjs
 */
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
};

const ORG_ID   = "org_demo_prime_estates_v2";
const OWNER    = `owner.${ORG_ID.replace(/[^a-z0-9]+/g, "")}@primeestates.example`;
const PASSWORD = "Demo2026!";

const app = initializeApp(firebaseConfig, "unseed");
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, OWNER, PASSWORD);
console.log("signed in as the demo owner");

const snap = await getDocs(query(collection(db, "users"), where("orgId", "==", ORG_ID)));
console.log(`found ${snap.size} people in the demo agency`);

const ids = [];
snap.forEach(d => { if (d.id !== auth.currentUser.uid) ids.push(d.id); });

let done = 0;
for (let i = 0; i < ids.length; i += 200) {
  const batch = writeBatch(db);
  ids.slice(i, i + 200).forEach(id => batch.delete(doc(db, "users", id)));
  await batch.commit();
  done += Math.min(200, ids.length - i);
  console.log(`  removed ${done}/${ids.length}`);
}

/* The owner's own document last, so the writes above stay permitted — deleting
   it first would remove the very record that proves they may act here. */
await deleteDoc(doc(db, "users", auth.currentUser.uid)).catch(e => console.log("  owner doc:", e.code));
console.log("removed the owner's record");
console.log(`\nThe organisation document ${ORG_ID} is left in place; delete it from the`);
console.log("Firebase console if you want it gone. Auth accounts are also left — the");
console.log("client SDK cannot delete another user.");

await deleteApp(app).catch(() => {});
process.exit(0);
