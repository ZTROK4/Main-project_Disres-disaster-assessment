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
  authorizeProjectAccess(),  
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
  authorizeProjectAccess(),   
  chatController.sendMessage
);

module.exports = router;