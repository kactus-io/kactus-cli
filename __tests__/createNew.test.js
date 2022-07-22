/* globals test expect */
require("./_mockUUID");

const path = require("path");
const createNew = require("../lib/createNew");
const parse = require("../lib/parse");
const checkDirectoryEqual = require("./_checkDirectoryEqual");

// beforeAll(() => {

// })

test("should create a new sketch file", async () => {
  await createNew(path.join(__dirname, "./fixtures/createNew/simple/icon"));
  await parse(path.join(__dirname, "./fixtures/createNew/simple/icon.sketch"));
  const res = await checkDirectoryEqual(
    path.join(__dirname, "./fixtures/createNew/simple/icon"),
    path.join(__dirname, "./fixtures/createNew/simple/_icon")
  );
  expect(res).toBe(true);
});
