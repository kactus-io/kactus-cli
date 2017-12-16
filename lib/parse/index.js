/* @ts-check */
const Path = require('path')
const childProcess = require('child_process')
const fs = require('../fs-promise')
const JSZip = require('jszip')
const parseDocumentJSON = require('./parseDocumentJSON')
const { parse } = require('../archive-utils')
const mapStyles = require('../map-shared-styles')

const availableCpus = Math.max(require('os').cpus().length - 1, 1)
const CHUNK_SIZE = 50

function getFile (path, filename) {
  return fs.readFile(path)
    .then((data) => JSZip.loadAsync(data))
    .then((zip) => {
      return Promise.all([
        zip.file('document.json').async('string'),
        fs.mkdir(filename)
      ]).then(([data]) => {
        return {
          document: parse(data),
          zip: zip
        }
      })
    })
}

module.exports = function (path, options) {
  options = options || {}
  options.root = options.root || Path.dirname(path)

  const filename = path.replace('.sketch', '')
  const cpus = options.cpus ? Math.min(availableCpus, options.cpus) : availableCpus

  return getFile(path, filename).then(({zip, document}) => {
    const sharedStyles = mapStyles([
      (document.layerStyles || {}).objects || [],
      (document.layerTextStyles || {}).objects || []
    ])

    const files = Object.keys(zip.files).reduce((prev, k) => {
      if (k.indexOf('pages/') === 0 && k !== 'pages/') {
        prev.push({
          file: k,
          type: 'page'
        })
      } else if (k.indexOf('images/') === 0 && k !== 'images/') {
        prev.push({
          file: k,
          type: 'image'
        })
      }
      return prev
    }, [])

    const numFiles = files.length

    if (numFiles === 0) {
      process.stdout.write('No files selected, nothing to do. \n')
      return parseDocumentJSON(zip, filename, options, [])
    }

    const processes = options.runInBand ? 1 : Math.min(numFiles, cpus)
    const chunkSize = processes > 1
      ? Math.min(Math.ceil(numFiles / processes), CHUNK_SIZE)
      : numFiles

    let index = 0
    // return the next chunk of work for a free worker
    function next () {
      if (!options.silent && !options.runInBand && index < numFiles) {
        process.stdout.write(
          'Sending ' +
          Math.min(chunkSize, numFiles - index) +
          ' files to free worker...\n'
        )
      }
      const fileToSend = files.slice(index, index += chunkSize)
      return fileToSend
    }

    if (!options.silent) {
      process.stdout.write('Processing ' + files.length + ' files... \n');
      if (!options.runInBand) {
        process.stdout.write(
          'Spawning ' + processes + ' workers...\n'
        )
      }
      if (options.dry) {
        process.stdout.write(
          'Running in dry mode, no files will be written! \n'
        )
      }
    }

    const args = [zip, filename, options, sharedStyles]

    const workers = []
    for (let i = 0; i < processes; i++) {
      workers.push(options.runInBand
        ? require('./Worker')(args)
        : childProcess.fork(require.resolve('./Worker'), args)
      )
    }

    return Promise.all(workers.map(child => {
      child.pages = []
      child.send({files: next()})
      child.on('message', message => {
        switch (message.action) {
          case 'free':
            if (message.pages) {
              child.pages = child.pages.concat(message.pages)
            }
            child.send({files: next()})
            break
        }
      })
      return new Promise(resolve => child.on('disconnect', () => resolve(child.pages)))
    })).then(workers => {
      const pages = workers.reduce((prev, w) => {
        prev = prev.concat(w.pages)
        return prev
      }, [])

      return parseDocumentJSON(zip, filename, options, pages.filter(p => p))
    })
  })
  .then(() => filename)
}
