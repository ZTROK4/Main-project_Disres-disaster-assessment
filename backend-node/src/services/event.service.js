const prisma = require("../db/prisma");
const axios = require("axios");

/**
 * Generate or update an event summary for a project
 */
exports.generateEventSummary = async (projectId) => {
  // 1️⃣ Fetch analyzed inputs
  const inputs = await prisma.input.findMany({
    where: {
      projectId,
      analysisJson: { not: null },
    },
  });

  if (!inputs || inputs.length === 0) {
    throw new Error("No analyzed inputs available for event inference");
  }

  // 2️⃣ Call Python Event Inference API
  const response = await axios.post(
    `${process.env.AI_API_URL}/events/infer`,
    {
      projectId,
      inputs: inputs.map((i) => i.analysisJson),
    },
    { timeout: 120000 }
  );

  const summary = response.data;

  if (!summary || !summary.finalDisaster) {
    throw new Error("Invalid event inference response");
  }

  // 3️⃣ Upsert EventSummary in DB
  const eventSummary = await prisma.eventSummary.upsert({
    where: { projectId },
    update: {
      finalDisaster: summary.finalDisaster,
      severity: summary.severity,
      confidence: summary.confidence ?? null,
      summaryJson: summary,
    },
    create: {
      projectId,
      finalDisaster: summary.finalDisaster,
      severity: summary.severity,
      confidence: summary.confidence ?? null,
      summaryJson: summary,
    },
  });

  return eventSummary;
};
