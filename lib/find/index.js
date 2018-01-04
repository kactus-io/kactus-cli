/* @ts-check */
const Path = require('path')
const klaw = require('klaw')
const through2 = require('through2')

module.exports = function (path) {
  var config = {}
  try {
    var configPath = require.resolve(
      path[0] !== '/' // handle absolute path
        ? Path.join(process.cwd(), path, 'kactus.json')
        : Path.join(path, 'kactus.json')
    )
    delete require.cache[configPath]
    config = require(configPath)
  } catch (err) {}
  const sketchFiles = []
  const parsedFiles = []

  const filter = through2.obj(function (item, enc, next) {
    if (!item.stats.isDirectory()) {
      if (Path.extname(item.path) === '.sketch') {
        sketchFiles.push({
          path: item.path.replace(/\.sketch$/, ''),
          lastModified: item.stats.mtime.getTime()
        })
      } else if (Path.basename(item.path) === 'document.json') {
        parsedFiles.push(Path.dirname(item.path))
      }
    }
    next()
  })

  return new Promise(function (resolve, reject) {
    klaw(path)
    .pipe(filter)
    .on('error', function (err) {
      reject(err)
    })
    .on('data', function () {})
    .on('end', function () {
      const files = parsedFiles.reduce(function (prev, f) {
        prev[f] = {
          path: f,
          id: f,
          parsed: true,
          imported: false
        }
        return prev
      }, {})
      sketchFiles.forEach(function (f) {
        if (files[f.path]) {
          files[f.path].imported = true
          files[f.path].lastModified = f.lastModified
        } else {
          files[f.path] = {
            path: f.path,
            id: f.path,
            parsed: false,
            imported: true,
            lastModified: f.lastModified
          }
        }
      })

      resolve({
        config: config,
        files: Object.keys(files).map(function (f) { return files[f] })
      })
    })
  })
}
