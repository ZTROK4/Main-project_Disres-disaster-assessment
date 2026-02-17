const express = require("express");
const { generateEventSummary } = require("../controllers/event.controller");

const router = express.Router();

router.post("/projects/:projectId/event-summary", generateEventSummary);

module.exports = router;
