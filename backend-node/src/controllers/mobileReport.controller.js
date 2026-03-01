const mobileReportService = require("../services/mobileReport.service");
const { resolveNearestAuthorities } = require("../services/authority.service");
const {uploadToS3} = require("../services/s3.service");
const { analyzeProject } = require("../services/analyze.service");
const {generateEventSummary} =require("../services/event.service");

exports.analyzeMobileReport = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await mobileReportService.processMobileUpload(
      req.file,
      latitude,
      longitude
    );

    const { police, hospital, fire } =
        await resolveNearestAuthorities(
          latitude,
          longitude
        );  

    const projectId= result.project?.id;
    await uploadToS3(req.file,projectId );
    await analyzeProject(projectId);
    await generateEventSummary(projectId);


    return res.status(200).json({
      success: true,
      projectId,
      mobileReportId: result.mobileReport.id,
      disasterType: result.mobileReport.disasterType,
      severity: result.mobileReport.severityLevel,
      confidence: result.mobileReport.confidence,
      police,
      hospital,
      fire,
      requiresConfirmation:
        result.mobileReport.severityLevel === "HIGH" ||
        result.mobileReport.severityLevel === "CRITICAL"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.confirmMobileReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await mobileReportService.confirmMobileReport(id);

    return res.status(200).json({
      success: true,
      message: "Alert confirmed and triggered",
      reportId: result.id
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAlertsByMobileReport = async (req, res) => {
  try {
    const { id } = req.params;

    const alerts = await mobileReportService.getAlertsByMobileReport(id);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alerts"
    });
  }
};