#!/usr/bin/env node

import { parse_tag_parameters, git_sync } from './version-control.js';

// This script is designed to be run from within a git repo.
// It takes whatever code is in the working folder and pushes it out as the next semver release.
// By default, if there are code changes it will publish a patch release, but a major or minor release
// can be specified via optional params.
//
// Usage:
//     git-sync [--major|--minor] msg msg "msg with these [-?&|] should be quoted" ...
//
// The default "simple" git-sync command has no STAMP callback.
// The default "npm" git-sync command can automatically publish, like this:
//
//      import * as gs from '@moodboom/git-semver';
//      import { run_command_sync_to_console } from './run-utils.js';
//      const tag_params = gs.parse_tag_parameters(process.argv);
//      const stampFunction = (err, version) => {
//        if (err) throw err; // Check for the error and throw if it exists.
//        gs.npm_update_version(version);
//      };
//      var changes = gs.git_changes(process.cwd());
//      gs.git_sync(process.cwd(),tag_params,stampFunction);
//      if (changes)
//      {
//          // There were changes, so let's publish now.
//          run_command_sync_to_console('npm publish');
//      }
//
// See git-semver-sync-cmd.js for an example of how to make your own custom sync command.

var tag_params = parse_tag_parameters(process.argv);
git_sync(process.cwd(),tag_params);
