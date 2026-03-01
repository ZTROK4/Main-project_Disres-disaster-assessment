const prisma = require("../db/prisma"); // adjust path
const geminiService = require("./chatg.service");
const { resolveNearestAuthorities } = require("./authority.service");
exports.processChat = async ({ projectId, userMessage }) => {

  // 1️⃣ Save user message
  await prisma.chatMessage.create({
    data: {
      projectId,
      role: "user",
      content: userMessage,
    },
  });

  // 2️⃣ Fetch last 3 messages (for context)
  const previousMessages = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Reverse because we fetched desc
  const history = previousMessages
    .reverse()
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

  // 3️⃣ Load system data (your payload logic)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  const inputs = await prisma.input.findMany({
    where: { projectId, analysisJson: { not: null } },
    take: 5, // limit to reduce tokens
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
    contacts: {
      police,
      hospital,
      fire,
    },
    eventSummary: eventSummary?.summaryJson || null,
    inputs: inputs.map((i) => i.analysisJson),
  };

  // 4️⃣ Call Gemini
  const aiReply = await geminiService.generateChat({
    payload,
    history,
    userMessage,
  });

  // 5️⃣ Save AI response
  await prisma.chatMessage.create({
    data: {
      projectId,
      role: "assistant",
      content: aiReply,
    },
  });

  return aiReply;
};