const prisma = require("../db/prisma");
const { uploadToS3 } = require("../services/s3Upload.service");

exports.uploadOdmCluster = async (req, res) => {
  const { projectId } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No images uploaded" });
  }

  try {
    // 1️⃣ Get next ODM version
    const last = await prisma.reconstruction.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });

    const version = last ? last.version + 1 : 1;

    const inputS3Prefix = `odm/projects/${projectId}/reconstructions/v${version}/input/`;

    // 2️⃣ Upload images to S3 (ODM input folder)
    for (const file of req.files) {
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          error: "ODM accepts only image files",
        });
      }

      await uploadToS3(file, inputS3Prefix);
    }

    // 3️⃣ Create ODM reconstruction record
    const odm = await prisma.reconstruction.create({
      data: {
        projectId,
        version,
        status: "UPLOADED",
        inputCount: req.files.length,
        inputS3Prefix,
      },
    });

    res.status(201).json({
      message: "ODM input images uploaded",
      odm,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ODM upload failed" });
  }
};
