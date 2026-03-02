const prisma = require("../db/prisma"); // adjust path
const geminiService = require("./chatg.service");
const { resolveNearestAuthorities } = require("./authority.service");

exports.processProjectChatAI = async ({
  projectId,
  chatRoomId,
  userMessage
}) => {

  // 1️⃣ Fetch last 10 chatroom messages for context
  const previousMessages = await prisma.message.findMany({
    where: { chatRoomId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      sender: {
        select: { name: true }
      }
    }
  });

  const history = previousMessages
    .reverse()
    .map((msg) => ({
      role: msg.sender.name === "MitigateAI" ? "model" : "user",
      parts: [{
        text: `${msg.sender.name}: ${msg.content}`
      }]
    }));

  // 2️⃣ Load project intelligence context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  const inputs = await prisma.input.findMany({
    where: { projectId, analysisJson: { not: null } },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const eventSummary = await prisma.eventSummary.findUnique({
    where: { projectId },
  });

  const { police, hospital, fire } =
    await resolveNearestAuthorities(
      project.latitude,
      project.longitude
    );

  const payload = {
    project: {
      id: project.id,
      location: project.location,
      disasterType: project.disasterType,
    },
    contacts: { police, hospital, fire },
    eventSummary: eventSummary?.summaryJson || null,
    inputs: inputs.map((i) => i.analysisJson),
  };

  // 3️⃣ Call Gemini
  const aiReply = await geminiService.generateChat({
    payload,
    history,
    userMessage
  });

  return aiReply;
};