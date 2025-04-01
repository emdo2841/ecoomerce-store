;
  const isAuthenticated = (req, res, next) => {
    console.log("🔍 Session Data:", req.session);
    console.log("👤 User Data:", req.user);
    
    if (req.isAuthenticated()) {
        console.log("✅ User is authenticated");
        return next();
    } else {
        console.log("❌ Unauthorized: No active user session");
        return res.status(401).json({ error: "Unauthorized: No active user session" });
    }
};
module.exports = isAuthenticated
