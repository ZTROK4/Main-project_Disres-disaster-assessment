const express = require("express");
const upload = require("../middlewares/upload");
const { uploadCluster } = require("../controllers/upload.controller");

const router = express.Router();

router.post(
  "/projects/:projectId/upload",
  upload.array("files"),
  uploadCluster
);

module.exports = router;
