const express = require("express");
const { analyzeProjectInputs } = require("../controllers/analyze.controller");
//const authenticate = require("../middlewares/auth.middleware");
const authorizeProjectAccess = require("../middlewares/access.middleware");

const router = express.Router();

router.post(
  "/projects/:projectId/analyze",
  authorizeProjectAccess(), 
  analyzeProjectInputs
);

module.exports = router;