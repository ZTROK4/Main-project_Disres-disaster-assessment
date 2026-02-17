const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to S3
 *
 * @param {object} file - multer file
 * @param {string|null} projectId - required for normal uploads
 * @param {string|null} basePath - full S3 prefix (used for ODM)
 */
exports.uploadToS3 = async (file, projectId = null, basePath = null) => {
  const fileName = `${uuidv4()}-${file.originalname}`;

  let key;

  if (basePath) {
    // ✅ ODM / custom pipeline uploads
    key = `${basePath.replace(/\/?$/, "/")}${fileName}`;
  } else {
    // ✅ Normal project uploads
    if (!projectId) {
      throw new Error("projectId is required when basePath is not provided");
    }

    key = `projects/${projectId}/${fileName}`;
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return {
    s3Key: key,
    s3Url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};
