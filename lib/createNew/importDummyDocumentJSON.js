/* @ts-check */
const { stringify } = require("../archive-utils");
const getDummyMeta = require("../import/getDummyMeta");
const { v1: uuid } = require("uuid");

/**
 * @typedef {Object} Layer
 * @prop {string} do_objectID
 * @prop {string} name
 * @prop {Layer[]} layers
 */

/**
 * @param {any} [zip]
 * @param {string} [path]
 * @param {any} [sharedStyles]
 * @param {Layer[]} [pages]
 * @return {Promise<any>}
 */
function importDocumentJSON(zip, path, sharedStyles, pages) {
  const doc = require("./dummyDocument.json");
  doc.do_objectID = uuid();
  doc.layerStyles = {
    _class: "sharedStyleContainer",
    objects: sharedStyles[0] || [],
  };
  doc.layerTextStyles = {
    _class: "sharedTextStyleContainer",
    objects: sharedStyles[1] || [],
  };
  doc.pages = pages.map((p) => ({
    _class: "MSJSONFileReference",
    _ref_class: "MSImmutablePage",
    _ref: "pages/" + p.do_objectID,
  }));
  doc.currentPageIndex = 0;
  return Promise.resolve(zip.file("document.json", stringify(doc)));
}

/**
 * @param {any} [zip]
 * @param {string} [path]
 * @param {any} [sharedStyles]
 * @param {Layer[]} [pages]
 * @return {Promise<any>}
 */
module.exports = function (zip, path, pages, sharedStyles, options) {
  return importDocumentJSON(zip, path, sharedStyles, pages).then(() => {
    const meta = getDummyMeta(options.sketchVersion);
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
  });
};
