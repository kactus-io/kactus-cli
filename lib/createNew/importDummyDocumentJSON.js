const Path = require('path')
const fs = require('../fs-promise')

function importLayerStyle (dirmame, key) {
  return fs.readdir(dirmame + '/' + key).then(files => {
    return Promise.all(files.map(f =>
      fs.readFile(dirmame + '/' + key + '/' + f).then(JSON.parse)
    ))
  }).catch(function () {
    // not found
    return []
  })
}

function importDocumentJSON (zip, path, sharedLayerStyles, pages) {
  const doc = require('./dummyDocument.json')
  doc.do_objectID = require('uuid/v1')()
  doc.layerStyles = {
    _class: 'sharedStyleContainer',
    objects: sharedLayerStyles[0] || []
  }
  doc.layerTextStyles = {
    _class: 'sharedTextStyleContainer',
    objects: sharedLayerStyles[1] || []
  }
  doc.pages = pages.map(p => ({
    _class: 'MSJSONFileReference',
    _ref_class: 'MSImmutablePage',
    _ref: 'pages/' + p.do_objectID
  }))
  doc.currentPageIndex = 0
  return zip.file('document.json', JSON.stringify(doc))
}

module.exports = function (zip, path, pages, options) {
  const dirname = Path.dirname(path)
  return Promise.all([
    importLayerStyle(options.shareLayerStyles ? (options.root || dirname) : path, 'layerStyles'),
    importLayerStyle(options.shareTextStyles ? (options.root || dirname) : path, 'layerTextStyles')
  ]).then((sharedLayerStyles) => {
    return importDocumentJSON(zip, path, sharedLayerStyles, pages)
  })
  .then(() => {
    const meta = require('../import/dummyMeta.json')
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
    return zip.file('meta.json', JSON.stringify(meta))
  })
}
