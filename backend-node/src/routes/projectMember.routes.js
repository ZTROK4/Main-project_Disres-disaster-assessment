const express = require("express");
const projectMemberController = require("../controllers/projectMember.controller");
const authorizeProjectAccess = require("../middlewares/access.middleware");
const router = express.Router();

router.post("/projects/:projectId/join", projectMemberController.requestToJoin);

router.patch("/projects/:projectId/members/:userId",authorizeProjectAccess(["COORDINATOR"]),projectMemberController.updateMemberStatus);

router.patch("/projects/:projectId/members/:userId/role",authorizeProjectAccess(["COORDINATOR"]),projectMemberController.updateMemberRole);

router.get("/projects/:projectId/me", authorizeProjectAccess(),projectMemberController.getMyProjectRole);

router.get(
  "/projects/:projectId/members/requests",
  authorizeProjectAccess(["COORDINATOR"]),
  projectMemberController.getPendingRequests
);

router.get(
  "/projects/:projectId/my-request",
  projectMemberController.getMyJoinRequest
);

router.delete(
  "/projects/:projectId/my-request",
  projectMemberController.cancelJoinRequest
);

router.get(
  "/projects/:projectId/members",
  authorizeProjectAccess(),
  projectMemberController.getProjectMembers
);

module.exports = router;
