const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const passport = require("passport");
require("./config/passport.config");


const projectRoutes = require("./routes/project.routes");
const uploadRoutes = require("./routes/upload.routes");
const reportRoutes = require("./routes/report.routes");
const eventRoutes = require("./routes/event.routes");
const analyzeRoutes = require("./routes/analyze.routes");
const odmRoutes = require("./routes/odm.routes");
const odmRunroutes = require("./routes/odmRun.routes");
const mobileReportRoutes = require("./routes/mobileReport.routes");
const chatRoutes = require("./routes/chat.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const authenticate = require("./middlewares/auth.middleware");
const projectMemberRoutes = require("./routes/projectMember.routes");
const chatRoomRoutes = require("./routes/chatRoom.routes");

const app = express();
const server = http.createServer(app);

app.use(passport.initialize());

// 🔥 Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*", // restrict in production
  }
});

// 🔐 Socket JWT Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// 🔥 Socket Room Handling
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinProjectRoom", (projectId) => {
    socket.join(projectId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io available globally
app.set("io", io);

// -------------------- Middleware --------------------
app.use(
  cors({
    origin: true,   // allow all origins dynamically
    credentials: true,
  })
);
app.use(express.json());

// Public auth route
app.use("/auth", authRoutes);

// 🔐 Protected routes
app.use(authenticate);

// -------------------- Routes --------------------
app.use("/projects", projectRoutes);
app.use(uploadRoutes);
app.use("/reports", reportRoutes);
app.use(eventRoutes);
app.use(analyzeRoutes);
app.use("/users", userRoutes);
app.use("/api/mobile-report", mobileReportRoutes);
app.use(projectMemberRoutes);
app.use("/api", odmRoutes);
app.use(odmRunroutes);
app.use("/chat", chatRoutes);
app.use(chatRoomRoutes);

// -------------------- Start Server --------------------
//const PORT = process.env.PORT || 4000;

/*
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

*/

// Export for usage in controllers
module.exports = { app, server, io };