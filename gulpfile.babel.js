import { src, dest, watch, lastRun, series, parallel } from 'gulp';
import autoprefixer from 'autoprefixer';
import rucksack from 'rucksack-css';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import named from 'vinyl-named';
import browserSync from 'browser-sync';
import plugins from 'gulp-load-plugins';
import pngquant from 'imagemin-pngquant';
import zopfli from 'imagemin-zopfli';
import giflossy from 'imagemin-giflossy';
import mozjpeg from 'imagemin-mozjpeg';
import webp from 'imagemin-webp';
import extReplace from 'gulp-ext-replace';
import del from 'del';
import read from 'read-yaml';
import shell from 'shelljs';
import pkg from './package.json';
import yargs from 'yargs';
import webpackConfig from './webpack.config.js';

const prod = yargs.argv.prod;

const $ = plugins({
	rename: {
		'gulp-group-css-media-queries': 'gcmq',
		'gulp-sass-glob': 'sassGlob',
		'gulp-clean-css': 'cleanCSS'
	},
	pattern: [ 'gulp-*', '*', '-', '@*/gulp{-,.}*' ],
	replaceString: /\bgulp[\-.]/
});

const sync = browserSync.create();

// Get Gulp configs.
const config = read.sync('./gulp.config.yml');

/**
 * Environment
 */
export const env = (done) => {
	console.log(prod ? 'Running Gulp in production' : 'Running Gulp in development');
	done();
};

/**
 * Styles
 */
export const sass = () => {
	return src(config.sass.src, { allowEmpty: true })
		.pipe($.plumber())
		.pipe($.if(!prod, $.sourcemaps.init())) // Start sourcemap.
		.pipe(
			$.cssimport({
				matchPattern: '*.css'
			})
		)
		.pipe($.sassGlob())
		.pipe(
			$.sass({
				precision: 6,
				outputStyle: 'expanded'
			})
		)
		.pipe(
			$.size({
				showFiles: true
			})
		)
		.pipe(
			$.postcss([
				rucksack({
					fallbacks: true
				}),
				autoprefixer({
					grid: true,
					cascade: false
				})
			])
		)
		.pipe($.gcmq())
		.pipe($.csscomb())
		.pipe(
			$.cleanCSS({
				level: {
					1: {
						all: true,
						normalizeUrls: false
					},
					2: {
						all: false,
						removeEmpty: true,
						removeDuplicateFontRules: true,
						removeDuplicateMediaBlocks: true,
						removeDuplicateRules: true
					}
				}
			})
		)
		.pipe($.if(!prod, $.sourcemaps.write('.')))
		.pipe(
			$.if(
				prod,
				$.size({
					title: 'Minified CSS',
					showFiles: true
				})
			)
		)
		.pipe($.if(!prod, sync.stream()))
		.pipe(dest(config.sass.dest));
};

/**
 * Scripts
 */
export const js = () => {
	return (
		src(config.js.src, { allowEmpty: true })
			.pipe($.plumber())
			.pipe(named())
			.pipe(webpackStream(webpackConfig), webpack)
			.pipe(
				$.size({
					showFiles: true
				})
			)
			// .pipe($.if(prod, $.uglify()))
			.pipe(
				$.if(
					prod,
					$.rename({
						suffix: '.min'
					})
				)
			)
			.pipe(
				$.size({
					title: 'Minified JS',
					showFiles: true
				})
			)
			.pipe(dest(config.js.dest))
	);
};

/**
 * Vendors
 */
const vendors = Object.keys(pkg.dependencies || {});

export const vendorTask = () => {
	if (vendors.length === 0) {
		return new Promise((resolve) => {
			console.log(config.vendors.notification);
			resolve();
		});
	}

	return src(vendors.map((dependency) => './node_modules/' + dependency + '/**/*.*'), {
		base: './node_modules/'
	}).pipe(dest(config.vendors.dest));
};

/**
 * HTML Minify
 */
export const html = () => {
	return src('dist/**/*.html')
		.pipe($.plumber())
		.pipe(
			$.if(
				prod,
				$.htmlmin({
					removeComments: true,
					collapseWhitespace: true,
					collapseBooleanAttributes: false,
					removeAttributeQuotes: false,
					removeRedundantAttributes: false,
					minifyJS: true,
					minifyCSS: true
				})
			)
		)
		.pipe(
			$.if(
				prod,
				$.size({
					title: 'optimized HTML'
				})
			)
		)
		.pipe(dest('dist'));
};

