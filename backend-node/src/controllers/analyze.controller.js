const prisma = require("../db/prisma");
const { runAnalyzer } = require("../services/analyzer.service");

exports.analyzeProjectInputs = async (req, res) => {
  const { projectId } = req.params;

  try {
    // 1️⃣ Fetch inputs that are not yet analyzed (RAW SQL)
    const inputs = await prisma.$queryRaw`
      SELECT *
      FROM "Input"
      WHERE "projectId" = ${projectId}
        AND "analysisJson" IS NULL
    `;

    if (inputs.length === 0) {
      return res.json({ message: "No unanalyzed inputs found" });
    }

    const results = [];

    // 2️⃣ Run analyzers sequentially
    for (const input of inputs) {
      const analysis = await runAnalyzer({
        fileType: input.fileType,
        s3Key: input.s3Key,   // ✅ IMPORTANT
        inputId: input.id,
        projectId,
        fileUrl:input.s3Url,
      });

      // 3️⃣ Save analysis JSON
      const updated = await prisma.input.update({
        where: { id: input.id },
        data: { analysisJson: analysis },
      });

      results.push(updated);
    }

    res.json({
      message: "Analysis completed",
      analyzedCount: results.length,
      results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
};
