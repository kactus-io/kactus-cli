/* globals expect */
const path = require('path')

const { readdir, stat, readFile } = require('../lib/fs-promise')

module.exports = function isDirEqual (dir, dir2) {
  return Promise.all([
    readdir(dir),
    readdir(dir2)
  ]).then(([files, files2]) => {
    // check if there is the same number of file or if they don't have the same name
    if (files.length !== files2.length || files.some((f, i) => f !== files2[i])) {
      expect(files.length).toBe(files2.length)
      files.forEach((f, i) => expect(f).toBe(files2[i]))
      return false
    }
    return Promise.all([
      Promise.all(files.map((f) => stat(path.join(dir, f)))),
      Promise.all(files2.map((f) => stat(path.join(dir2, f))))
    ]).then(([stats, stats2]) => {
      // check they are both a directory or both not
      if (stats.some((s, i) => s.isDirectory() !== stats2[i].isDirectory())) {
        return false
      }
      return stats.reduce((prev, s, i) => {
        return prev.then((res) => {
          // if we already found that it's not equal, abort
          if (!res) {
            return false
          }
          const filename = path.join(dir, files[i])
          const filename2 = path.join(dir2, files[i])
          // if it's a directory, recursively check it
          if (s.isDirectory()) {
            return isDirEqual(filename, filename2)
          }
          // if it's a normal file, read both and compare them
          return Promise.all([
            readFile(filename),
            readFile(filename2)
          ]).then(([fileContent, fileContent2]) => {
            expect(fileContent.toString()).toBe(fileContent2.toString())
            return fileContent.toString() === fileContent2.toString()
          })
        })
      }, Promise.resolve(true))
    })
  })
}
