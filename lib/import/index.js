const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const importDocumentJSON = require('./importDocumentJSON')

function importLayer (zip, path, layer) {
  const newPath = Path.join(path, layer.id)

  return fs.readFile(newPath + '.json')
    .catch(() => fs.readFile(Path.join(newPath, layer.class + '.json')))
    .then(JSON.parse)
    .then((doc) => {
      if (doc.image) {
        const imageName = doc.image._ref.replace('images/', '')
        return fs.readFile(Path.join(newPath, imageName + '.png')).then(image =>
            zip.file(doc.image._ref + '.png', image)
          ).then(() => doc)
      }
      return doc
    })
    .then((doc) => {
      if (doc.layers) {
        return Promise.all(doc.layers.map(l => importLayer(zip, newPath, l)))
        .then(layers => {
          doc.layers = layers
          return doc
        })
      }
      return doc
    })
}

function importPage (zip, path, file) {
  const newPath = path + '/' + file
  return fs.readFile(Path.join(newPath, 'page.json'))
    .then(JSON.parse)
    .then((doc) => {
      return Promise.all(doc.layers.map(l => importLayer(zip, newPath, l)))
        .then(layers => {
          doc.layers = layers
          return doc
        })
    })
    .then((doc) => {
      zip.file(Path.join('pages', doc.do_objectID + '.json'), JSON.stringify(doc))
      return doc
    })
}

module.exports = function (path, options) {
  options = options || {}
  const zip = new JSZip()

  return fs.readdir(path)
    .then(files => files.filter(f =>
      f !== 'document.json' &&
      f !== '.DS_Store' &&
      f !== 'layerTextStyles' &&
      f !== 'layerStyles'
    ))
    .then(files => Promise.all(
      files.map(f => importPage(zip, path, f)).concat(
      (options.sharedPages || []).map(name => importPage(zip, options.root || Path.dirname(path), name))
      )
    ))
    .then((pages) => importDocumentJSON(zip, path, pages, options))
    .then(() => {
      zip.file('user.json', '{}') // dummy user.json
      zip.folder('previews')
      return fs.writeZipToFile(zip, path + '.sketch')
    })
}
