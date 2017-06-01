const Path = require('path')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const parseDocumentJSON = require('./parseDocumentJSON')

function parseLayer (zip, layer, path) {
  const newPath = Path.join(path, layer.do_objectID)

  if ((!layer.layers || !layer.layers.length) && !layer.image) {
    return fs.writeFile(
      newPath + '.json',
      JSON.stringify(layer, null, 2)
    )
  }

  return fs.mkdir(newPath).then(() => {
    if (layer.image) {
      const imageName = layer.image._ref.replace('images/', '')
      return fs.writeFileFromZip(
        zip,
        layer.image._ref + '.png',
        Path.join(newPath, imageName + '.png')
      )
    }
    const layers = layer.layers || []
    layer.layers = layer.layers.map(l => ({
      id: l.do_objectID,
      class: l._class
    }))
    return Promise.all(layers.map(l => parseLayer(zip, l, newPath)))
  }).then(() => fs.writeFile(
    Path.join(newPath, layer._class + '.json'),
    JSON.stringify(layer, null, 2)
  ))
}

function parsePage (zip, path, options, file) {
  return zip.file(file).async('string').then((data) => {
    data = JSON.parse(data)

    const isShared = (options.sharedPages || []).indexOf(data.name) !== -1

    const newPath = (isShared ? (options.root || Path.dirname(path)) : path) + '/' + data.name

    const layers = data.layers || []
    data.layers = data.layers.map(l => ({
      id: l.do_objectID,
      class: l._class
    }))

    return fs.mkdir(newPath).then(() =>
      Promise.all(layers.map(l => parseLayer(zip, l, newPath)))
    ).then(() => fs.writeFile(
      Path.join(newPath, 'page.json'),
      JSON.stringify(data, null, 2)
    ))
  })
}

module.exports = function (path, options) {
  options = options || {}
  const filename = path.replace('.sketch', '')
  return fs.readFile(path)
    .then((data) => JSZip.loadAsync(data))
    .then((zip) => {
      return fs.mkdir(filename)
      .then(() => Promise.all([
        ...Object.keys(zip.files)
          .filter(k => k.indexOf('pages/') === 0 && k !== 'pages/')
          .map(parsePage.bind(this, zip, filename, options)),
        parseDocumentJSON(zip, filename, options)
      ]))
    })
}
