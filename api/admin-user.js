/**
 * DXB Analytics - Consolidated Admin User Router
 * File: api/admin-user.js
 *
 * Routes to create/delete by ?action=<create|delete>
 * POST /api/admin-user?action=create  body: { email, password, name, tier }
 * POST /api/admin-user?action=delete  body: { uid }
 *
 * Both actions require the caller to be authenticated as an admin.
 * The admin check is done once, up front, before dispatching.
 *
 * Consolidation reason: Vercel Hobby 12-function limit.
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://emaar-dashboard.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verify the requesting user is an admin
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "No token provided" });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
    const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Not authorised" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Invalid token", message: err.message });
  }

  const action = (req.query.action || "").toString().trim();

  // -- CREATE --
  if (action === "create") {
    try {
      const { email, password, name, tier } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const newUser = await admin.auth().createUser({
        email,
        password,
        displayName: name || "",
      });

      await admin.firestore().doc(`users/${newUser.uid}`).set({
        uid: newUser.uid,
        email,
        name: name || "",
        tier: tier || "free",
        role: "user",
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({ uid: newUser.uid, success: true });
    } catch (err) {
      console.error("admin-user create error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // -- DELETE --
  if (action === "delete") {
    try {
      const { uid } = req.body || {};
      if (!uid) return res.status(400).json({ error: "UID required" });

      // Prevent admin from deleting themselves
      if (uid === decoded.uid) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await admin.auth().deleteUser(uid);
      await admin.firestore().doc(`users/${uid}`).delete();

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("admin-user delete error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({
    error: "Missing or invalid ?action= parameter",
    validActions: ["create", "delete"],
  });
};