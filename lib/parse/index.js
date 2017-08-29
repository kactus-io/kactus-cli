/* @ts-check */
const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const parseDocumentJSON = require('./parseDocumentJSON')
const stringify = require('json-stable-stringify')
const { parse } = require('../archive-utils')
const equal = require('../deep-equal')
const mapStyles = require('../map-shared-styles')

function parseLayer (zip, layer, path, sharedStyles) {
  const newPath = Path.join(path, layer.do_objectID)

  const hasChildren = layer.layers && layer.layers.length

  return Promise.resolve()
  .then(() => {
    // check if there is no overwrite of a shared style
    if (layer.style && layer.style.sharedObjectID && equal(layer.style, sharedStyles[layer.style.sharedObjectID])) {
      // if so, ditch everything except the shared style ID
      layer.style = {
        sharedObjectID: layer.style.sharedObjectID
      }
    }
  })
  .then(() => {
    if (hasChildren || layer.image) {
      return fs.mkdir(newPath)
    }
  })
  .then(() => {
    if (layer.image) {
      const imageName = layer.image._ref.replace('images/', '')
      return fs.writeFileFromZip(
        zip,
        layer.image._ref + '.png',
        Path.join(newPath, imageName + '.png')
      )
    }
  })
  .then(() => {
    if (hasChildren) {
      const layers = layer.layers || []
      layer.layers = layer.layers.map(l => ({
        id: l.do_objectID,
        class: l._class
      }))
      return Promise.all(layers.map(l => parseLayer(zip, l, newPath, sharedStyles)))
    }
  }).then(() => {
    if (hasChildren || layer.image) {
      return fs.writeFile(
        Path.join(newPath, layer._class + '.json'),
        stringify(layer, {
          space: 2
        })
      )
    } else {
      fs.writeFile(
        newPath + '.json',
        stringify(layer, {
          space: 2
        })
      )
    }
  })
}

function escapePageName (name) {
  // if we don't have a page name, generate a random one
  if (!name || name === '.' || name === '..') {
    return (Math.random() * Date.now()).toFixed(0)
  }

  return name.replace('/', '／').replace(':', '：')
}

function parsePage (zip, path, options, sharedStyles, file) {
  return zip.file(file).async('string').then((data) => {
    data = parse(data)

    const isShared = (options.sharedPages || []).indexOf(data.name) !== -1

    const newPath = (isShared ? options.root : path) + '/' + escapePageName(data.name)

    const layers = data.layers || []
    data.layers = data.layers.map(l => ({
      id: l.do_objectID,
      class: l._class
    }))

    return fs.mkdir(newPath).then(() =>
      Promise.all(layers.map(l => parseLayer(zip, l, newPath, sharedStyles)))
    ).then(() => fs.writeFile(
      Path.join(newPath, 'page.json'),
      stringify(data, {
        space: 2
      })
    ))
  })
}

function parseImage (zip, path, options, file) {
  return fs.mkdir(path + '/images').catch(() => {})
  .then(() => {
    return new Promise((resolve, reject) => {
      zip.file(file).nodeStream()
        .pipe(fs.createWriteStream(path + '/images/' + Path.basename(file)))
        .on('finish', resolve)
        .on('error', reject)
    })
  })
}

module.exports = function (path, options) {
  options = options || {}
  options.root = options.root || Path.dirname(path)
  const filename = path.replace('.sketch', '')
  return fs.readFile(path)
    .then((data) => JSZip.loadAsync(data))
    .then((zip) => {
      return zip.file('document.json').async('string').then((data) => {
        return {
          document: parse(data),
          zip: zip
        }
      })
    }).then(({zip, document}) => {
      const sharedStyles = mapStyles([
        (document.layerStyles || {}).objects || [],
        (document.layerTextStyles || {}).objects || []
      ])
      const _parsePage = parsePage.bind(this, zip, filename, options, sharedStyles)
      const _parseImage = parseImage.bind(this, zip, filename, options)
      return fs.mkdir(filename)
      .then(() => Promise.all(
        Object.keys(zip.files)
          .reduce((promises, k) => {
            if (k.indexOf('pages/') === 0 && k !== 'pages/') {
              promises.push(_parsePage(k))
            } else if (k.indexOf('images/') === 0 && k !== 'images/') {
              promises.push(_parseImage(k))
            }
            return promises
          }, [parseDocumentJSON(zip, filename, options)])
      ))
    })
    .then(() => filename)
}
