const express = require("express");
const { generateReport } = require("../controllers/report.controller");
const { getReportsByProjectId } = require('../controllers/report.controller');



const router = express.Router();

router.post("/projects/:projectId/report", generateReport);

router.get('/:projectId', getReportsByProjectId);

module.exports = router;
