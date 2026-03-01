const chatService = require("../services/chat.service");

exports.handleChat = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await chatService.processChat({
      projectId,
      userMessage: message,
    });

    res.json({ reply });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
};