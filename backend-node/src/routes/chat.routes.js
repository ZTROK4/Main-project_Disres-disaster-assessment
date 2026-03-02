const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");

router.post("/:projectId",authorizeProjectAccess(), chatController.handleChat);

module.exports = router;