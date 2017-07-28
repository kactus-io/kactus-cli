const Path = require('path')
const fs = require('../fs-promise')

function importLayerStyle (dirmame, key) {
  return fs.readdir(dirmame + '/' + key).then(files => {
    return Promise.all(files.filter(f => /\.json$/.test(f)).map(f =>
      fs.readFile(dirmame + '/' + key + '/' + f).then(JSON.parse)
    ))
  }).catch(function () {
    // not found
    return []
  })
}

module.exports = function (path, options) {
  const dirname = Path.dirname(path)
  return Promise.all([
    importLayerStyle(options.shareLayerStyles ? (options.root || dirname) : path, 'layerStyles'),
    importLayerStyle(options.shareTextStyles ? (options.root || dirname) : path, 'layerTextStyles')
  ])
}
