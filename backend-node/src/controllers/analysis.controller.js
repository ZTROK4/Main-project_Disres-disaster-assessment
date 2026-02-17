const path = require("path");
const { uploadToS3 } = require("../services/s3.service");

exports.handleClusterUpload = async (req, res) => {
  const projectId = req.params.projectId;
  const files = req.files;

  const uploadedFiles = [];

  for (const file of files) {
    const s3Key = `projects/${projectId}/${file.originalname}`;

    const s3Url = await uploadToS3(
      file.path,
      s3Key,
      file.mimetype
    );

    uploadedFiles.push({
      originalName: file.originalname,
      s3Url
    });
  }

  res.json({
    project_id: projectId,
    files_uploaded: uploadedFiles
  });
};
