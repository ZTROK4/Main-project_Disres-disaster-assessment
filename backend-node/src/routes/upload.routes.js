const express = require("express");
const upload = require("../middlewares/upload");
const { uploadCluster } = require("../controllers/upload.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");
const router = express.Router();

router.post(
  "/projects/:projectId/upload",
  authorizeProjectAccess(["COORDINATOR"]),
  upload.array("files"),
  uploadCluster
);

module.exports = router;
