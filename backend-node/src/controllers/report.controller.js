const prisma = require("../db/prisma");
const { generateTextReport } = require("../services/textgen.service");
const { resolveNearestAuthorities } = require("../services/authority.service");

exports.generateReport = async (req, res) => {
  // 🔐 CORS (MANDATORY for browser streaming)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const send = (data) => {
    res.write(JSON.stringify(data) + "\n");
  };

  const { projectId } = req.params;

  try {
    send({ stage: "started", message: "Report generation started" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      send({ stage: "error", error: "Project not found" });
      return res.end();
    }

    send({ stage: "project_loaded" });

    const inputs = await prisma.input.findMany({
      where: { projectId, analysisJson: { not: null } },
    });

    send({ stage: "inputs_loaded", count: inputs.length });

    const eventSummary = await prisma.eventSummary.findUnique({
      where: { projectId },
    });

    if (!eventSummary) {
      send({ stage: "error", error: "Event summary not generated yet" });
      return res.end();
    }

    send({ stage: "event_summary_loaded" });

    const { police, hospital, fire } =
        await resolveNearestAuthorities(
          project.latitude,
          project.longitude
        );  

    const payload = {
      project: {
        id: project.id,
        location: project.location,
        disasterType: project.disasterType,
      },
      contacts:{
        police,
        hospital,
        fire,
      },
      eventSummary: eventSummary.summaryJson,
      inputs: inputs.map((i) => i.analysisJson),
    };

    send({ stage: "calling_Textgen" });

// 🔁 HEARTBEAT to keep ngrok alive
    let heartbeat = setInterval(() => {
      try {
        res.write(JSON.stringify({ stage: "heartbeat" }) + "\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000); // every 20 seconds (safe for ngrok)

    let textgenResult;

    try {
      textgenResult = await generateTextReport(payload, {
        onToken: (token) => {
          send({ stage: "Textgen_stream", chunk: token });
        },
      });
    } catch (TextgenErr) {
      console.error("Textgen error:", TextgenErr);
      send({ stage: "error", error: "Text generation failed" });
      clearInterval(heartbeat);
      return res.end();
    }

// 🛑 stop heartbeat once Textgen is done
    clearInterval(heartbeat);


    send({ stage: "Textgen_complete" });

    const lastReport = await prisma.report.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });

    const nextVersion = lastReport ? lastReport.version + 1 : 1;

    const report = await prisma.report.create({
      data: {
        projectId,
        version: nextVersion,
        content: textgenResult.fullText,
      },
    });

    send({ stage: "saved", reportId: report.id });
    send({ stage: "done" });

    res.end();
  } catch (err) {
    console.error("REPORT PIPELINE ERROR:", err);
    send({ stage: "error", error: "TextGen orchestration failed" });
    res.end();
  }
};

exports.getReportsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const reports = await prisma.report.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        version: true,
        content: true,
      },
      orderBy: {
        version: "desc", // latest version first
      },
    });

    if (!reports || reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No reports found for this project",
      });
    }

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


