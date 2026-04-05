const authService = require("../services/auth.service");

exports.googleCallback = async (req, res) => {
  try {
    const {user, isNewUser}  = req.user;
    const token = authService.generateUserToken(user);

    const frontendOrigin = req.query.state;

    // 🔐 VERY IMPORTANT: whitelist allowed frontends
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://majorproj2.vercel.app"
    ];

    if (!frontendOrigin || !allowedOrigins.includes(frontendOrigin)) {
      return res.status(400).send("Invalid redirect origin");
    }

    // Redirect back to frontend with token
    if (isNewUser){
      res.redirect(
      `${frontendOrigin}/login?token=${token}`
    );
    }
    else{
      res.redirect(
      `${frontendOrigin}/dashboard?token=${token}`
    );
    }
    

  } catch (err) {
    res.status(500).send("Authentication failed");
  }
};