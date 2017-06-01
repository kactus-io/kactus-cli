const Path = require('path')
const klawSync = require('klaw-sync')

module.exports = function (path) {
  var config = {}
  try {
    config = require(path[0] !== '/' // handle absolute path
      ? Path.join(process.cwd(), path, 'kactus.json')
      : Path.join(path, 'kactus.json')
    )
  } catch (err) {}
  const sketchFiles = klawSync(path, {
    nodir: true,
    filter: function (item) { return Path.extname(item.path) === '.sketch' }
  }).map(function (f) {
    return f.path
  })
  const parsedFiles = klawSync(path, {
    nodir: true,
    filter: function (item) { return Path.basename(item.path) === 'document.json' }
  }).map(function (f) {
    return Path.dirname(f.path)
  })

  const files = parsedFiles.reduce(function (prev, f) {
    prev[f] = {
      path: f,
      id: f,
      parsed: true
    }
    return prev
  }, {})
  sketchFiles.forEach(function (f) {
    const _path = f.replace(/\.sketch$/, '')
    if (files[_path]) {
      files[_path].imported = true
    } else {
      files[_path] = {
        path: _path,
        id: _path,
        parsed: false,
        imported: true
      }
    }
  })

  return {
    config: config,
    files: Object.keys(files).map(function (f) { return files[f] })
  }
}
