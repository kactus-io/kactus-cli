/* @ts-check */
const Path = require('path')
const walk = require('./walk')

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

  return new Promise(function (resolve, reject) {
    const walker = walk(path)
    walker.on('error', function (err) {
      reject(err)
    })

    walker.on('data', function () {})

    walker.on('end', function () {
      const files = walker.parsedFiles.reduce(function (prev, f) {
        prev[f] = {
          path: f,
          id: f,
          parsed: true,
          imported: false
        }
        return prev
      }, {})
      walker.sketchFiles.forEach(function (f) {
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
