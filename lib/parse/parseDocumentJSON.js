/* @ts-check */
const Path = require('path')
const fs = require('fs-extra')
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

module.exports = function parseDocumentJSON (zip, path, options, pages) {
  return Promise.all([
    zip.file('document.json').async('string'),
    zip.file('meta.json').async('string')
  ]).then((data) => {
    const documentData = parse(data[0])
    delete documentData.currentPageIndex

    documentData.pages = (documentData.pages || []).reduce((prev, page) => {
      const foundPage = pages.find(p => p.do_objectID === page._ref.split('pages/')[1])
      if (foundPage) {
        const isShared = (options.sharedPages || []).indexOf(foundPage.name) !== -1
        if (!isShared) {
          prev.push(foundPage.name)
        }
      }
      return prev
    }, [])

    const metaData = parse(data[1])
    documentData.meta = {
      version: metaData.version,
      appVersion: metaData.appVersion,
      build: metaData.build
    }

    return Promise.all([
      parseLayerStyles(documentData, options.shareLayerStyles ? options.root : path, 'layerStyles'),
      parseLayerStyles(documentData, options.shareTextStyles ? options.root : path, 'layerTextStyles')
    ]).then(() => {
      delete documentData.layerStyles
      delete documentData.layerTextStyles
      return fs.writeFile(
        Path.join(path, 'document.json'),
        stringify(documentData, {
          space: 2
        })
      )
    })
  })
}
