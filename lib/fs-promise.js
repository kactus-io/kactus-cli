const fs = require('fs')

module.exports.writeFile = function (...args) {
  return new Promise((resolve, reject) => {
    fs.writeFile(...args, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

module.exports.stat = function (...args) {
  return new Promise((resolve, reject) => {
    fs.stat(...args, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

module.exports.readdir = function (...args) {
  return new Promise((resolve, reject) => {
    fs.readdir(...args, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

module.exports.writeFileFromZip = function (zip, file, path) {
  return new Promise((resolve, reject) => {
    zip.file(file)
      .nodeStream()
      .pipe(fs.createWriteStream(path))
      .on('finish', function () {
        resolve()
      })
      .on('error', function (err) {
        reject(err)
      })
  })
}

module.exports.writeZipToFile = function (zip, path) {
  return new Promise((resolve, reject) => {
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(fs.createWriteStream(path))
      .on('finish', function () {
        resolve()
      })
      .on('error', function (err) {
        reject(err)
      })
  })
}

function deleteFolderRecursive (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath)
      } else { // delete file
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}

module.exports.mkdir = function (...args) {
  return new Promise((resolve, reject) => {
    try {
      deleteFolderRecursive(args[0])
    } catch (err) {
      reject(err)
      return
    }
    fs.mkdir(...args, (err, res) => {
      if (err) {
        return resolve(err) // TODO
      }
      resolve(res)
    })
  })
}

module.exports.readFile = function (...args) {
  return new Promise((resolve, reject) => {
    fs.readFile(...args, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

module.exports.createWriteStream = fs.createWriteStream
