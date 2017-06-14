const Path = require('path')
const fs = require('../fs-promise')

function parseLayerStyles (data, dirname, key) {
  const styles = data[key]
  if (styles && styles.objects && styles.objects.length) {
    const path = Path.join(dirname, key)
    return fs.mkdir(path).then(() => {
      return Promise.all(styles.objects.map(o =>
        fs.writeFile(
          Path.join(path, o.do_objectID + '.json'),
          JSON.stringify(o, null, 2)
        )
      ))
    })
  }
}

module.exports = function parseDocumentJSON (zip, path, options) {
  return zip.file('document.json').async('string').then((data) => {
    data = JSON.parse(data)
    delete data.currentPageIndex
    delete data.pages

    const dirname = Path.dirname(path)

    return Promise.all([
      parseLayerStyles(data, options.shareLayerStyles ? (options.root || dirname) : path, 'layerStyles'),
      parseLayerStyles(data, options.shareTextStyles ? (options.root || dirname) : path, 'layerTextStyles')
    ]).then(() => {
      delete data.layerStyles
      delete data.layerTextStyles
      return fs.writeFile(
        Path.join(path, 'document.json'),
        JSON.stringify(data, null, 2)
      )
    })
  })
}
