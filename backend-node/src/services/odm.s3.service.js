const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const { Upload } = require("@aws-sdk/lib-storage");

const fs = require("fs");
const path = require("path");

const s3 = new S3Client({
  region: process.env.AWS_REGION
});

/* ================================
   ⬇️ DOWNLOAD FOLDER FROM S3
================================ */
exports.downloadFolderFromS3 = async (prefix, localDir) => {

  if (!prefix.endsWith("/")) prefix += "/";

  let continuationToken;

  console.log("DOWNLOAD PREFIX:", prefix);

  do {

    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: "projects/" + prefix,
        ContinuationToken: continuationToken
      })
    );

    console.log(
      "S3 OBJECTS:",
      (list.Contents || []).map(o => `"${o.Key}"`)
    );

    for (const obj of list.Contents || []) {

      if (obj.Key.endsWith("/")) continue;

      const fileName = path.basename(obj.Key);
      if (!fileName) continue;

      const filePath = path.join(localDir, fileName);

      const data = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: obj.Key
        })
      );

      await new Promise((resolve, reject) => {

        const writeStream = fs.createWriteStream(filePath);

        data.Body
          .pipe(writeStream)
          .on("finish", resolve)
          .on("error", reject);

      });

      console.log("Downloaded:", filePath);
    }

    continuationToken = list.NextContinuationToken;

  } while (continuationToken);
};



/* ================================
   ⬆️ RECURSIVE UPLOAD TO S3
================================ */
const uploadRecursive = async (dir, prefix, baseDir) => {

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {

    const fullPath = path.join(dir, entry.name);

    if (!fs.existsSync(fullPath)) continue;

    const relativePath = path
      .relative(baseDir, fullPath)
      .replace(/\\/g, "/");

    const key = `${prefix}${relativePath}`;

    if (entry.isDirectory()) {

      await uploadRecursive(fullPath, prefix, baseDir);

    } else {

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: fs.createReadStream(fullPath)
        },

        queueSize: 4,          // parallel parts
        partSize: 10 * 1024 * 1024 // 10MB
      });

      await upload.done();

      console.log("Uploaded:", key);
    }
  }
};



/* ================================
   ⬆️ UPLOAD FOLDER ENTRY POINT
================================ */
exports.uploadFolderToS3 = async (localDir, prefix) => {

  if (!prefix.endsWith("/")) prefix += "/";

  await uploadRecursive(localDir, prefix, localDir);

};