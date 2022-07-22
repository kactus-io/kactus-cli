/* @ts-check */
const Path = require("path");
const walk = require("./walk");

module.exports = function (path) {
  var config = {};
  try {
    var configPath = require.resolve(
      path[0] !== "/" // handle absolute path
        ? Path.join(process.cwd(), path, "kactus.json")
        : Path.join(path, "kactus.json")
    );
    delete require.cache[configPath];
    config = require(configPath);
  } catch (err) {}

  return walk(path).then(function (result) {
    const files = result.parsedFiles.reduce(function (prev, f) {
      prev[f] = {
        path: f,
        id: f,
        parsed: true,
        imported: false,
      };
      return prev;
    }, {});
    result.sketchFiles.forEach(function (f) {
      if (files[f.path]) {
        files[f.path].imported = true;
        files[f.path].lastModified = f.lastModified;
      } else {
        files[f.path] = {
          path: f.path,
          id: f.path,
          parsed: false,
          imported: true,
          lastModified: f.lastModified,
        };
      }
    });

    return {
      config: config,
      files: Object.keys(files).map(function (f) {
        return files[f];
      }),
    };
  });
};
