const {Buffer} = require('buffer')
const Bplist = {
  toJSON: require('bplist-parser').parseBuffer,
  fromJSON: require('bplist-creator')
}

const KACTUS_STORAGE_FORMAT = 'ascii'
const SKETCH_STORAGE_FORMAT = 'base64'

// function unarchivePlist (plist) {
//   const objects = plist['$objects']
//   const rootUID = plist['$top'].root.UID
//   const unarchived = unarchiveObject(objects, objects[rootUID])
//   return unarchived
// }

// function unarchiveObject (objects, object) {
//   const type = Object.prototype.toString.call(object)
//   // apply recursively only when plist is object or array
//   if (type !== '[object Object]' && type !== '[object Array]') {
//     return object
//   }
//   if (Array.isArray(object)) {
//     // console.log(object)
//     const result = []
//     for (let element of object) {
//       const valueUID = element.UID
//       // console.log(element, valueUID)
//       if (valueUID) {
//         result.push(unarchiveObject(objects, objects[valueUID]))
//       } else {
//         result.push(unarchiveObject(objects, element))
//       }
//     }
//     return result
//   }

//   if (typeof object === 'object' && object.UID >= 0) {
//     return unarchiveObject(objects, objects[object.UID])
//   }

//   if (typeof object === 'object') {
//     const result = {}
//     for (let key in object) {
//       const value = object[key]
//       result[key] = unarchiveObject(objects, value)
//     }
//     return result
//   }

//   return object
// }

// function archivePlist (object) {
//   return {
//     $version: 100000,
//     $objects: archiveObject([], object),
//     $archiver: 'NSKeyedArchiver',
//     $top: {
//       root: {
//         UID: 'todo'
//       }
//     }
//   }
// }

// function archiveObject (acc, object) {
//   const type = Object.prototype.toString.call(object)
//   // apply recursively only when plist is object or array
//   if (type !== '[object Object]' && type !== '[object Array]') {
//     return object
//   }
//   if (Array.isArray(object)) {
//     // console.log(object)
//     const result = []
//     for (let element of object) {
//       const valueUID = element.UID
//       // console.log(element, valueUID)
//       if (valueUID) {
//         result.push(unarchiveObject(objects, objects[valueUID]))
//       } else {
//         result.push(unarchiveObject(objects, element))
//       }
//     }
//     return result
//   }

//   if (typeof object === 'object' && object.UID >= 0) {
//     return unarchiveObject(objects, objects[object.UID])
//   }

//   if (typeof object === 'object') {
//     const result = {}
//     for (let key in object) {
//       const value = object[key]
//       result[key] = unarchiveObject(objects, value)
//     }
//     return result
//   }

//   return object
// }

// function simplifyPlist (plist) {
//   const type = Object.prototype.toString.call(plist)
//   // apply recursively only when plist is object or array
//   if (type !== '[object Object]' && type !== '[object Array]') {
//     return plist
//   }
//   if (Array.isArray(plist)) {
//     return plist.map(simplifyPlist)
//   }

//   // for key-value dictionary
//   const keys = plist['NS.keys']
//   const values = plist['NS.objects']
//   if (keys && values) {
//     const result = {}
//     for (let idx in keys) {
//       result[keys[idx]] = simplifyPlist(values[idx])
//     }
//     return result
//   }

//   // for common objects
//   if (typeof plist === 'object') {
//     const result = {}
//     for (let key in plist) {
//       result[key] = simplifyPlist(plist[key])
//     }
//     return result
//   }
//   return plist
// }

module.exports.bufferReplacer = function bufferReplacer (k, v) {
  if (v && v.type === 'Buffer') {
    const buffer = Buffer.from(v.data)
    return {
      type: 'Buffer',
      data: buffer.toString(KACTUS_STORAGE_FORMAT)
    }
  }
  return v
}

function decodeArchive (archive) {
  const buffer = Buffer.from(archive, SKETCH_STORAGE_FORMAT)
  const plist = Bplist.toJSON(buffer)
  // const unarchived = unarchivePlist(plist)
  // const simplified = simplifyPlist(unarchived)
  return plist
}

function archiveReviver (k, v) {
  if (k === '_archive') {
    return decodeArchive(v)
  }
  return v
}

module.exports.parse = function (string) {
  return JSON.parse(string, archiveReviver)
}

function bufferReviver (k, v) {
  if (v && v.type === 'Buffer') {
    return Buffer.from(v.data, KACTUS_STORAGE_FORMAT)
  }
  return v
}

function encodeArchive (object) {
  // const archived = archivePlist(object)
  const buffer = Bplist.fromJSON(JSON.parse(JSON.stringify(object), bufferReviver))
  return buffer.toString(SKETCH_STORAGE_FORMAT)
}

function archiveReplacer (k, v) {
  if (k === '_archive') {
    return encodeArchive(v)
  }
  return v
}

module.exports.stringify = function (object) {
  return JSON.stringify(object, archiveReplacer)
}
