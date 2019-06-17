var gulp = require('gulp'); //gulp
var gutil = require('gulp-util'); //gulp工具
var sourcemaps = require('gulp-sourcemaps'); //map插件
var addsrc = require('gulp-add-src'); //追加js文件插件
var coffee = require('gulp-coffee'); //coffeescritp插件
var sass = require('gulp-sass'); //sass插件
var htmlmin = require('gulp-htmlmin'); //html压缩
var imagemin = require('gulp-imagemin'); //图片压缩
var pngcrush = require('imagemin-pngcrush');
var minifycss = require('gulp-minify-css'); //css压缩
var uglify = require('gulp-uglify'); //js压缩
var concat = require('gulp-concat'); //文件合并
var rename = require('gulp-rename'); //文件更名
var cssUrlVersion = require('gulp-make-css-url-version'); //css文件里引用url加版本号（根据引用文件的md5生产版本号）
var notify = require('gulp-notify'); //提示信息
var fs = require('fs-extra'); //fs 工具
var async = require('async'); // 异步工具
var run = require('run-sequence'); //按顺序运行插件
var del = require('del'); //删除工具
var path = require('path');
var nodemon    = require('gulp-nodemon');
//
// ─── SASS ───────────────────────────────────────────────────────────────────────
//

//清空sass目录
gulp.task('sass:emptyDir', function() {
    return del(['static/css/**']);
});
//编译sass
gulp.task('sass:build', function() {
    return gulp.src('static/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(minifycss())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('static/css'));
});
//监听sass
gulp.task('sass:watch', function() {
    run('sass:emptyDir', 'sass:build')
    gulp.watch('static/sass/**/*.scss', function(e) {
        run('sass:emptyDir', 'sass:build')
    });
});