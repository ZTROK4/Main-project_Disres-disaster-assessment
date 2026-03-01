const { analyzeProject } = require("../services/analyze.service");

exports.analyzeProjectInputs = async (req, res) => {
  try {
    const result = await analyzeProject(req.params.projectId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
};