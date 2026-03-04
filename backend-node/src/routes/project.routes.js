const express = require("express");
const { createProject, getProjectBasicDetails,getMyProjects,getJoinCode } = require("../controllers/project.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");
const router = express.Router();


router.get("/getProjects",getProjectBasicDetails);
router.get("/my", getMyProjects);
router.post("/", createProject);
router.get(
  "/:projectId/join-code",authorizeProjectAccess(),getJoinCode
);
module.exports = router;
