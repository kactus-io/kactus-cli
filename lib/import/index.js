const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const importDocumentJSON = require('./importDocumentJSON')
const importPage = require('./importPage')
const importStyles = require('./importStyles')
const mapStyles = require('../map-shared-styles')

function importImage (zip, path, file) {
  return fs.readFile(Path.join(path, 'images', file))
    .then(data => zip.file('images/' + file, data))
}

module.exports = function (path, options) {
  options = options || {}
  options.root = options.root || Path.dirname(path)
  const zip = new JSZip()
  zip.file('user.json', '{}') // dummy user.json
  zip.folder('previews')
  zip.folder('images')

  return importStyles(path, options).then(sharedStyles => {
    const stylesMap = mapStyles(sharedStyles)
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
          (options.sharedPages || []).map(name => importPage(zip, options.root, name, sharedStyles)).concat(
            files.map(f => importPage(zip, path, f, stylesMap))
          )
        ))
        .then((pages) => importDocumentJSON(zip, path, pages, sharedStyles, options)),
      fs.readdir(path + '/images').then(files => Promise.all(
        files.map(f => importImage(zip, path, f))
      )).catch(() => { /* no images */ })
    ])
  })
  .then(() => fs.writeZipToFile(zip, path + '.sketch'))
  .then(() => path + '.sketch')
}
