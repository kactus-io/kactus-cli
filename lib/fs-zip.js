/* @ts-check */
const fs = require("fs");

/**
 * @param {string | Buffer | URL} [path]
 * @return {Promise<void>}
 */
module.exports.writeFileFromZip = function (zip, file, path) {
  return new Promise((resolve, reject) => {
    zip
      .file(file)
      .nodeStream()
      .pipe(fs.createWriteStream(path))
      .on("finish", function () {
        resolve();
      })
      .on("error", function (err) {
        reject(err);
      });
  });
};

/**
 * @param {string | Buffer | URL} [path]
 * @return {Promise<void>}
 */
module.exports.writeZipToFile = function (zip, path) {
  return new Promise((resolve, reject) => {
    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(fs.createWriteStream(path))
      .on("finish", function () {
        resolve();
      })
      .on("error", function (err) {
        reject(err);
      });
  });
};
