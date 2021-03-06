#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    shared = require('./shared'),
    opn = require('opn'),
    oauth = require('./oauth');

config.verbose = false;
config.fatal = true;


/**
 * Oauth initialisation for Chrome Webstore API
 * - Launches a browser where oauth grant is given and a one-time auth token can be copied from
 * - performs initial token request to grab access token, refresh token and max age
 * - stores these in ~/.duckietv-builder.json 
 */
program
    .description('Initialize oAuth token for chrome webstore api in ~/.duckietv-builder.json')
    .parse(process.argv);

var credentials = shared.getCredentials();

echo("Opening browser. Close the browser when you're done and paste the code here");
opn(oAuth.getApprovalPromptURL());
echo("paste the code here:\n");
process.stdin.setEncoding('utf8');
process.stdin.once('data', function(code) {

    var response = require('./oauth').generateInitialToken(code);
    if (response.error) {
        echo("Error:\n", response.error);
        process.exit();
    } else {
        echo("Credentials updated successfully.");
        process.exit();
    }
}).resume();