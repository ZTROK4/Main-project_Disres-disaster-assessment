const prisma = require("../db/prisma");

exports.requestToJoin = async (req, res) => {
  const { joinCode } = req.body;
  const userId = req.user.id;

  try {
    if (!joinCode) {
      return res.status(400).json({
        message: "Join code is required"
      });
    }

    // 1️⃣ Find project by joinCode
    const project = await prisma.project.findUnique({
      where: { joinCode }
    });

    if (!project) {
      return res.status(404).json({
        message: "Invalid join code"
      });
    }

    if (!project.joinEnabled) {
      return res.status(403).json({
        message: "Joining is disabled for this project"
      });
    }

    // 2️⃣ Check existing membership
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId
        }
      }
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        return res.status(400).json({
          message: "You are already a member of this project"
        });
      }

      if (existing.status === "PENDING") {
        return res.status(400).json({
          message: "Your join request is already pending approval"
        });
      }
    }

    // 3️⃣ Create pending request
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: "MEMBER",
        status: "PENDING"
      }
    });

    res.json({
      message: "Join request sent successfully. Waiting for approval."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Request failed" });
  }
};

exports.updateMemberStatus = async (req, res) => {
  const { projectId, userId } = req.params;
  const { action } = req.body; // APPROVE | REJECT

  try {
    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updated = await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId }
      },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        joinedAt: action === "APPROVE" ? new Date() : null
      }
    });

    res.json({ message: "Member updated", updated });

  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

exports.deleteProjectMember = async (req, res) => {
  const { projectId, userId } = req.params;
  console.log("asdasdasd",projectId,userId);
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    res.json({ message: "Member removed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove member" });
  }
};
exports.updateMemberRole = async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body; // "COORDINATOR" or "MEMBER"

  try {
    if (!["COORDINATOR", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check membership exists
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });


    if (!membership) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (membership.status !== "APPROVED") {
      return res.status(400).json({
        error: "Cannot change role of non-approved member"
      });
    }

    // Prevent self-demotion edge case (optional but recommended)
    if (
      role === "MEMBER" &&
      membership.role === "COORDINATOR"
    ) {
      const coordinatorCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: "COORDINATOR",
          status: "APPROVED"
        }
      });

      if (coordinatorCount <= 1) {
        return res.status(400).json({
          error: "Cannot remove the last coordinator"
        });
      }
    }

    const updated = await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId }
      },
      data: { role }
    });

    res.json({
      message: "Role updated successfully",
      updated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Role update failed" });
  }
};

exports.getMyProjectRole = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { creatorId: true }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 👑 Creator — supreme authority
    if (project.creatorId === userId) {
      return res.json({
        role: "CREATOR",
        status: "APPROVED",
        isCreator: true,
        permissions: {
          canApproveMembers: true,
          canPromoteMembers: true,
          canRunReconstruction: true,
          canGenerateReport: true,
          canDeleteProject: true,
          canChat: true
        }
      });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    if (!membership) {
      return res.json({
        role: null,
        status: null,
        isCreator: false,
        permissions: {
          canApproveMembers: false,
          canPromoteMembers: false,
          canRunReconstruction: false,
          canGenerateReport: false,
          canDeleteProject: false,
          canChat: true
        }
      });
    }

    const isApproved = membership.status === "APPROVED";
    const isCoordinator = membership.role === "COORDINATOR";

    return res.json({
      role: membership.role,
      status: membership.status,
      isCreator: false,
      permissions: {
        canApproveMembers: isApproved && isCoordinator,
        canPromoteMembers: isApproved && isCoordinator,
        canRunReconstruction: isApproved && isCoordinator,
        canGenerateReport: isApproved && isCoordinator,
        canDeleteProject: false,
        canChat: true
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch role" });
  }
};


exports.getPendingRequests = async (req, res) => {
  const { projectId } = req.params;

  try {
    const requests = await prisma.projectMember.findMany({
      where: {
        projectId,
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return res.json({
      count: requests.length,
      requests
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};


exports.getMyJoinRequest = async (req, res) => {
  const userId = req.user.id;

  try {
    const requests = await prisma.projectMember.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      projectId: r.project.id,
      projectTitle: r.project.title,
      role: r.role,
      status: r.status,
    }));
    console.log(formatted);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

exports.cancelJoinRequest = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    if (!membership) {
      return res.status(404).json({
        error: "No join request found"
      });
    }

    if (membership.status !== "PENDING") {
      return res.status(400).json({
        error: "Only pending requests can be cancelled"
      });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    return res.json({
      message: "Join request cancelled successfully"
    });

  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
};

exports.getProjectMembers = async (req, res) => {
  const { projectId } = req.params;

  try {
    // 1️⃣ Fetch project + creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        creatorId: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 2️⃣ Fetch only APPROVED members
    const members = await prisma.projectMember.findMany({
  where: {
    projectId,
    status: "APPROVED",
    userId: {
      not: project.creatorId   // ⬅ exclude creator
    }
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        designation: true
      }
    }
  },
  orderBy: { createdAt: "asc" }
});
    // 3️⃣ Format response
    const formattedMembers = [
      {
        id: project.creator.id,
        name: project.creator.name,
        email: project.creator.email,
        designation: project.creator.designation,
        role: "CREATOR",
        status: "APPROVED"
      },
      ...members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        designation: m.user.designation,
        role: m.role,
        status: m.status
      }))
    ];

    res.json({
      count: formattedMembers.length,
      members: formattedMembers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
};