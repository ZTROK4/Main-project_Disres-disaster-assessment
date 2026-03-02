const prisma = require("../db/prisma");

function authorizeMobileReportAccess() {
  return async (req, res, next) => {
    try {
      const { mobileReportId } = req.params;
      const userId = req.user.id;

      const mobileReport = await prisma.mobileReport.findUnique({
        where: { id: mobileReportId },
        select: { id: true, userId: true, projectId: true }
      });

      if (!mobileReport) {
        return res.status(404).json({ message: "Mobile report not found" });
      }

      // 1️⃣ Creator access
      if (mobileReport.userId === userId) {
        req.mobileReport = mobileReport;
        return next();
      }

      // 2️⃣ Project membership access
      if (mobileReport.projectId) {
        const membership = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: mobileReport.projectId,
              userId
            }
          }
        });

        if (membership && membership.status === "APPROVED") {
          req.mobileReport = mobileReport;
          return next();
        }
      }

      return res.status(403).json({ message: "Access denied" });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Authorization failed" });
    }
  };
}

module.exports = authorizeMobileReportAccess;