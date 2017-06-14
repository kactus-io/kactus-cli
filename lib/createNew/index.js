const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const importDocumentJSON = require('../import/importDocumentJSON')
const importPage = require('../import/importPage')

module.exports = function (path, options) {
  options = options || {}
  const zip = new JSZip()
  zip.file('user.json', '{}') // dummy user.json
  zip.folder('previews')
  zip.folder('images')

  return Promise.all((options.sharedPages || []).map(
    name => importPage(zip, options.root || Path.dirname(path), name)
  ))
  .then((pages) => importDocumentJSON(zip, path, pages, options))
  .then(() => fs.writeZipToFile(zip, path + '.sketch'))
}
