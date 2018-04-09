/* @ts-check */
const Path = require('path')
const fs = require('../fs-promise')
const { stringify } = require('../archive-utils')

function getLayer (newPath, layer) {
  return fs.readFile(newPath + '.json') // try to fetch the parent/id.json
    .catch(() => fs.readFile(Path.join(newPath, layer.class + '.json'))) // if it failed, fetch parent/id/class.json
}

function importLayer (zip, path, layer, sharedStyles) {
  const newPath = Path.join(path, layer.id)

  let abort = false

  return getLayer(newPath, layer)
    .catch(() => {
      // if we don't find the layer, just skip it, there was something wrong
      console.warn('Cound not find the layer ' + newPath + '. This is pretty bad, it means that a merge went wrong. Trying to skip it and recover.')
      abort = true
    })
    .then(res => {
      if (abort || !res) {
        return
      }
      return JSON.parse(res)
    })
    .then((doc) => {
      if (abort || !doc) {
        return
      }
      // if there is _class, it means that there is an override
      if (doc.style && doc.style.sharedObjectID && !doc.style._class && sharedStyles[doc.style.sharedObjectID]) {
        // if not, populate with the shared style
        doc.style = sharedStyles[doc.style.sharedObjectID]
      }
      return doc
    })
    .then((doc) => {
      if (abort || !doc) {
        return undefined
      }
      if (doc.layers) {
        return Promise.all(doc.layers.map(l => importLayer(zip, newPath, l, sharedStyles)))
        .then(layers => {
          doc.layers = layers.filter(l => l)
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
          doc.layers = layers.filter(l => l)
          return doc
        })
    })
    .then((doc) => {
      zip.file(Path.join('pages', doc.do_objectID + '.json'), stringify(doc))
      return doc
    })
}
