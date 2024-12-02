var gulp = require("gulp");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var minifycss = require("gulp-minify-css");
var replace = require("gulp-replace");
var download = require("gulp-download-stream");
var rm = require("gulp-rm");

// File paths and URLs for better reusability
var jsFiles = [
  "./src/gen/GMfuc.js",
  "./src/gen/wsp.js",
  "./src/gen/l1.js",
  "./src/gen/raid.js",
  "./src/gen/tri.js"
];

var jsDownloadUrls = [
  {
    file: "wsp.js",
    url: "https://cdn.jsdmirror.com/gh/knva/wsmud_plugins@master/wsmud_pluginss.user.js"
  },
  {
    file: "tri.js",
    url: "https://cdn.jsdmirror.com/gh/knva/wsmud_plugins@master/wsmud_Trigger.user.js"
  },
  {
    file: "raid.js",
    url: "https://cdn.jsdmirror.com/gh/knva/wsmud_plugins@master/wsmud_Raid.user.js"
  }
];

var gameUpdateUrls = [
  {
    file: "index.html",
    url: "http://www.wamud.com/"
  },
  {
    file: "./dist/ws.min.js",
    url: "http://www.wamud.com/dist/ws.min.js"
  }
];

// Minify JS task (optimized for reusability)
function minifyJs(srcFiles, destFolder) {
  return gulp
    .src(srcFiles)
    .pipe(concat("wg.js"))
    .pipe(gulp.dest(destFolder))
    .pipe(rename({ suffix: ".min" }))
    .pipe(uglify())
    .pipe(gulp.dest(destFolder));
}

// Task to clean the src/gen directory
gulp.task("clean", function () {
  return gulp.src("src/gen/*", { allowEmpty: true, read: false }).pipe(rm());
});

// Task to download the latest plugins
gulp.task("download", function () {
  return download(jsDownloadUrls).pipe(gulp.dest("./src/"));
});

// Task to update the latest game files
gulp.task("update", function () {
  return download(gameUpdateUrls).pipe(gulp.dest("./public/"));
});

// Task to minify JavaScript files
gulp.task("minifyjs", function () {
  return minifyJs(jsFiles, "./public/wg");
});

// Combining both minify tasks into one reusable task
gulp.task("minifyjs2", function () {
  return minifyJs(jsFiles.map(file => file.replace('src/gen', 'src')), "./public/wg");
});
