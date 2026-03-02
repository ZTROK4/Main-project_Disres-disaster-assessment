// src/routes/odm.routes.js
const express = require("express");
const upload = require("../middlewares/odmUpload");
const { uploadOdmCluster } = require("../controllers/odm.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");
const router = express.Router();

router.post(
  "/projects/:projectId/odm/upload",
  upload.array("images", 500), // ODM usually needs MANY images
  uploadOdmCluster
);


module.exports = router;


