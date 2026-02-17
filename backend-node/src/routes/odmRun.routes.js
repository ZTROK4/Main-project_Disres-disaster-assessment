const express = require("express");
const router = express.Router();
const odmController = require("../controllers/odmRun.controller");

// ▶ Run ODM reconstruction (async job)
router.post(
  "/odm/projects/:projectId/reconstructions/:version/run",
  odmController.runOdmReconstruction
);

// ▶ List all reconstructions for a project
router.get(
  "/odm/projects/:projectId/reconstructions",
  odmController.listReconstructions
);

module.exports = router;
