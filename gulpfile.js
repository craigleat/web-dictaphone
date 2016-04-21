var gulp = require('gulp'),
    connect = require('gulp-connect');

gulp.task('webserver', function() {
  connect.server({
    livereload: true
  });
});

gulp.task('html', function() {
  gulp.src(['./styles/*.css', './scripts/*.js', './*.html'])
    .pipe(connect.reload());
});

gulp.task('css', function() {
  gulp.src(['./styles/*.css', './scripts/*.js', './*.html'])
    .pipe(connect.reload());
});

gulp.task('js', function() {
  gulp.src(['./styles/*.css', './scripts/*.js', './*.html'])
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch('./*.html', ['html']);
  gulp.watch('./styles/*.css', ['css']);
  gulp.watch('./scripts/*.js', ['js']);
});

gulp.task('default', ['html', 'css', 'js', 'webserver', 'watch']);
