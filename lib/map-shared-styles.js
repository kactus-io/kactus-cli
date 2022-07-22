/* @ts-check */
module.exports = function (sharedStyles) {
  const map = {};
  sharedStyles.forEach((styles) => {
    styles.forEach((s) => {
      map[s.do_objectID] = s.value;
    });
  });
  return map;
};
