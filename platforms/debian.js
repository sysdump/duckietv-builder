require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');


/**
 * DuckieTV .deb build processor.
 * The .deb build takes a generic linux binary and uses debtool to make a .deb
 */

var BUILD_DIR = shared.BUILD_DIR + '/debian';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-ubuntu-%ARCHITECTURE%.deb';
var ARCHITECTURES = ['ia32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {

            ARCHITECTURES.map(function(arch) {
                var ARCH_BUILD_DIR = BUILD_DIR + "-" + arch + "/opt/DuckieTV";

                // create output dir for platform
                mkdir("-p", ARCH_BUILD_DIR);

                // copy generic sources 
                cp('-r', BUILD_DIR + "/*", ARCH_BUILD_DIR)

                cp('-r', __dirname + "/debian/*", BUILD_DIR + "-" + arch);

                // download and extract nwjs
                var EXTRACTED_NWJS = require('../nwjs-downloader')
                    .setDebug(options.nightly)
                    .setPlatform('linux')
                    .setArchitecture(arch)
                    .get();

                cp('-r', EXTRACTED_NWJS + "/*", ARCH_BUILD_DIR);
                //rename nw executable to DuckieTV-bin, so the wrapper script can run
                mv(ARCH_BUILD_DIR + "/nw", ARCH_BUILD_DIR + "/DuckieTV-bin");

                pushd(BUILD_DIR + "-" + arch);

                cat('DEBIAN/control')
                    .replace(/{{ARCHITECTURE}}/g, arch)
                    .replace(/{{VERSION}}/g, shared.getVersion())
                    .replace(/{{NIGHTLY}}/g, options.nightly ? ".nightly" : "")
                    .to('DEBIAN/control');

                exec("chmod -R 0755 usr/share/*");
                exec("chmod -R 0755 opt/*");

                popd();
            });

        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("Packing linux " + arch);
                pushd(shared.BUILD_DIR);
                var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME, arch);
                exec("debtool -a --build --md5sums debian-" + arch + " " + shared.BINARY_OUTPUT_DIR + "/" + targetFileName);
                echo("Packaging linux " + arch + " done.");
            });

        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};