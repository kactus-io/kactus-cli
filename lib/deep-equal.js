/**
 * @param {any} [a]
 * @param {any} [b]
 * @return {boolean}
 */
module.exports = function equal (a, b) {
  if (a === b) {
    return true
  }

  var arrA = Array.isArray(a)
  var arrB = Array.isArray(b)
  var i

  if (arrA && arrB) {
    if (a.length !== b.length) {
      return false
    }
    for (i = 0; i < a.length; i++) {
      if (!equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  // eslint-disable-next-line
  if (arrA != arrB) {
    return false
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    var keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) {
      return false
    }

    for (i = 0; i < keys.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
        return false
      }
    }

    for (i = 0; i < keys.length; i++) {
      if (!equal(a[keys[i]], b[keys[i]])) {
        return false
      }
    }

    return true
  }

  return false
}
