const express = require("express");
const authorizeProjectAccess = require("../middlewares/access.middleware");
const chatController = require("../controllers/chatRoom.controller");

const router = express.Router();

/*
📌 Get paginated chat messages (infinite scroll)
Query:
  ?cursor=<messageId>
  ?limit=20
*/
router.get(
  "/projects/:projectId/chat",
  authorizeProjectAccess(),   // only APPROVED members + creator
  chatController.getChatMessages
);

/*
📌 Send a message
Body:
  {
    "content": "message text"
  }
*/
router.post(
  "/projects/:projectId/chat",
  authorizeProjectAccess(),   // only APPROVED members + creator
  chatController.sendMessage
);

module.exports = router;