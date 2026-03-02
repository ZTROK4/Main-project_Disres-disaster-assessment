const express = require("express");
const router = express.Router();
const odmController = require("../controllers/odmRun.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");
// ▶ Run ODM reconstruction (async job)
router.post(
  "/odm/projects/:projectId/reconstructions/:version/run",
  authorizeProjectAccess(["COORDINATOR"]),
  odmController.runOdmReconstruction
);

// ▶ List all reconstructions for a project
router.get(
  "/odm/projects/:projectId/reconstructions",
  authorizeProjectAccess(),
  odmController.listReconstructions
);

module.exports = router;
