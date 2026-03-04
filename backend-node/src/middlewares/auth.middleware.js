const jwt = require("jsonwebtoken")

module.exports = function authenticate(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" })

  const token = authHeader.split(" ")[1]
  console.log("token auth working");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    console.log(req.user);
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
};