/* globals test expect */
const path = require('path')
const find = require('../lib/find')

test('should find a parsed and imported kactus file', () => {
  const found = find(path.join(__dirname, './fixtures/find/parsed_and_imported'))
  expect(found.files[0].parsed).toBe(true)
  expect(found.files[0].imported).toBe(true)
})

test('should find a parsed but not imported kactus file', () => {
  const found = find(path.join(__dirname, './fixtures/find/parsed'))
  expect(found.files[0].parsed).toBe(true)
  expect(found.files[0].imported).toBe(false)
})

test('should find an imported but not parsed kactus file', () => {
  const found = find(path.join(__dirname, './fixtures/find/imported'))
  expect(found.files[0].parsed).toBe(false)
  expect(found.files[0].imported).toBe(true)
})

test('should find a nested sketch file', () => {
  const found = find(path.join(__dirname, './fixtures/find/nested'))
  expect(found.files.length).toBe(3)
})

test('should find the kactus config', () => {
  const found = find(path.join(__dirname, './fixtures/find/config'))
  expect(found.config).toEqual({})
})
