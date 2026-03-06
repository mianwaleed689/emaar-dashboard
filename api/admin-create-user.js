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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verify the requesting user is an admin via their Firebase ID token
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Not authorised" });
    }

    const { email, password, name, tier } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    // Create user WITHOUT affecting the current admin session
    const newUser = await admin.auth().createUser({
      email,
      password,
      displayName: name || "",
    });

    // Create Firestore profile
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
    console.error("admin-create-user error:", err);
    return res.status(500).json({ error: err.message });
  }
};
