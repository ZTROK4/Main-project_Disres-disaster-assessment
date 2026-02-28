const express = require("express");
const router = express.Router();
const multer = require("multer");
const mobileReportController = require("../controllers/mobileReport.controller");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/analyze",
  upload.single("image"),
  mobileReportController.analyzeMobileReport
);

router.post(
  "/:id/confirm",
  mobileReportController.confirmMobileReport
);

router.get(
  "/:id/alerts",
  mobileReportController.getAlertsByMobileReport
);
module.exports = router;