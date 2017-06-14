const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const importDocumentJSON = require('./importDocumentJSON')
const importPage = require('./importPage')

function importImage (zip, path, file) {
  return fs.readFile(Path.join(path, 'images', file))
    .then(data => zip.file('images/' + file, data))
}

module.exports = function (path, options) {
  options = options || {}
  const zip = new JSZip()
  zip.file('user.json', '{}') // dummy user.json
  zip.folder('previews')
  zip.folder('images')

  return Promise.all([
    fs.readdir(path)
      .then(files => files.filter(f =>
        f !== 'document.json' &&
        f !== '.DS_Store' &&
        f !== 'layerTextStyles' &&
        f !== 'layerStyles' &&
        f !== 'images'
      ))
      .then(files => Promise.all(
        files.map(f => importPage(zip, path, f)).concat(
        (options.sharedPages || []).map(name => importPage(zip, options.root || Path.dirname(path), name))
        )
      ))
      .then((pages) => importDocumentJSON(zip, path, pages, options)),
    fs.readdir(path + '/images').then(files => Promise.all(
      files.map(f => importImage(zip, path, f))
    ))
  ])
  .then(() => fs.writeZipToFile(zip, path + '.sketch'))
}
