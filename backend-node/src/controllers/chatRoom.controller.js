const prisma = require("../db/prisma");
const chatService=require("../services/chatRoomAI.service");



exports.getChatMessages = async (req, res) => {
  const { projectId } = req.params;
  const { cursor, limit = 20 } = req.query;

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { projectId },
      include: {
        project: {
          select: { creatorId: true }
        }
      }
    });

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const messages = await prisma.message.findMany({
      where: { chatRoomId: chatRoom.id },
      take: Number(limit),
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor }
      }),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            designation: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                designation: true
              }
            }
          }
        }
      }
    });

    // 🔥 CORRECT CURSOR (before reversing)
    const nextCursor = messages.length
      ? messages[messages.length - 1].id
      : null;

    const ordered = messages.reverse();

    // 🔥 Extract sender IDs (exclude creator + AI for optimization)
    const senderIds = [
      ...new Set(
        ordered
          .map(m => m.sender.id)
          .filter(id =>
            id !== chatRoom.project.creatorId &&
            id !== process.env.AI_USER_ID
          )
      )
    ];

    const memberships = await prisma.projectMember.findMany({
      where: {
        projectId,
        userId: { in: senderIds },
        status: "APPROVED"
      }
    });

    const roleMap = {};
    memberships.forEach(m => {
      roleMap[m.userId] = m.role;
    });

    const enrichedMessages = ordered.map(msg => {
      let role = null;

      if (msg.sender.id === chatRoom.project.creatorId) {
        role = "CREATOR";
      } else if (msg.sender.id === process.env.AI_USER_ID) {
        role = "SYSTEM";
      } else {
        role = roleMap[msg.sender.id] || null;
      }

      return {
        ...msg,
        sender: {
          ...msg.sender,
          role
        }
      };
    });

    res.json({
      messages: enrichedMessages,
      nextCursor
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};



exports.sendMessage = async (req, res) => {
  const { projectId } = req.params;
  const { content, replyToId } = req.body;
  const userId = req.user.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { projectId },
      include: {
        project: {
          select: { creatorId: true }
        }
      }
    });

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // 🔐 Validate reply target
    if (replyToId) {
      const originalMessage = await prisma.message.findUnique({
        where: { id: replyToId }
      });

      if (!originalMessage) {
        return res.status(400).json({ error: "Original message not found" });
      }

      if (originalMessage.chatRoomId !== chatRoom.id) {
        return res.status(400).json({ error: "Invalid reply target" });
      }
    }

    // 1️⃣ Create user message
    const userMessage = await prisma.message.create({
      data: {
        chatRoomId: chatRoom.id,
        senderId: userId,
        content,
        replyToId: replyToId || null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            designation: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                designation: true
              }
            }
          }
        }
      }
    });

    let aiMessage = null;

    // 2️⃣ AI trigger
    if (content.trim().startsWith("@MitigateAI")) {

      const cleanPrompt = content
        .replace("@MitigateAI", "")
        .trim();

      const aiReply = await chatService.processProjectChatAI({
        projectId,
        chatRoomId: chatRoom.id,
        userMessage: cleanPrompt
      });

      aiMessage = await prisma.message.create({
        data: {
          chatRoomId: chatRoom.id,
          senderId: process.env.AI_USER_ID,
          content: aiReply,
          replyToId: userMessage.id
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              designation: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  designation: true
                }
              }
            }
          }
        }
      });
    }

    // 🔥 Enrich BOTH messages in ONE query
    const messagesToEnrich = aiMessage
      ? [userMessage, aiMessage]
      : [userMessage];

    const enrichedMessages = await enrichMessagesWithRoles(
      messagesToEnrich,
      projectId,
      chatRoom.project.creatorId
    );

    res.status(201).json({
      userMessage: enrichedMessages[0],
      aiMessage: enrichedMessages[1] || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};


async function enrichMessagesWithRoles(messages, projectId, creatorId) {

  const senderIds = [
    ...new Set(messages.map(m => m.sender.id))
  ];

  const memberships = await prisma.projectMember.findMany({
    where: {
      projectId,
      userId: { in: senderIds },
      status: "APPROVED"
    }
  });

  const roleMap = {};
  memberships.forEach(m => {
    roleMap[m.userId] = m.role;
  });

  return messages.map(message => {

    let role = null;

    if (message.sender.id === creatorId) {
      role = "CREATOR";
    } else if (message.sender.id === process.env.AI_USER_ID) {
      role = "SYSTEM"; // 🔥 AI special role
    } else {
      role = roleMap[message.sender.id] || null;
    }

    return {
      ...message,
      sender: {
        ...message.sender,
        role
      }
    };
  });
}