const prisma = require("../db/prisma");
const { uploadToS3 } = require("./s3Upload.service");
const { analyzeDisasterImage } = require("./gemini.service");
const { generateEmergencyVoiceScript } = require("./gemini.service");
const crypto = require("crypto");

function generateJoinCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
exports.processMobileUpload = async (file, latitude, longitude, userId) => {

  const s3Result = await uploadToS3(
    file,
    null,
    "mobile-uploads/"
  );

  const geminiResult = await analyzeDisasterImage(
    file.buffer,
    file.mimetype
  );

  const {
    disaster_type,
    severity,
    confidence,
    title
  } = geminiResult;

  const result = await prisma.$transaction(async (tx) => {

    let project = null;
    let joinCode;
    let exists = true;

    while (exists) {
      joinCode = generateJoinCode();

      const existingProject = await tx.project.findUnique({
        where: { joinCode }
      });

      if (!existingProject) exists = false;
    }

    if (
      confidence > 0.75 &&
      disaster_type !== "none" &&
      severity !== "LOW"
    ) {
      project = await tx.project.create({
        data: {
          title,
          location: `Lat:${latitude},Lng:${longitude}`,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          disasterType: disaster_type,
          status: "CREATED",
          creatorId: userId, 
          joinCode,
          joinEnabled: true
        }
      });

      // Add creator as coordinator
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: "COORDINATOR",
          status: "APPROVED",
          joinedAt: new Date(),
        }
      });
      await tx.chatRoom.create({
      data: {
        projectId: createdProject.id
        }
      });
    }

    const mobileReport = await tx.mobileReport.create({
      data: {
        userId, 
        projectId: project?.id || null,
        originalName: file.originalname,
        s3Key: s3Result.s3Key,
        s3Url: s3Result.s3Url,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        disasterType: disaster_type,
        severityLevel: severity,
        confidence,
        analysisJson: geminiResult,
        status: "PENDING"
      }
    });

    return { project, mobileReport };
  });

  return result;
};

const { resolveNearestAuthorities } = require("./authority.service");
const { triggerAlertToAuthority } = require("./alert.service");
const { getPlaceNameFromCoordinates } = require("./location.service");

exports.confirmMobileReport = async (mobileReportId) => {
  const report = await prisma.mobileReport.findUnique({
    where: { id: mobileReportId }
  });

  if (!report) {
    throw new Error("Mobile report not found");
  }

  if (report.status !== "PENDING") {
    throw new Error("Report already processed");
  }

  const aiRecommended =
    report.severityLevel === "HIGH" ||
    report.severityLevel === "CRITICAL";

  // 1️⃣ Update report status
  const updatedReport = await prisma.mobileReport.update({
    where: { id: mobileReportId },
    data: { status: "CONFIRMED" }
  });

  //2️⃣ Resolve nearest authorities
  const { police, hospital, fire } =
    await resolveNearestAuthorities(
      report.latitude,
      report.longitude
    );  
    console.log(police,hospital,fire);

  authorities = [
    {
      type: "POLICE",
      data: {
        name: "Test Police Station",
        phone: process.env.TEST_PHONE_NUMBER,
        email: process.env.TEST_EMAIL
      }
    }/*,
    {
      type: "HOSPITAL",
      data: {
        name: "Test Hospital",
        phone: process.env.TEST_PHONE_NUMBER_1,
        email: process.env.TEST_EMAIL_1
      }
    },
    {
      type: "FIRE",
      data: {
        name: "Test Fire Station",
        phone: process.env.TEST_PHONE_NUMBER_2,
        email: process.env.TEST_EMAIL_2
      }
    }*/
  ];

  /*
  // 

    const authorities = [
    { type: "POLICE", data: police },
    { type: "HOSPITAL", data: hospital },
    { type: "FIRE", data: fire }
  ];
    */
  // 3️⃣ Send alert + create AlertLog entries
  const locationName = await getPlaceNameFromCoordinates(
  report.latitude,
  report.longitude
  );


  const voiceMessage = await generateEmergencyVoiceScript(report,locationName);
  
  for (const authority of authorities) {
    if (!authority.data) continue;

    const deliveryResult = await triggerAlertToAuthority(
      report,
      authority.data,
      voiceMessage,
    );

    await prisma.alertLog.create({
      data: {
        mobileReportId: report.id,
        authorityType: authority.type,
        authorityName: authority.data.name || "Unknown",
        phone: authority.data.phone || null,
        email: authority.data.email || null,
        voiceStatus: deliveryResult.voiceStatus,
        smsStatus: deliveryResult.smsStatus,
        emailStatus: deliveryResult.emailStatus
      }
    });
  }

  return {
    ...updatedReport,
    aiRecommended
  };
};

exports.getAlertsByMobileReport = async (mobileReportId) => {
  const alerts = await prisma.alertLog.findMany({
    where: { mobileReportId },
    orderBy: { createdAt: "desc" }
  });

  return alerts;
};