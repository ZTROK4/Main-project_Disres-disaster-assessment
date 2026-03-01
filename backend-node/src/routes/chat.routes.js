const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

router.post("/:projectId", chatController.handleChat);

module.exports = router;