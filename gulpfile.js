const gulp = require('gulp');
const postcss = require('gulp-postcss');

const browserSync = require('browser-sync').create();

gulp.task('default', ['serve']);

gulp.task('serve', ['css'], function() {

  browserSync.init({
    server: './',
    port: 8000
  });

  gulp.watch('src/css/**/*.css', ['css']);
  gulp.watch('*.html').on('change', browserSync.reload);
});

gulp.task('css', () => {
  return gulp.src('src/css/main.css')
	     .pipe(postcss(
	       [
		 require('postcss-import'),
		 require('postcss-preset-env'),
		 require('cssnano')
	       ]))
	     .pipe(gulp.dest('build/css/'))
	     .pipe(browserSync.stream());
});