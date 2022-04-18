#!/usr/bin/env node

import { writeFileSync } from 'fs';
import * as rs from 'rad-scripts';
import { parse_tag_parameters, npm_update_version, git_changes, git_sync } from './version-control.js';

var tag_params = parse_tag_parameters(process.argv);


// callback to STAMP VERSION into module
const rs_stamp_callback_function = function(err, version) {
    if (err) throw err; // Check for the error and throw if it exists.

    npm_update_version(version);

    // Quietly reinstall, so we get any recently-made changes to usage.
    rs.run_command_quietly('npm install -g');

    // Directly update README.md with usage, whoop
    var readme = rs.run_command_sync('rad');

    // Let's add the version, and the most recent commits, to the readme, for fun.
    // Note that usage will not include this, only the README.md file.
    // But it should be visible on github/npm.
    readme += "Most recent commits...\n";
    readme += rs.run_command_sync('git-log 4')
    readme += "\nVersion "+version;
    readme += "\n";

    var filename = 'README.md';
    writeFileSync(filename, readme,'utf-8');
};

// SYNC and PUBLISH CHANGES
var changes = git_changes(process.cwd());

git_sync(process.cwd(),tag_params,rs_stamp_callback_function);

if (changes)
{
    // There were changes, so let's publish now.
    rs.run_command_sync_to_console('npm publish --access public');
}

// Quietly reinstall, so we get any recently-made remote changes.
rs.run_command_quietly('npm install -g');
