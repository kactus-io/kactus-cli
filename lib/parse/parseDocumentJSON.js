const Path = require('path')
const fs = require('../fs-promise')
const stringify = require('json-stable-stringify')
const { parse } = require('../archive-utils')

function parseLayerStyles (data, dirname, key) {
  const styles = data[key]
  if (styles && styles.objects && styles.objects.length) {
    const path = Path.join(dirname, key)
    return fs.mkdir(path).then(() => {
      return Promise.all(styles.objects.map(o =>
        fs.writeFile(
          Path.join(path, o.do_objectID + '.json'),
          stringify(o, {
            space: 2
          })
        )
      ))
    })
  }
}

module.exports = function parseDocumentJSON (zip, path, options) {
  return zip.file('document.json').async('string').then((data) => {
    data = parse(data)
    delete data.currentPageIndex
    delete data.pages

    return Promise.all([
      parseLayerStyles(data, options.shareLayerStyles ? options.root : path, 'layerStyles'),
      parseLayerStyles(data, options.shareTextStyles ? options.root : path, 'layerTextStyles')
    ]).then(() => {
      delete data.layerStyles
      delete data.layerTextStyles
      return fs.writeFile(
        Path.join(path, 'document.json'),
        stringify(data, {
          space: 2
        })
      )
    })
  })
}
