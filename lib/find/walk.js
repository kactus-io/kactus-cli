var path = require('path')
var Readable = require('stream').Readable
var util = require('util')
var fs = require('fs')

function Walker (dir, options) {
  var defaultStreamOptions = { objectMode: true }
  var defaultOpts = { queueMethod: 'shift', pathSorter: undefined, filter: undefined, depthLimit: undefined }
  options = Object.assign(defaultOpts, options, defaultStreamOptions)

  Readable.call(this, options)
  this.root = path.resolve(dir)
  this.paths = [this.root]
  this.options = options
  this.sketchFiles = []
  this.parsedFiles = []
  if (options.depthLimit > -1) this.rootDepth = this.root.split(path.sep).length + 1
}
util.inherits(Walker, Readable)

Walker.prototype._read = function () {
  if (this.paths.length === 0) return this.push(null)
  var self = this
  var pathItem = this.paths.shift()

  fs.lstat(pathItem, function (err, stats) {
    var item = { path: pathItem, stats: stats }
    if (err) return self.emit('error', err, item)

    if (!stats.isDirectory()) {
      if (path.extname(item.path) === '.sketch') {
        self.sketchFiles.push({
          path: item.path.replace(/\.sketch$/, ''),
          lastModified: item.stats.mtime.getTime()
        })
      } else if (path.basename(item.path) === 'document.json') {
        self.parsedFiles.push(path.dirname(item.path))
      }
      return self.push(item)
    }

    fs.readdir(pathItem, function (err, pathItems) {
      if (err) {
        return self.emit('error', err, item)
      }

      if (pathItems.indexOf('document.json') !== -1) {
        // if we find a document.json, assume that we are inside a parsed sketch file and only care about the document,json
        self.paths.push(path.join(pathItem, 'document.json'))
        self.push(item)
        return
      }

      pathItems = pathItems.map(function (part) { return path.join(pathItem, part) })
      // faster way to do do incremental batch array pushes
      self.paths.push.apply(self.paths, pathItems)

      self.push(item)
    })
  })
}

function walk (root, options) {
  return new Walker(root, options)
}

module.exports = walk
