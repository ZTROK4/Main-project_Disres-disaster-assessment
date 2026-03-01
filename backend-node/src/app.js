const express = require("express");
const cors = require("cors");

const projectRoutes = require("./routes/project.routes");
const uploadRoutes = require("./routes/upload.routes");
const reportRoutes = require("./routes/report.routes");
const eventRoutes = require("./routes/event.routes");
const analyzeRoutes = require("./routes/analyze.routes");
const odmRoutes = require("./routes/odm.routes");
const odmRunroutes=require("./routes/odmRun.routes");
const mobileReportRoutes = require("./routes/mobileReport.routes");
const chatRoutes=require("./routes/chat.routes");
//const userRoutes = require("./routes/user.routes")
//const authRoutes=require("./routes/auth.routes");
//const authenticate = require("./middleware/auth.middleware")

const app = express(); // ✅ FIRST

app.use(cors());
app.use(express.json());

//app.use("/auth",authRoutes);

//app.use(authenticate);
// ---- Routes ----
app.use("/projects", projectRoutes);
app.use(uploadRoutes);
app.use("/reports",reportRoutes);
app.use(eventRoutes);
app.use(analyzeRoutes);
//app.use("/users", userRoutes)

app.use("/api/mobile-report", mobileReportRoutes);

// ODM (keep this explicit)
app.use("/api", odmRoutes);
app.use(odmRunroutes);
app.use("/chat",chatRoutes);

module.exports = app;
