const Path = require('path')
const fs = require('../fs-promise')
const { stringify } = require('../archive-utils')

function importLayer (zip, path, layer, sharedStyles) {
  const newPath = Path.join(path, layer.id)

  return fs.readFile(newPath + '.json')
    .catch(() => fs.readFile(Path.join(newPath, layer.class + '.json')))
    .then(JSON.parse)
    .then((doc) => {
      // if (doc.style && doc.style.sharedObjectID && sharedStyles[doc.style.sharedObjectID]) {
      //   // we are checking for _class for backward compatibility
      //   doc.style = sharedStyles[doc.style.sharedObjectID]
      // }
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
