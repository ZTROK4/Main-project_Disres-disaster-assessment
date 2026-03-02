const express = require("express");
const passport = require("passport");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// STEP 1: Google login route
router.get("/google", (req, res, next) => {
  const origin = req.query.origin;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: origin || ""
  })(req, res, next);
});

// STEP 2: Google callback route
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

module.exports = router;