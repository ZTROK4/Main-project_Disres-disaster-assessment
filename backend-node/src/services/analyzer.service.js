const axios = require("axios");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3"); // your S3 client

const ANALYZER_MAP = {
  image: "/analyze/image",
  audio: "/analyze/audio",
  video: "/analyze/video",
  text: "/analyze/text",
};

// 🔐 Generate presigned URL
async function getPresignedUrl(bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
}

exports.runAnalyzer = async ({
  fileType,
  s3Key,        // ✅ PASS THIS
  inputId,
  projectId,
  fileUrl,
}) => {
  const endpoint = ANALYZER_MAP[fileType];

  if (!endpoint) {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // ✅ Generate presigned URL
  const presignedUrl = await getPresignedUrl(
    process.env.S3_BUCKET,
    s3Key
  );

  const response = await axios.post(
    process.env.AI_API_URL + endpoint,
    {
      inputId,
      projectId,
      fileUrl,//: presignedUrl,
    },
    { timeout: 120000 }
  );

  return response.data;
};
