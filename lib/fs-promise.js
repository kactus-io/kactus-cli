const fs = require('fs')
const path = require('path')

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

var _0777 = parseInt('0777', 8)

module.exports.mkdirP = function (p, opts, made) {
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
        resolve(made || p)
        return
      }

      switch (err.code) {
        case 'ENOENT':
          module.exports.mkdirP(path.dirname(p), opts)
            .then((made) => {
              return module.exports.mkdirP(p, opts, made)
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
              resolve(made)
            }
          })
          break
      }
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
