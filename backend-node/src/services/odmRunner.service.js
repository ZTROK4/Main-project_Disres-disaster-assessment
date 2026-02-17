const { exec } = require("child_process");

exports.runOdmDocker = ({ imagesDir, outputDir }) => {
  return new Promise((resolve, reject) => {
    const command = `
docker run --rm ^
-v "${imagesDir}:/datasets/project/images" ^
-v "${outputDir}:/datasets/project/outputs" ^
opendronemap/odm ^
--project-path /datasets ^
project
`;

    console.log("🚀 Running ODM...");
    console.log(command);

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return reject(err);
      }
      resolve(stdout);
    });
  });
};
