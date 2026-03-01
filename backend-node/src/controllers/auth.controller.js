const authService = require("../services/auth.service")

exports.googleCallback = async (req, res) => {
  try {
    const token = authService.generateUserToken(req.user)

    res.json({
      message: "Authentication successful",
      token
    })
  } catch (err) {
    res.status(500).json({ message: "Authentication failed" })
  }
}