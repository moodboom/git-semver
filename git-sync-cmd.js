#!/usr/bin/env node

import { parse_tag_parameters, git_sync } from './version-control.js';

var tag_params = parse_tag_parameters( process.argv );
git_sync( process.cwd(),tag_params );
