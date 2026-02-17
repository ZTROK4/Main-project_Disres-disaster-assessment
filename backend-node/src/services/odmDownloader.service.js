const fs = require("fs");
const path = require("path");
const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function streamToFile(stream, filePath) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    stream.on("error", reject);
    writeStream.on("finish", resolve);
  });
}

exports.downloadOdmImages = async ({
  projectId,
  version,
  s3Prefix,
}) => {
  const baseDir = path.join(
    process.cwd(),
    "odm-runtime",
    "projects",
    projectId,
    `v${version}`
  );

  const imagesDir = path.join(baseDir, "images");
  const outputDir = path.join(baseDir, "outputs");

  // Ensure directories exist
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const listCmd = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET,
    Prefix: s3Prefix,
  });

  const listed = await s3.send(listCmd);

  if (!listed.Contents || listed.Contents.length === 0) {
    throw new Error("No ODM input images found in S3");
  }

  let count = 0;

  for (const obj of listed.Contents) {
    if (!obj.Key.match(/\.(jpg|jpeg|png)$/i)) continue;

    const fileName = path.basename(obj.Key);
    const localPath = path.join(imagesDir, fileName);

    const getCmd = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: obj.Key,
    });

    const file = await s3.send(getCmd);
    await streamToFile(file.Body, localPath);

    count++;
  }

  return {
    imagesDir,
    outputDir,
    count,
  };
};
