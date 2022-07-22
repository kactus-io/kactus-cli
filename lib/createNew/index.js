/* @ts-check */
const Path = require("path");
const fs = require("fs-extra");
const JSZip = require("jszip");
const { v1: uuid } = require("uuid");
const importDummyDocumentJSON = require("./importDummyDocumentJSON");
const importPage = require("../import/importPage");
const importStyles = require("../import/importStyles");
const { stringify } = require("../archive-utils");
const mapStyles = require("../map-shared-styles");
const fsZip = require("../fs-zip");

function importDummyPage(zip) {
  const doc = require("./dummyPage.json");
  doc.do_objectID = uuid();
  zip.file(Path.join("pages", doc.do_objectID + ".json"), stringify(doc));
  return Promise.resolve(doc);
}

module.exports = function (path, options) {
  options = options || {};
  options.root = options.root || Path.dirname(path);
  const zip = new JSZip();
  zip.file("user.json", "{}"); // dummy user.json
  zip.folder("previews");
  zip.folder("images");

  return importStyles(path, options)
    .then((sharedStyles) => {
      const stylesMap = mapStyles(sharedStyles);
      return Promise.all(
        (options.sharedPages || [])
          .map((name) => importPage(zip, options.root, name, stylesMap))
          .concat(importDummyPage(zip))
      ).then((pages) =>
        importDummyDocumentJSON(zip, path, pages, sharedStyles, options)
      );
    })
    .then(() => fs.mkdirp(Path.dirname(path)))
    .then(() => fsZip.writeZipToFile(zip, path + ".sketch"))
    .then(() => path + ".sketch");
};
