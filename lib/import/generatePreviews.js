const Path = require("path");
const fs = require("fs-extra");
const tmp = require("tmp");
const { exec } = require("child_process");

const sketchtoolPath = (sketchPath) =>
  Path.join(
    sketchPath || "/Applications/Sketch.app",
    "/Contents/Resources/sketchtool/bin/sketchtool"
  );

module.exports = (zip, filePath, sketchPath, libraryPreview) => {
  return new Promise((resolve) => {
    tmp.dir((err, tempPath, cleanupCallback) => {
      if (err) {
        resolve(false);
        return;
      }

      let count = 0;
      let successCount = 0;
      function done(success) {
        count++;
        if (success) {
          successCount++;
        }
        if (count >= (libraryPreview ? 2 : 1)) {
          // Manual cleanup
          cleanupCallback();
          resolve(successCount > 0);
        }
      }

      exec(
        sketchtoolPath(sketchPath) +
          ' export preview "' +
          filePath +
          '" --output="' +
          tempPath +
          '" --filename=document.png --overwriting=YES --max-size=1000 --compression=0.7 --save-for-web=YES',
        (err) => {
          if (err) {
            return done(false);
          }
          fs.readFile(Path.join(tempPath, "document.png"))
            .then((data) => zip.file("previews/preview.png", data))
            .then(() => done(true))
            .catch(() => done(false));
        }
      );

      if (libraryPreview) {
        exec(
          sketchtoolPath(sketchPath) +
            ' export artboards "' +
            filePath +
            '" --item="' +
            libraryPreview +
            '" --output="' +
            tempPath +
            '" --save-for-web=YES --use-id-for-name=YES --overwriting=YES --include-symbols=YES --formats=png --compression=0.7',
          (err) => {
            if (err) {
              return done(false);
            }
            fs.readFile(Path.join(tempPath, libraryPreview + ".png"))
              .then((data) => zip.file("previews/library-preview.png", data))
              .then(() => done(true))
              .catch(() => done(false));
          }
        );
      }
    });
  });
};
