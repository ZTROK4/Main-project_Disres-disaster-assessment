const express = require("express");
const { createProject, getProjectBasicDetails } = require("../controllers/project.controller");

const router = express.Router();

router.get("/getProjects",getProjectBasicDetails);
router.post("/", createProject);

module.exports = router;