/**
 * Clean
 */
export const clean_dist = () => {
	return del('dist');
};
export const clean_cache = (done) => {
	$.cache.clearAll();
	done();
};

/**
 * Copy
 */
export const copyHtml = (done) => {
	src(config.copy.html.src, { allowEmpty: true, since: lastRun(copyHtml) })
		.pipe($.plumber())
		.pipe(dest(config.copy.html.dest));
	done();
};

export const copyVendors = (done) => {
	src(config.copy.vendors.src, { allowEmpty: true, since: lastRun(copyVendors) })
		.pipe($.plumber())
		.pipe($.if('*.css', $.cleanCSS()))
		.pipe($.if('*.js', $.uglify()))
		.pipe($.if('*.css', dest(config.copy.vendors.css)))
		.pipe($.if('*.js', dest(config.copy.vendors.js)));
	done();
};

/**
 * Fonts
 */
export const fonts = (done) => {
	src(config.fonts.src, { allowEmpty: true, since: lastRun(fonts) })
		.pipe($.plumber())
		.pipe(dest(config.fonts.dest))
		.pipe(
			$.size({
				title: 'Fonts completed'
			})
		);
	done();
};

/**
 * Images
 */
export const images = () => {
	return src(config.image.src, { allowEmpty: true, since: lastRun(images) })
		.pipe($.plumber())
		.pipe($.changed(config.image.dest))
		.pipe(
			$.cache(
				$.imagemin(
					[
						$.imagemin.jpegtran({
							progressive: true
						}),
						pngquant({
							speed: 1,
							quality: [ 0.5, 0.5 ] // lossy settings
						}),
						zopfli({
							more: true
						}),
						giflossy({
							optimizationLevel: 3,
							optimize: 3, // keep-empty: Preserve empty transparent frames
							lossy: 2
						}),
						$.imagemin.svgo({
							plugins: [
								{
									removeViewBox: true
								},
								{
									cleanupIDs: true
								}
							]
						}),
						mozjpeg({
							quality: 90
						})
					],
					{
						verbose: true
					}
				)
			)
		)
		.pipe(dest(config.image.dest))
		.pipe(
			$.size({
				title: 'images'
			})
		);
};

/**
 * Convert to .webp
 */
export const webpImg = () => {
	return src(config.image.webp, { since: lastRun(webpImg) })
		.pipe($.plumber())
		.pipe(
			$.cache(
				$.imagemin([
					webp({
						quality: 75
					})
				])
			)
		)
		.pipe(extReplace('.webp'))
		.pipe(
			$.size({
				title: 'Coverted to webp'
			})
		)
		.pipe(dest(config.image.dest));
};

/**
 * Reload browser
 */
export const reload = (done) => {
	sync.reload();
	done();
};

/**
 * Watch and live reload
 */
export const serve = (done) => {
	sync.init({
		port: config.browsersync.port,
		ui: {
			port: config.browsersync.port + 1
		},
		server: {
			baseDir: 'dist'
		},
		logLevel: config.browsersync.debug ? 'debug' : '',
		injectChanges: true,
		notify: config.browsersync.notify,
		ghostMode: {
			clicks: config.browsersync.preferences.clicks,
			scroll: config.browsersync.preferences.scroll
		},
		open: config.browsersync.open // Toggle to automatically open page when starting.
	});

	done();

	watch(config.watch.scss).on('add', sass).on('change', sass);
	watch(config.watch.js).on('add', series(js, reload)).on('change', series(js, reload));
	watch(config.watch.html, series('copyHtml', reload));
	watch(config.watch.fonts).on('add', series(fonts, reload)).on('change', series(fonts, reload));
	watch(config.watch.images, series(images, webpImg, reload));
};

/**
 * Deploy
 */
export const deploy = (done) => {
	const live = prod ? 'netlify deploy --prod' : 'netlify deploy';
	shell.exec(live);
	done();
};

/**
 * Build site
 */
export const build = series(
	env,
	parallel(clean_dist, clean_cache),
	vendorTask,
	parallel(sass, js, fonts, images, copyHtml),
	parallel(webpImg, html),
	deploy
);

/**
 * Default
 */
export const dev = series(
	parallel(env, clean_dist),
	vendorTask,
	parallel(sass, js, fonts, images, copyHtml),
	webpImg,
	serve
);

export default dev;
