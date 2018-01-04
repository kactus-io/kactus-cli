/* @ts-check */
const Path = require('path')
const fs = require('../fs-promise')
const { stringify } = require('../archive-utils')

function importLayer (zip, path, layer, sharedStyles) {
  const newPath = Path.join(path, layer.id)

  return fs.readFile(newPath + '.json')
    .catch(() => fs.readFile(Path.join(newPath, layer.class + '.json')))
    .then(JSON.parse)
    .then((doc) => {
      // if there is _class, it means that there is an override
      if (doc.style && doc.style.sharedObjectID && !doc.style._class && sharedStyles[doc.style.sharedObjectID]) {
        // if not, populate with the shared style
        doc.style = sharedStyles[doc.style.sharedObjectID]
      }
      return doc
    })
    .then((doc) => {
      if (doc.layers) {
        return Promise.all(doc.layers.map(l => importLayer(zip, newPath, l, sharedStyles)))
        .then(layers => {
          doc.layers = layers
          return doc
        })
      }
      return doc
    })
}

module.exports = function importPage (zip, path, file, sharedStyles) {
  const newPath = path + '/' + file
  return fs.readFile(Path.join(newPath, 'page.json'))
    .then(JSON.parse)
    .then((doc) => {
      return Promise.all(doc.layers.map(l => importLayer(zip, newPath, l, sharedStyles)))
        .then(layers => {
          doc.layers = layers
          return doc
        })
    })
    .then((doc) => {
      zip.file(Path.join('pages', doc.do_objectID + '.json'), stringify(doc))
      return doc
    })
}
