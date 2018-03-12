var path = require('path')
var fs = require('fs-extra')

function walk (dir) {
  var sketchFiles = []
  var parsedFiles = []

  function _walk (pathItem) {
    return new Promise(function (resolve, reject) {
      fs.lstat(pathItem, function (err, stats) {
        if (err) {
          return reject(err)
        }

        if (!stats.isDirectory()) {
          if (path.extname(pathItem) === '.sketch') {
            sketchFiles.push({
              path: pathItem.replace(/\.sketch$/, ''),
              lastModified: stats.mtime.getTime()
            })
          } else if (path.basename(pathItem) === 'document.json') {
            parsedFiles.push(path.dirname(pathItem))
          }
          return resolve()
        }

        fs.readdir(pathItem, function (err, pathItems) {
          if (err) {
            return reject(err)
          }

          if (pathItems.indexOf('document.json') !== -1) {
            // if we find a document.json, assume that we are inside a parsed sketch file and only care about the document.json
            return _walk(path.join(pathItem, 'document.json')).then(resolve)
          }

          return Promise.all(pathItems.reduce(function (prev, part) {
            if (part !== '.git' && part !== 'node_modules' && part !== '.awcache') {
              prev.push(_walk(path.join(pathItem, part)))
            }
            return prev
          }, [])).then(resolve)
        })
      })
    })
  }

  return _walk(path.resolve(dir)).then(function () {
    return {
      sketchFiles: sketchFiles,
      parsedFiles: parsedFiles
    }
  })
}

module.exports = walk
