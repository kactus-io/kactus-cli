/* @ts-check */
const fs = require('fs')
const path = require('path')

/**
 * @param {string} [filename]
 * @param {any} [data]
 * @return {Promise<void>}
 */
module.exports.writeFile = function (filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

/**
 * @param {string | Buffer} [path]
 * @return {Promise<Stats>}
 */
module.exports.stat = function (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

/**
 * @param {string | Buffer} [path]
 * @return {Promise<string[]>}
 */
module.exports.readdir = function (path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

/**
 * @param {string | Buffer | URL} [path]
 * @return {Promise<void>}
 */
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

/**
 * @param {string | Buffer | URL} [path]
 * @return {Promise<void>}
 */
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

/**
 * @param {string | Buffer} [path]
 */
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

/**
 * @param {string | Buffer} [path]
 * @return {Promise<void>}
 */
module.exports.mkdir = function (path) {
  return new Promise((resolve, reject) => {
    try {
      deleteFolderRecursive(path)
    } catch (err) {
      reject(err)
      return
    }
    fs.mkdir(path, (err) => {
      if (err) {
        return resolve(err) // TODO
      }
      resolve()
    })
  })
}

const _0777 = parseInt('0777', 8)

/**
 * @param {string} [p]
 * @param {{mode?: number}} [opts]
 * @return {Promise<string>}
 */
module.exports.mkdirP = function (p, opts) {
  if (!opts || typeof opts !== 'object') {
    opts = { mode: opts }
  }

  var mode = opts.mode

  if (mode === undefined) {
    mode = _0777 & ~process.umask()
  }

  p = path.resolve(p)

  return new Promise((resolve, reject) => {
    fs.mkdir(p, mode, function (err) {
      if (!err) {
        resolve(p)
        return
      }

      switch (err.code) {
        case 'ENOENT':
          module.exports.mkdirP(path.dirname(p), opts)
            .then(() => {
              return module.exports.mkdirP(p, opts)
            })
            .then(resolve)
            .catch(reject)
          break

        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          fs.stat(p, function (er2, stat) {
            // if the stat fails, then that's super weird.
            // let the original error be the failure reason.
            if (er2 || !stat.isDirectory()) {
              reject(err)
            } else {
              resolve(p)
            }
          })
          break
      }
    })
  })
}

/**
 * @param {string} [filename]
 * @param {string} [encoding]
 * @return {Promise<string>}
 */
module.exports.readFile = function (filename, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

module.exports.createWriteStream = fs.createWriteStream
