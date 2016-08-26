require('dotenv').config();
var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var ftp         = require('vinyl-ftp');
var gutil       = require('gutil');

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
  jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
 gulp.task('jekyll-build', function (done) {
  browserSync.notify(messages.jekyllBuild);
  return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
  .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
 gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
  browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
 gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
  browserSync({
    server: {
      baseDir: '_site'
    }
  });
});

 gulp.task('images-rebuild', function(){
  cp.exec('npm run images', function (err, stdout, stderr) {
    if (err) {
      console.log(err);
    }
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.log(stderr);
    }
  });
})

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
 gulp.task('sass', function () {
  return gulp.src('_scss/main.scss')
  .pipe(sass({
    includePaths: ['scss'],
    onError: browserSync.notify
  }))
  .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
  .pipe(gulp.dest('_site/css'))
  .pipe(browserSync.reload({stream:true}))
  .pipe(gulp.dest('css'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
 gulp.task('watch', function () {
  gulp.watch('_scss/*.scss', ['sass']);
    // gulp.watch('assets/**/*.+(JPG|jpg|jpeg|PNG|png|tiff)', ['images-rebuild']);
    gulp.watch(['*.html', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
  });

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
 gulp.task('default', ['browser-sync', 'watch']);

 gulp.task("deploy", ["jekyll-build"], function () {

  var conn = ftp.create( {
    host:     process.env.HOST,
    user:     process.env.USERNAME,
    password: process.env.PASSWORD,
    parallel: 10,
    log:      gutil.log
  } );

  var globs = [
    '_site/**'
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp.src( globs, { base: './_site/', buffer: false } )
      .pipe( conn.newer( '/public_html' ) ) // only upload newer files
      .pipe( conn.dest( '/public_html' ) );
    });
