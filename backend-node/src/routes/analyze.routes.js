const express = require("express");
const { analyzeProjectInputs } = require("../controllers/analyze.controller");

const router = express.Router();

router.post("/projects/:projectId/analyze", analyzeProjectInputs);

module.exports = router;
