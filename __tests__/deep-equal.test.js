/* globals test expect */
const equal = require('../lib/deep-equal')

test('should compare number', () => {
  expect(equal(1, 1)).toBe(true)
  expect(equal(1, 2)).toBe(false)
  expect(equal(1, [])).toBe(false)
})

test('should compare 0', () => {
  expect(equal(0, 0)).toBe(true)
  expect(equal(0, null)).toBe(false)
  expect(equal(0, undefined)).toBe(false)
  expect(equal(0, false)).toBe(false)
})

test('should compare strings', () => {
  expect(equal('a', 'a')).toBe(true)
  expect(equal('a', 'b')).toBe(false)
})

test('should compare empty string', () => {
  expect(equal('', 0)).toBe(false)
  expect(equal('', null)).toBe(false)
  expect(equal('', undefined)).toBe(false)
  expect(equal('', false)).toBe(false)
})

test('should compare bool', () => {
  expect(equal(true, true)).toBe(true)
  expect(equal(true, false)).toBe(false)
  expect(equal(true, 1)).toBe(false)
})

test('should compare object', () => {
  expect(equal({}, {})).toBe(true)
  expect(equal({a: 1, b: 1}, {a: 1, b: 1})).toBe(true)
  expect(equal({a: 1, b: 1}, {b: 1, a: 1})).toBe(true)
  expect(equal({a: 1, b: 1}, {a: 1, b: 1, c: false})).toBe(false)
})
