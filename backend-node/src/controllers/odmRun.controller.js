const prisma = require("../db/prisma");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  downloadFolderFromS3,
  uploadFolderToS3,
} = require("../services/odm.s3.service");

const ODM_BASE = path.join(process.cwd(), "odm-workspace");

// ✅ ODM final output folders ONLY
const FINAL_FOLDERS = [
  "odm_orthophoto",
  "odm_texturing_25d",
  "odm_georeferencing",
  "odm_report",
];

exports.runOdmReconstruction = async (req, res) => {
  const { projectId, version } = req.params;

  const odm = await prisma.reconstruction.findUnique({
    where: {
      projectId_version: {
        projectId,
        version: Number(version),
      },
    },
  });

  if (!odm) {
    return res.status(404).json({ error: "ODM version not found" });
  }

  // ✅ ODM expected project structure
  const basePath = path.join(
    ODM_BASE,
    "projects",
    projectId,
    "reconstructions",
    `v${version}`,
    "project"
  );

  const imagesDir = path.join(basePath, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  await prisma.reconstruction.update({
    where: { id: odm.id },
    data: { status: "RUNNING" },
  });

  // ✅ DOWNLOAD INPUT IMAGES
  await downloadFolderFromS3(odm.inputS3Prefix, imagesDir);

  // 🚀 RESPOND IMMEDIATELY (NON-BLOCKING)
  res.status(202).json({
    message: "ODM started",
    projectId,
    version,
  });

  // ✅ CORRECT ODM COMMAND (THIS WAS CRITICAL)
  const cmd = `docker run --rm \
    -v "${basePath}:/datasets/project" \
    opendronemap/odm \
    --project-path /datasets \
    project \
    --max-concurrency 4`;

  exec(cmd, async (error, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);

    // ❌ ODM FAILED
    if (error || !stdout.includes("ODM app finished")) {
      await prisma.reconstruction.update({
        where: { id: odm.id },
        data: { status: "FAILED" },
      });
      console.error("ODM FAILED:", projectId, version);
      return;
    }

    // ✅ UPLOAD ONLY FINAL OUTPUTS
    const outputS3Prefix = `odm/projects/${projectId}/reconstructions/v${version}/output/`;

    for (const folder of FINAL_FOLDERS) {
      const localPath = path.join(basePath, folder);

      if (fs.existsSync(localPath)) {
        await uploadFolderToS3(
          localPath,
          `${outputS3Prefix}${folder}/`
        );
      }
    }

    await prisma.reconstruction.update({
      where: { id: odm.id },
      data: {
        status: "COMPLETED",
        outputS3Prefix,
        completedAt: new Date(),
      },
    });

    // 🧹 SAFE CLEANUP (AFTER UPLOAD)
    fs.rmSync(
      path.join(
        ODM_BASE,
        "projects",
        projectId,
        "reconstructions",
        `v${version}`
      ),
      { recursive: true, force: true }
    );

    console.log("ODM COMPLETED:", projectId, version);
  });
};

exports.listReconstructions = async (req, res) => {
  const { projectId } = req.params;

  try {
    const reconstructions = await prisma.reconstruction.findMany({
      where: { projectId },
      orderBy: { version: "desc" },
    });

    res.json(reconstructions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list reconstructions" });
  }
};
