const express = require("express");
const router = express.Router();
const multer = require("multer");
const mobileReportController = require("../controllers/mobileReport.controller");
const authorizeMobileReportAccess = require("../middlewares/mobileAccess.middleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/analyze",
  upload.single("image"),
  mobileReportController.analyzeMobileReport
);

router.post(
  "/:id/confirm",authorizeMobileReportAccess(),
  mobileReportController.confirmMobileReport
);

router.get(
  "/:id/alerts",authorizeMobileReportAccess(),
  mobileReportController.getAlertsByMobileReport
);
module.exports = router;