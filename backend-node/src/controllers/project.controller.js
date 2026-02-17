const prisma = require("../db/prisma");

exports.createProject = async (req, res) => {
  try {
    const { title, location, latitude, longitude, disasterType } = req.body;

    if (!location) {
      return res.status(400).json({ error: "location is required" });
    }

    const project = await prisma.project.create({
      data: {
        title,
        location,
        latitude,
        longitude,
        disasterType,
      },
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
};
