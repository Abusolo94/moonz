
const {admin} = require("../firebaseAdmin") ;


// Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

 const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // 🔍 Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    // ✅ Fetch user role from Firestore
    const userDoc = await admin.firestore().collection("users").doc(req.user.uid).get();
    const roleType = userDoc.data()?.roleType || "user";

    req.user.roleType = roleType;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(403).json({ message: "Unauthorized or invalid token" });
  }
};

module.exports = {authMiddleware}