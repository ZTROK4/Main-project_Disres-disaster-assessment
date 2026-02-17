const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const s3 = new S3Client({ region: process.env.AWS_REGION });

/* ================================
   ⬇️ DOWNLOAD (FIXED FOR // BUG)
================================ */
exports.downloadFolderFromS3 = async (prefix, localDir) => {
  if (!prefix.endsWith("/")) prefix += "/";

  let continuationToken;

console.log("DOWNLOAD PREFIX:", prefix);



  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: "projects/"+prefix,
        ContinuationToken: continuationToken,
      })
    );
    console.log(
  "S3 OBJECTS:",
  (list.Contents || []).map(o => `"${o.Key}"`)
);


    for (const obj of list.Contents || []) {
  if (obj.Key.endsWith("/")) continue;

  const fileName = path.basename(obj.Key); // 🔥 flatten
  if (!fileName) continue;

  const filePath = path.join(localDir, fileName);

  const data = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: obj.Key,
    })
  );

  await new Promise((resolve, reject) => {
    data.Body
      .pipe(fs.createWriteStream(filePath))
      .on("finish", resolve)
      .on("error", reject);
  });

  console.log("Downloaded:", filePath);
}


    continuationToken = list.NextContinuationToken;
  } while (continuationToken);
};

/* ================================
   ⬆️ UPLOAD (RECURSIVE & SAFE)
================================ */
const uploadRecursive = async (dir, prefix, baseDir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // ✅ baseDir is ALWAYS defined now
    const relativePath = path
      .relative(baseDir, fullPath)
      .replace(/\\/g, "/");

    const key = `${prefix}${relativePath}`;

    if (entry.isDirectory()) {
      await uploadRecursive(fullPath, prefix, baseDir);
    } else {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: fs.createReadStream(fullPath),
        })
      );

      console.log("Uploaded:", key);
    }
  }
};

exports.uploadFolderToS3 = async (localDir, prefix) => {
  if (!prefix.endsWith("/")) prefix += "/";

  // 🔥 CRITICAL FIX: pass localDir as baseDir
  await uploadRecursive(localDir, prefix, localDir);
};