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

exports.getProjectBasicDetails = async (req, res) => {
  try {

    const project = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        disasterType: true,
        latitude: true,
        longitude: true,

        mobileReport: {
          select: {
            id: true,
            severityLevel: true,
          }
        }
      },
    });

    // ⚠️ findMany always returns an array
    if (!project || project.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No projects found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error("Error fetching project:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};