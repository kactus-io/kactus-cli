/* @ts-check */
var find = require("../find");
var importFolder = require("../import");

module.exports = function (path) {
  var found = find(path);
  return Promise.all(
    found.parsedFiles.map((f) => importFolder(f, found.config))
  );
};
