const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const importDummyDocumentJSON = require('./importDummyDocumentJSON')
const importPage = require('../import/importPage')
const { stringify } = require('../archive-utils')

function importDummyPage (zip) {
  const doc = require('./dummyPage.json')
  doc.do_objectID = require('uuid/v1')()
  zip.file(Path.join('pages', doc.do_objectID + '.json'), stringify(doc))
  return Promise.resolve(doc)
}

module.exports = function (path, options) {
  options = options || {}
  const zip = new JSZip()
  zip.file('user.json', '{}') // dummy user.json
  zip.folder('previews')
  zip.folder('images')

  return Promise.all((options.sharedPages || []).map(
    name => importPage(zip, options.root || Path.dirname(path), name)
  ).concat(importDummyPage(zip)))
  .then((pages) => importDummyDocumentJSON(zip, path, pages, options))
  .then(() => fs.writeZipToFile(zip, path + '.sketch'))
}
