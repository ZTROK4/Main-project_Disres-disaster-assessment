const axios = require("axios");
const fs = require("fs");
const path = require("path");
const prisma = require("../db/prisma");
const { prepareFolders, runDockerODM } = require("./utils");
const { uploadFolderToS3 } = require("../services/s3-upload.service");

exports.runOdmJob = async (projectId) => {
  const job = await prisma.odmJob.create({
    data: {
      projectId,
      status: "RUNNING",
      startedAt: new Date(),
      inputCount: 0,
    },
  });

  try {
    const images = await prisma.input.findMany({
      where: {
        projectId,
        fileType: "image",
      },
    });

    if (images.length < 5) {
      throw new Error("At least 5 images required for ODM");
    }

    const { images: imgDir, outputs } = prepareFolders(projectId);

    // Download images
    for (const img of images) {
      const res = await axios.get(img.s3Url, { responseType: "arraybuffer" });
      fs.writeFileSync(
        path.join(imgDir, img.originalName),
        res.data
      );
    }

    await runDockerODM({ images: imgDir, outputs });

    const s3Output = await uploadFolderToS3(
      outputs,
      `odm/${projectId}`
    );

    await prisma.odmJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        outputUrl: s3Output,
        finishedAt: new Date(),
        inputCount: images.length,
      },
    });

    return { success: true, outputUrl: s3Output };
  } catch (err) {
    await prisma.odmJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        log: err.message,
        finishedAt: new Date(),
      },
    });

    throw err;
  }
};
