/* @ts-check */
var find = require('../find')
var parseFile = require('../parse')

module.exports = function (path) {
  var found = find(path)
  return Promise.all(found.sketchFiles.map(f => parseFile(f, found.config)))
}
