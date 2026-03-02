const express = require("express");
const { generateEventSummary } = require("../controllers/event.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");
const router = express.Router();

router.post("/projects/:projectId/event-summary",authorizeProjectAccess(), generateEventSummary);

module.exports = router;
