/* @ts-check */
const {Buffer} = require('buffer')
const Bplist = {
  toJSON: require('bplist-parser').parseBuffer,
  fromJSON: require('bplist-creator')
}

const KACTUS_STORAGE_FORMAT = 'ascii'
const SKETCH_STORAGE_FORMAT = 'base64'

/**
 * @param {string} [string]
 * @return {any}
 */
module.exports.parse = function (string) {
  return JSON.parse(string)
}

/**
 * write a JSON file in a Sketch file
 */

function bufferReviver (k, v) {
  if (v && v.type === 'Buffer') {
    return Buffer.from(v.data, KACTUS_STORAGE_FORMAT)
  }
  return v
}

function encodeArchive (object) {
  const buffer = Bplist.fromJSON(JSON.parse(JSON.stringify(object), bufferReviver))
  return buffer.toString(SKETCH_STORAGE_FORMAT)
}

function archiveReplacer (k, v) {
  if (k === '_archive' && Array.isArray(v)) {
    v.forEach(o => o.$objects.forEach(oo => {
      if (oo.NSMaxLineHeight) {
        delete oo.NSMaxLineHeight
        delete oo.NSMinLineHeight
      }
    }))
    return encodeArchive(v)
  }
  return v
}

/**
 * @param {any} [object]
 * @return {string}
 */
module.exports.stringify = function (object) {
  return JSON.stringify(object, archiveReplacer)
}
