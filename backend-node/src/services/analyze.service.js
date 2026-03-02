const prisma = require("../db/prisma");
const { runAnalyzer } = require("./analyzer.service");

exports.analyzeProject = async (projectId) => {
  const inputs = await prisma.$queryRaw`
    SELECT *
    FROM "Input"
    WHERE "projectId" = ${projectId}
      AND "analysisJson" IS NULL
  `;

  if (inputs.length === 0) {
    return { message: "No unanalyzed inputs found", analyzedCount: 0 };
  }

  const results = [];

  for (const input of inputs) {
    console.log(input.s3Key);
    const analysis = await runAnalyzer({
      fileType: input.fileType,
      s3Key: input.s3Key,
      inputId: input.id,
      projectId,
      fileUrl: input.s3Url,
    });

    const updated = await prisma.input.update({
      where: { id: input.id },
      data: { analysisJson: analysis },
    });

    results.push(updated);
  }
  console.log("anacom",results);
  return {
    message: "Analysis completed",
    analyzedCount: results.length,
    results,
  };
};