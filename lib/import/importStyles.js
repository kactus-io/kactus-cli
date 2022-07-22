/* @ts-check */
const fs = require("fs-extra");

function importLayerStyle(dirmame, key) {
  return fs
    .readdir(dirmame + "/" + key)
    .then((files) => {
      return Promise.all(
        files
          .filter((f) => /\.json$/.test(f))
          .map((f) =>
            fs.readFile(dirmame + "/" + key + "/" + f, "utf8").then(JSON.parse)
          )
      );
    })
    .catch(function () {
      // not found
      return [];
    });
}

module.exports = function (path, options) {
  return Promise.all([
    importLayerStyle(
      options.shareLayerStyles ? options.root : path,
      "layerStyles"
    ),
    importLayerStyle(
      options.shareTextStyles ? options.root : path,
      "layerTextStyles"
    ),
  ]);
};
