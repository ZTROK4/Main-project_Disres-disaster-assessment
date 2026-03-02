const jwt = require("jsonwebtoken");

exports.generateUserToken = (user) => {
  return jwt.sign(
    {
      id: user.id,   // 🔥 must be id (not userId)
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};