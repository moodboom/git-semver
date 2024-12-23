#!/usr/bin/env node

import { parse_tag_parameters, git_sync } from './version-control.js';

// This script is designed to be run from within a git repo.
// You can pass any number of params to the command; they will all be concatenated into a single commit message.

var tag_params = parse_tag_parameters( process.argv );
tag_params.notag = 1;

// Because we set notag, we won't be setting a tag via git_sync.
// Consider using the git-sync command instead!
git_sync( process.cwd(),tag_params );
