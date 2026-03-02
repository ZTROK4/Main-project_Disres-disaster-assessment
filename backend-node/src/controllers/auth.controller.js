const authService = require("../services/auth.service");

exports.googleCallback = async (req, res) => {
  try {
    const token = authService.generateUserToken(req.user);

    const frontendOrigin = req.query.state;

    // 🔐 VERY IMPORTANT: whitelist allowed frontends
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://yourproductiondomain.com"
    ];

    if (!frontendOrigin || !allowedOrigins.includes(frontendOrigin)) {
      return res.status(400).send("Invalid redirect origin");
    }

    // Redirect back to frontend with token
    res.redirect(
      `${frontendOrigin}/auth-success?token=${token}`
    );

  } catch (err) {
    res.status(500).send("Authentication failed");
  }
};