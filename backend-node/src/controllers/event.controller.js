const { generateEventSummary } = require("../services/event.service");

exports.generateEventSummary = async (req, res) => {
  const { projectId } = req.params;

  try {
    const eventSummary = await generateEventSummary(projectId);

    res.json({
      message: "Event summary generated",
      eventSummary,
    });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
};
