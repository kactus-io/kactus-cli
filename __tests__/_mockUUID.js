/* globals jest */
jest.mock('uuid/v1')

const uuid = require('uuid/v1')
uuid
  .mockImplementationOnce(() => '9fa7c9e0-61c3-11e7-9b20-13a8266131bc')
  .mockImplementationOnce(() => '9fa81800-61c3-11e7-9b20-13a8266131bc')

module.exports = uuid
