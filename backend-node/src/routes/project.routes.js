const express = require("express");
const { createProject, getProjectBasicDetails,getMyProjects } = require("../controllers/project.controller");

const router = express.Router();

router.get("/getProjects",getProjectBasicDetails);
router.get("/projects/my", getMyProjects);
router.post("/", createProject);

module.exports = router;
