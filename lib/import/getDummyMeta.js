/* @ts-check */
const semverMajor = require('semver/functions/major')

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

module.exports = function (sketchVersion, existingMeta) {
  const meta = require('./dummyMeta.json')

  if (existingMeta) {
    meta.appVersion = existingMeta.appVersion
    meta.created.appVersion = existingMeta.appVersion

    meta.version = existingMeta.version
    meta.created.version = existingMeta.version

    meta.build = existingMeta.build
    meta.created.build = existingMeta.build
    meta.saveHistory = ['NONAPPSTORE.' + existingMeta.build]

    if (existingMeta.commit) {
      meta.created.commit = existingMeta.commit
    }
  }

  if (sketchVersion) {
    const major = semverMajor(sketchVersion)
    const mapped = versionMap[major]

    if (mapped && mapped.deleteCreated) {
      delete meta.created
    }

    if (existingMeta) {
      return meta
    }

    meta.appVersion = sketchVersion
    if (meta.created) {
      meta.created.appVersion = sketchVersion
    }

    if (mapped) {
      meta.version = mapped.version
      if (meta.created) {
        meta.created.version = mapped.version
      }

      if (mapped.compatibilityVersion) {
        meta.compatibilityVersion = mapped.compatibilityVersion
        if (meta.created) {
          meta.created.compatibilityVersion = mapped.compatibilityVersion
        }
      }
    }
  }

  return meta
}
