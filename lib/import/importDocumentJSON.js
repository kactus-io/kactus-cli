const fs = require('../fs-promise')
const { stringify } = require('../archive-utils')

function importDocumentJSON (zip, path, sharedStyles, pages) {
  return fs.readFile(path + '/document.json')
    .then(JSON.parse)
    .then((doc) => {
      doc.layerStyles = {
        _class: 'sharedStyleContainer',
        objects: sharedStyles[0] || []
      }
      doc.layerTextStyles = {
        _class: 'sharedTextStyleContainer',
        objects: sharedStyles[1] || []
      }
      doc.pages = pages.map(p => ({
        _class: 'MSJSONFileReference',
        _ref_class: 'MSImmutablePage',
        _ref: 'pages/' + p.do_objectID
      }))
      doc.currentPageIndex = 0
      return zip.file('document.json', stringify(doc))
    })
}

module.exports = function (zip, path, pages, sharedStyles, options) {
  return importDocumentJSON(zip, path, sharedStyles, pages)
  .then(() => {
    const meta = require('./dummyMeta.json')
    if (options.sketchVersion) {
      meta.appVersion = options.sketchVersion
      meta.created.appVersion = options.sketchVersion
    }
    meta.pagesAndArtboards = pages.reduce((prev, page) => {
      prev[page.do_objectID] = {
        name: page.name,
        artboards: page.layers.reduce((prev2, l) => {
          prev2[l.do_objectID] = {
            name: l.name
          }
          return prev2
        }, {})
      }
      return prev
    }, {})
    return zip.file('meta.json', stringify(meta))
  })
}
