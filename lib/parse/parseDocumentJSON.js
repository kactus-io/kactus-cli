const Path = require('path')
const fs = require('../fs-promise')

function parseLayerStyles (data, dirname, key) {
  if (data[key] && data[key].objects && data[key].objects.length) {
    const path = Path.join(dirname, key)
    return fs.mkdir(path).then(() => {
      return Promise.all(data[key].objects.map(o =>
        fs.writeFile(
          Path.join(path, o.do_objectID + '.json'),
          JSON.stringify(o, null, 2)
        )
      ))
    }).then(() => {
      delete data[key]
    })
  }
}

module.exports = function parseDocumentJSON (zip, path, options) {
  return zip.file('document.json').async('string').then((data) => {
    data = JSON.parse(data)
    delete data.currentPageIndex

    const dirname = Path.dirname(path)

    return Promise.all([
      parseLayerStyles(data, options.shareLayerStyles ? (options.root || dirname) : path, 'layerStyles'),
      parseLayerStyles(data, options.shareTextStyles ? (options.root || dirname) : path, 'layerTextStyles')
    ]).then(() => fs.writeFile(
      Path.join(path, 'document.json'),
      JSON.stringify(data, null, 2)
    ))
  })
}
