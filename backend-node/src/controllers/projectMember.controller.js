const prisma = require("../db/prisma");

exports.requestToJoin = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    if (existing) {
      return res.status(400).json({
        message: "Already requested or member"
      });
    }

    await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role: "MEMBER",
        status: "PENDING"
      }
    });

    res.json({ message: "Join request sent" });

  } catch (err) {
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
          canDeleteProject: false
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
        canDeleteProject: false
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
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    if (!membership) {
      return res.json({
        exists: false,
        message: "No request found"
      });
    }

    return res.json({
      exists: true,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch request" });
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
        status: "APPROVED"
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