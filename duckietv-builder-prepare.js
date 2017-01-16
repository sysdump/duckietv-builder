#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    dateFormat = require('dateformat'),
    sharedConfig = require('./shared');

config.verbose = false;
config.fatal = true;


/**
 * Prepare release:
 * - creates directory structures needed for builds
 * - puts all generic files in place in each
 * - executes custom build options for each platform by including platforms/<platform>.js and calling preProcess
 */
program
    .description('prepare a duckietv build for all supported platforms')
    .option("-p, --platform [platforms]", "Build a specific platform (defaults to all: " + sharedConfig.platforms.join(","), function(val) {
        return val.toLowerCase().split(',');
    }, sharedConfig.platforms)
    .option("-n, --nightly", "do a nightly (version number set to today)")
    .parse(process.argv);



/**
 * Build process
 */

console.log("Building");

/**
 * Housekeeping. cleanup and re-init.
 */
var defaultDirs = ['output', sharedConfig.BINARY_OUTPUT_DIR, sharedConfig.BUILD_SOURCE_DIR, sharedConfig.BASE_OUTPUT_DIR + '/dist'];
var buildDirs = [];
rm('-rf', 'TMP'); // cleanup

program.platform.map(function(platform) {
    defaultDirs.push(sharedConfig.BUILD_DIR + '/' + platform);
    buildDirs.push(sharedConfig.BUILD_DIR + '/' + platform);
});

mkdir('-p', defaultDirs); // init intial structure

cd(sharedConfig.BUILD_SOURCE_DIR); // move into build source dir


/**
 * Make sure we have a copy of DuckieTV to work from
 */
sharedConfig.copyFilesToBase(); // copy duckietv sources (todo: replace with raw clone)

/**
 * Determine version based on nightly switch, save it to program global and to shared VERSION file.
 */
program.version = !program.nightly ? cat('VERSION') : dateFormat('yyyymmdd');
ShellString(program.version).to(sharedConfig.BASE_OUTPUT_DIR + "/VERSION");

/**
 * Build template cache, copy files into place for each output method, patch locales with 'nightly' prefix when needed.
 */
sharedConfig.buildTemplateCache(); // concat all html files into a templatecache module to speed up load times
sharedConfig.processTabHTML(); // grab all resources in tab.html and process / minify them for dist.
sharedConfig.copyDefaultResources(buildDirs); // copy the default resources (templates, images, fixtures) that are shared between all builds

if (program.nightly) {
    sharedConfig.addNightlyStrings(buildDirs); // add the 'Nightly' names in the right places.
}

/**
 * For each supported platform, run the preProcessor that does platform-specific things.
 */
program.platform.map(function(platform) {
    echo("Running build processor for " + platform);
    var processor = require('./platforms/' + platform).processor;
    processor.preProcess(program);
    echo("Done processing " + platform);
});

echo("Build preprocessor done");