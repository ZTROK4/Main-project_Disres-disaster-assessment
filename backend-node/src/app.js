const express = require("express");
const cors = require("cors");

const projectRoutes = require("./routes/project.routes");
const uploadRoutes = require("./routes/upload.routes");
const reportRoutes = require("./routes/report.routes");
const eventRoutes = require("./routes/event.routes");
const analyzeRoutes = require("./routes/analyze.routes");
const odmRoutes = require("./routes/odm.routes");
const odmRunroutes=require("./routes/odmRun.routes");
const app = express(); // ✅ FIRST

app.use(cors());
app.use(express.json());

// ---- Routes ----
app.use("/projects", projectRoutes);
app.use(uploadRoutes);
app.use(reportRoutes);
app.use(eventRoutes);
app.use(analyzeRoutes);

// ODM (keep this explicit)
app.use("/api", odmRoutes);
app.use(odmRunroutes);

module.exports = app;
