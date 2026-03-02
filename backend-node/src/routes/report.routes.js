const express = require("express");
const { generateReport } = require("../controllers/report.controller");
const { getReportsByProjectId } = require('../controllers/report.controller');
const authorizeProjectAccess = require("../middlewares/access.middleware");


const router = express.Router();

router.post("/projects/:projectId/report",authorizeProjectAccess(["COORDINATOR"]), generateReport);

router.get('/:projectId',authorizeProjectAccess(), getReportsByProjectId);

module.exports = router;
