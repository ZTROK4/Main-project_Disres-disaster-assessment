const prisma = require("../db/prisma");
const crypto = require("crypto");

function generateJoinCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
exports.createProject = async (req, res) => {
  try {
    const { title, location, latitude, longitude, disasterType } = req.body;

    if (!location) {
      return res.status(400).json({ error: "location is required" });
    }

    const project = await prisma.$transaction(async (tx) => {

      // 🔐 Generate unique join code
      let joinCode;
      let exists = true;

      while (exists) {
        joinCode = generateJoinCode();

        const existingProject = await tx.project.findUnique({
          where: { joinCode }
        });

        if (!existingProject) exists = false;
      }

      const createdProject = await tx.project.create({
        data: {
          title,
          location,
          latitude,
          longitude,
          disasterType,
          creatorId: req.user.id,
          joinCode,
          joinEnabled: true
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: createdProject.id,
          userId: req.user.id,
          role: "COORDINATOR",
          status: "APPROVED",
          joinedAt: new Date(),
        },
      });

      await tx.chatRoom.create({
        data: {
          projectId: createdProject.id
        }
      });

      return createdProject;
    });

    res.status(201).json(project);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
};

exports.getProjectBasicDetails = async (req, res) => {
  try {

    const userId = req.user.id;

    const project = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            members: {
              some: {
                userId,
                status: "APPROVED",
              },
            },
          },
        ],
      },
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
          },
        },
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

exports.getMyProjects = async (req, res) => {
  const userId = req.user.id;

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            members: {
              some: {
                userId,
                status: "APPROVED"
              }
            }
          }
        ]
      },
      include: {
        members: {
          where: { userId },
          select: {
            role: true,
            status: true
          }
        }
      }
    });

    const formatted = projects.map((project) => {
      const isCreator = project.creatorId === userId;

      let role = null;
      if (isCreator) {
        role = "CREATOR";
      } else if (project.members.length > 0) {
        role = project.members[0].role;
      }
  

      return {
        id: project.id,
        title: project.title,
        location: project.location,
        disasterType: project.disasterType,
        latitude: project.latitude,
        longitude: project.longitude,
        role
      };
    
    });

    res.json({
      count: formatted.length,
      projects: formatted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

exports.getJoinCode = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Check membership
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (!member) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Optional: Only coordinator can view
    if (member.role !== "COORDINATOR") {
      return res.status(403).json({ error: "Only coordinator can view join code" });
    }

    // 2️⃣ Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        joinCode: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      joinCode: project.joinCode,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch join code" });
  }
};