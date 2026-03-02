const prisma = require("../db/prisma");

function authorizeProjectAccess(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // 1️⃣ Check project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, creatorId: true }
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // 2️⃣ Allow project creator automatically
      if (project.creatorId === userId) {
        return next();
      }

      // 3️⃣ Check membership
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        }
      });

      if (!membership || membership.status !== "APPROVED") {
        return res.status(403).json({ message: "Access denied" });
      }

      // 4️⃣ Role check (if roles are specified)
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(membership.role)
      ) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Attach membership for controller usage if needed
      req.projectMember = membership;

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({ message: "Authorization failed" });
    }
  };
}

module.exports = authorizeProjectAccess;