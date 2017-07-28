const semver = require('semver')
const meta = require('./dummyMeta.json')

const versionMap = {
  43: {
    deleteCreated: true,
    version: 88
  },
  44: {
    version: 90
  },
  45: {
    version: 92
  }
}

module.exports = function (sketchVersion) {
  if (sketchVersion) {
    meta.appVersion = sketchVersion
    meta.created.appVersion = sketchVersion

    const major = semver.major(sketchVersion)
    const mapped = versionMap[major]
    if (mapped) {
      meta.version = mapped.version
      meta.created.version = mapped.version

      if (mapped.deleteCreated) {
        delete meta.created
      }
    }
  }

  return meta
}
