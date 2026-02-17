const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

exports.prepareFolders = (projectId) => {
  const base = `G:/DisRes/odm/projects/${projectId}`;
  const images = path.join(base, "images");
  const outputs = path.join(base, "outputs");

  fs.mkdirSync(images, { recursive: true });
  fs.mkdirSync(outputs, { recursive: true });

  return { base, images, outputs };
};

exports.runDockerODM = ({ images, outputs }) => {
  return new Promise((resolve, reject) => {
    const cmd = `
      docker run --rm ^
      -v ${images}:/datasets/images ^
      -v ${outputs}:/datasets/outputs ^
      opendronemap/odm ^
      --project-path /datasets/images site1
    `;

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
};
