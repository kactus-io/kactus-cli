/* @ts-check */
const fs = require("fs-extra");
const { stringify } = require("../archive-utils");
const getDummyMeta = require("./getDummyMeta");

function importMeta(zip, pages, options, existingMeta) {
  const meta = getDummyMeta(options.sketchVersion, existingMeta);
  meta.pagesAndArtboards = pages.reduce((prev, page) => {
    prev[page.do_objectID] = {
      name: page.name,
      artboards: page.layers.reduce((prev2, l) => {
        prev2[l.do_objectID] = {
          name: l.name,
        };
        return prev2;
      }, {}),
    };
    return prev;
  }, {});
  return zip.file("meta.json", stringify(meta));
}

module.exports = function (zip, path, pages, sharedStyles, options) {
  return fs
    .readFile(path + "/document.json", "utf8")
    .then(JSON.parse)
    .then((doc) => {
      doc.layerStyles = {
        _class: "sharedStyleContainer",
        objects: sharedStyles[0] || [],
      };
      doc.layerTextStyles = {
        _class: "sharedTextStyleContainer",
        objects: sharedStyles[1] || [],
      };

      doc.pages = pages
        .sort((a, b) => {
          return doc.pages.indexOf(a.name) - doc.pages.indexOf(b.name);
        })
        .map((p) => ({
          _class: "MSJSONFileReference",
          _ref_class: "MSImmutablePage",
          _ref: "pages/" + p.do_objectID,
        }));
      doc.currentPageIndex = 0;

      importMeta(zip, pages, options, doc.meta);

      delete doc.meta;
      return zip.file("document.json", stringify(doc));
    });
};
