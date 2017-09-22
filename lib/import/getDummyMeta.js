/* @ts-check */
const semver = require('semver')

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
  },
  46: {
    version: 93
  },
  47: {
    version: 95,
    compatibilityVersion: 93
  }
}

module.exports = function (sketchVersion) {
  const meta = require('./dummyMeta.json')
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

      if (mapped.compatibilityVersion) {
        meta.compatibilityVersion = mapped.compatibilityVersion
        meta.created.compatibilityVersion = mapped.compatibilityVersion
      }
    }
  }

  return meta
}
