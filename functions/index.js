const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Generate admin invite code via HTTP call (no auth required for development)
exports.generateInviteCode = functions.https.onRequest(async (req, res) => {
  // In production, add authentication check here
  const authHeader = req.headers.authorization;
  
  // Simple security check
  if (authHeader !== "Bearer YOUR_SECRET_TOKEN") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    const code = "ADMIN" + Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await admin.firestore().collection("admin_invite_codes").add({
      code: code,
      generatedBy: "cloud_function",
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      isUsed: false,
      maxUses: 1,
      usedBy: null,
      usedAt: null,
    });
    
    res.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Callable function (requires auth)
exports.generateInviteCodeCallable = functions.https.onCall(async (data, context) => {
  // Verify user is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }
  
  const adminDoc = await admin.firestore()
    .collection("admin_users")
    .doc(context.auth.uid)
    .get();
    
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin permission required"
    );
  }
  
  const code = "ADMIN" + Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
    
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await admin.firestore().collection("admin_invite_codes").add({
    code: code,
    generatedBy: context.auth.uid,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: expiresAt,
    isUsed: false,
    maxUses: 1,
    usedBy: null,
    usedAt: null,
  });
  
  return {
    success: true,
    code: code,
    expiresAt: expiresAt.toISOString(),
  };
});