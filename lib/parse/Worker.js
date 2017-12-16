/* @ts-check */
const EventEmitter = require('events').EventEmitter
const Path = require('path')
const fs = require('../fs-promise')
const stringify = require('json-stable-stringify')
const { parse } = require('../archive-utils')
const equal = require('../deep-equal')

let emitter
let finish
let notify
let zip
let filename
let options
let sharedStyles

if (module.parent) {
  emitter = new EventEmitter()
  emitter.send = (data) => { run(data) }
  finish = () => { emitter.emit('disconnect') }
  notify = (data) => { emitter.emit('message', data) }
  module.exports = (args) => {
    setup(args[0], args[1], args[2], args[3])
    return emitter
  }
} else {
  finish = () => setImmediate(() => process.disconnect())
  notify = (data) => { process.send(data) }
  process.on('message', (data) => { run(data) })
  setup(process.argv[2], process.argv[3], process.argv[4], process.argv[5])
}

function setup (_zip, _filename, _options, _sharedStyles) {
  zip = _zip
  filename = _filename
  options = _options
  sharedStyles = _sharedStyles
}

function free (pages) {
  notify({action: 'free', pages: pages})
}

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

function parsePage (file) {
  console.log(JSON.stringify(zip))
  return zip.file(file).async('string').then((data) => {
    data = parse(data)

    const isShared = (options.sharedPages || []).indexOf(data.name) !== -1

    const newPath = (isShared ? options.root : filename) + '/' + escapePageName(data.name)

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
    )).then(() => data)
  })
}

function parseImage (file) {
  return fs.mkdir(filename + '/images').catch(() => {})
  .then(() => {
    return new Promise((resolve, reject) => {
      zip.file(file).nodeStream()
        .pipe(fs.createWriteStream(filename + '/images/' + Path.basename(file)))
        .on('finish', () => resolve())
        .on('error', reject)
    })
  })
}

function run (data) {
  const files = data.files

  if (!files.length) {
    finish()
    return
  }

  Promise.all(files.map(({file, type}) => {
    if (type === 'image') {
      return parseImage(file)
    } else {
      return parsePage(file)
    }
  })).then((pages) => {
    free(pages.filter(p => p))
  })
}
