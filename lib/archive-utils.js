const {Buffer} = require('buffer')
const Bplist = {
  toJSON: require('bplist-parser').parseBuffer,
  fromJSON: require('bplist-creator')
}

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

function isBuffer (v) {
  return v !== null &&
    typeof v === 'object' &&
    'type' in v &&
    v.type === 'Buffer' &&
    'data' in v &&
    Array.isArray(v.data)
}

function bufferReplacer (k, v) {
  if (isBuffer(v)) {
    const buffer = Buffer.from(v.data)
    return JSON.stringify({
      type: 'Buffer',
      data: buffer.toString('base64')
    }, null, '  ')
  }
  return v
}

function decodeArchive (archive, spacing) {
  const buffer = Buffer.from(archive, 'base64')
  const plist = Bplist.toJSON(buffer)[0]
  // const unarchived = unarchivePlist(plist)
  // const simplified = simplifyPlist(unarchived)
  return JSON.stringify(plist, bufferReplacer, spacing)
}

function bufferReviver (k, v) {
  if (isBuffer(v)) {
    return Buffer.from(v.data, 'base64')
  }
  return v
}

function encodeArchive (object) {
  // const archived = archivePlist(object)
  const buffer = Bplist.fromJSON([JSON.parse(object, bufferReviver)])
  return buffer.toString('base64')
}

function archiveReviver (k, v) {
  if (k === '_archive') {
    return encodeArchive(v)
  }
  return v
}

module.exports.parse = function (string) {
  return JSON.parse(string, archiveReviver)
}

function archiveReplacer (spacing) {
  return (k, v) => {
    if (k === '_archive') {
      return decodeArchive(v, spacing)
    }
    return v
  }
}

module.exports.stringify = function (object, spacing) {
  return JSON.stringify(object, archiveReplacer(spacing), spacing)
}
