const gulp              = require('gulp');
const gulp_sass         = require('gulp-sass');
const gulp_rename       = require('gulp-rename');
const gulp_cssmin       = require('gulp-cssnano');
const gulp_prefix       = require('gulp-autoprefixer');
const gulp_sourcemaps   = require('gulp-sourcemaps');
const gulp_sass_lint    = require('gulp-sass-lint');
const gulp_uglify       = require('gulp-uglify');
const gulp_minify_html  = require('gulp-minify-html');
const gulp_tap          = require('gulp-tap');
const gulp_concat       = require('gulp-concat-util');
const gulp_coffee       = require('gulp-coffee');
const gulp_serve        = require('gulp-serve');
const gulp_clean        = require('gulp-clean');
const gulp_sequence     = require('gulp-sequence');
const gulp_pretty_data  = require('gulp-pretty-data');
const gulp_babel        = require('gulp-babel');

const path              = require('path');
const pkg               = require('./package.json');
const ui5               = pkg.ui5;
const manifest          = require('./src/manifest.json');
const fs                = require('fs');

const config_sourcemaps = { sourceRoot: `/~src~` };
const config_xmlminify  = { type: 'minify' };
const config_varreplace = function( file, t ) { file.contents = Buffer.from( replaceVar( file.contents.toString() ) ); };
const config_babel      = { presets: [ '@babel/env' ] }


function resolveObjectPath( path, object ) {
  try {
    return path.split('/').reduce((twig,key)=>twig[key],object);
  } catch (e) {}
}

function replaceVar( str ) {
  return str.replace( /§([^§]+)§/g, ( _, key ) => {
    return resolveObjectPath( key, ui5 ) || resolveObjectPath( key, manifest );
  });
}

gulp.task("build:css",()=>{
  return gulp.src(["src/**/*.{scss,sass}"])
    .pipe( gulp_tap( config_varreplace ) )
    .pipe( gulp_sourcemaps.init() )
    .pipe( gulp_sass() )
    .pipe( gulp_prefix({ browsers: ['last 4 versions']}) )
    .pipe( gulp_rename('main.css') )
    .pipe( gulp_sourcemaps.write( config_sourcemaps ) )
    .pipe( gulp.dest("dest/css") )
    .pipe( gulp_cssmin() )
    .pipe( gulp_rename({ suffix: '.min' }) )
    .pipe( gulp.dest("dest/css") )
});

gulp.task('lint:css',()=>{
  return gulp.src(["src/**/*.scss"])
    .pipe( gulp_tap( config_varreplace ) )
    .pipe( gulp_sass_lint() )
    .pipe( gulp_sass_lint.format() )
    .pipe( gulp_sass_ling.failOnError() )
});

gulp.task('build:componentpreload',()=>{
  return gulp.src(["src/**/*.{js,xml,coffee,json,html,htm,xhtml}"])
    .pipe( gulp_tap( config_varreplace ) )
    .pipe( gulp_sourcemaps.init() )
    .pipe( gulp_tap( function( file, t ) {
      if ( path.extname( file.path ) === '.coffee' )
        return t.through( gulp_coffee );
    }))
    .pipe( gulp_tap( function( file, t ) {
      if ( path.extname( file.path ) === '.js' ) return t.through( gulp_babel.bind( undefined, config_babel ) )
    }))
    .pipe( gulp_tap( function( file, t ) {
      switch ( path.extname( file.path ) ) {
        case '.js':     return t.through( gulp_uglify );
        case '.xml':    return t.through( gulp_minify_html );
      }
    }))
    .pipe( gulp_concat('Component-preload.js',{ process: function(content,filepath) {
      return [
        '    ',
        JSON.stringify( './' + path.relative( './src/', filepath ).replace( /\\/g, '/' ) ),
        ': ',
        JSON.stringify( content.toString() ),
        ','
      ].join( '' );
    } }))
    .pipe( gulp_concat.header('jQuery.sap.registerPreloadedModules({\n  "version": "2.0",\n  "name": "Component-preload",\n  "modules": {\n') )
    .pipe( gulp_concat.footer('\n  }\n});') )
    .pipe( gulp_sourcemaps.write( config_sourcemaps ) )
    .pipe( gulp.dest('dest') );
});

gulp.task('build:html',()=>{
  return gulp.src(['src/**/*.{xhtml,html,htm}'])
    .pipe( gulp_tap( function( file, t ) { file.contents = Buffer.from( replaceVar( file.contents.toString() ) ); }))
    .pipe( gulp_minify_html() )
    .pipe( gulp.dest('dest') )
});

gulp.task('build:js',()=>{
  return gulp.src(['src/**/*.{js,coffee}'])
    .pipe( gulp_tap( function( file, t ) { file.contents = Buffer.from( replaceVar( file.contents.toString() ) ); }))
    .pipe( gulp_sourcemaps.init() )
    .pipe( gulp_tap( function( file, t ) {
      if ( path.extname( file.path ) === '.coffee' )
        return t.through( gulp_coffee );
    }))
    .pipe( gulp_babel( config_babel ) )
    .pipe( gulp_uglify() )
    .pipe( gulp_sourcemaps.write( config_sourcemaps ) )
    .pipe( gulp.dest('dest') );
});

gulp.task('build:json',()=>{
  return gulp.src(['src/**/*.json'])
    .pipe( gulp_tap( function( file, t ) { file.contents = Buffer.from( replaceVar( file.contents.toString() ) ); }))
    .pipe( gulp.dest('dest') );
});

gulp.task('build:xml',()=>{
  return gulp.src(['src/**/*.xml'])
    .pipe( gulp_tap( function( file, t ) { file.contents = Buffer.from( replaceVar( file.contents.toString() ) ); }))
    .pipe( gulp_sourcemaps.init() )
    .pipe( gulp_pretty_data( config_xmlminify ) )
    .pipe( gulp_sourcemaps.write( config_sourcemaps ) )
    .pipe( gulp.dest('dest') );
});

gulp.task('build:assets',()=>{
  return gulp.src(['src/**/*','!src/**/*.{js,coffee,html,xhtml,htm,css,scss,json,xml}'])
    .pipe( gulp.dest('dest') );
});

gulp.task('clean',()=>{
  return gulp.src('dest')
    .pipe( gulp_clean() );
});

gulp.task('serve',gulp_serve('dest'));


gulp.task('build', cb => {
  gulp_sequence('clean', ['build:css', 'build:js', 'build:html', 'build:json', 'build:xml', 'build:assets', 'build:componentpreload'])(cb);
});
gulp.task('watch',() => { return gulp.watch("src/**/*",['build']); });
gulp.task('dev', cb => {
  gulp_sequence('build','watch','serve')(cb);
});
