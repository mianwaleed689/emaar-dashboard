const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://emaar-dashboard.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Not authorised" });
    }

    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "UID required" });

    // Prevent admin from deleting themselves
    if (uid === decoded.uid) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    // Delete from Firestore
    await admin.firestore().doc(`users/${uid}`).delete();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("admin-delete-user error:", err);
    return res.status(500).json({ error: err.message });
  }
};
