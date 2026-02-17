const prisma = require("../db/prisma");
const { uploadToS3 } = require("../services/s3.service");

exports.uploadCluster = async (req, res) => {
  const { projectId } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const uploads = [];

    for (const file of req.files) {
      const { s3Key, s3Url } = await uploadToS3(file, projectId);

      const input = await prisma.input.create({
        data: {
          projectId,
          fileType: file.mimetype.split("/")[0], // image, video, audio, text
          originalName: file.originalname,
          s3Key,
          s3Url,
        },
      });

      uploads.push(input);
    }

    res.status(201).json({
      message: "Files uploaded successfully",
      count: uploads.length,
      inputs: uploads,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "File upload failed" });
  }
};
